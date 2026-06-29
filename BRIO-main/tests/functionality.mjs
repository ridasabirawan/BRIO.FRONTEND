/**
 * Brio.chat — end-to-end functionality test suite.
 *
 * Verifies the whole stack: env, DB, OpenRouter (chat + embeddings), Pinecone,
 * S3 presigned access (the 403 fix), the document ingest pipeline, and RAG chat.
 *
 * PREREQUISITES (both must be running):
 *   1. Frontend:  npm run dev            (http://localhost:3000)
 *   2. Backend:   npm run dev   in brio-backend-main   (http://localhost:5000)
 *
 * RUN:  npm run test:e2e
 *
 * It creates a temporary user + chatbot, runs a real document through the
 * pipeline, asks a question, then deletes everything it created.
 */
import { neon } from "@neondatabase/serverless";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Pinecone } from "@pinecone-database/pinecone";
import { readFileSync } from "fs";
import crypto from "crypto";

const FRONTEND = "http://localhost:3000";
const BACKEND =
  process.env.NEXT_PUBLIC_BRIO_INGEST_BACKEND ||
  "http://localhost:5000/api/ingest-source";
const OR_BASE = "https://openrouter.ai/api/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sql = neon(process.env.DATABASE_URL);
const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.AWS_S3_BUCKET;

// ---- tiny test runner ----
let passed = 0,
  failed = 0;
const log = [];
async function test(name, fn) {
  process.stdout.write(`• ${name} ... `);
  try {
    await fn();
    console.log("PASS ✅");
    log.push(["PASS", name]);
    passed++;
  } catch (e) {
    console.log("FAIL ❌  " + e.message);
    log.push(["FAIL", name, e.message]);
    failed++;
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

// shared state created during the pipeline test (and cleaned up at the end)
const state = { userId: null, chatbotId: null, sourceKey: null, convId: null };

console.log("\n=== Brio.chat functionality tests ===\n");

// 1) Config
await test("TC1  Required environment variables are set", async () => {
  for (const k of [
    "DATABASE_URL",
    "OPENROUTER_API_KEY",
    "AWS_S3_BUCKET",
    "AWS_S3_REGION",
    "AWS_S3_ACCESS_KEY_ID",
    "AWS_S3_SECRET_ACCESS_KEY",
    "PINECONE_API_KEY",
    "PINECONE_NAMESPACE",
  ])
    assert(process.env[k], `missing ${k}`);
});

// 2) Database
await test("TC2  Database (Neon) connection works", async () => {
  const r = await sql`select 1 as ok`;
  assert(r[0].ok === 1, "unexpected result");
});

// 3) OpenRouter chat
await test("TC3  OpenRouter chat completion works", async () => {
  const r = await fetch(`${OR_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-4o-mini",
      messages: [{ role: "user", content: "Reply with the single word OK" }],
      max_tokens: 5,
    }),
  });
  const j = await r.json();
  assert(
    r.ok && j.choices?.[0]?.message?.content,
    "no completion: " + JSON.stringify(j.error || j)
  );
});

// 4) OpenRouter embeddings
await test("TC4  OpenRouter embeddings return 1536-dim vectors", async () => {
  const r = await fetch(`${OR_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_EMBEDDING_MODEL || "text-embedding-ada-002",
      input: "brio functionality test",
    }),
  });
  const j = await r.json();
  const dim = j.data?.[0]?.embedding?.length;
  assert(dim === 1536, "expected 1536, got " + dim);
});

// 5) Pinecone
await test("TC5  Pinecone index exists with dimension 1536", async () => {
  const r = await fetch(
    `https://api.pinecone.io/indexes/${process.env.PINECONE_NAMESPACE}`,
    { headers: { "Api-Key": process.env.PINECONE_API_KEY } }
  );
  const j = await r.json();
  assert(r.ok, "index not found: " + JSON.stringify(j));
  assert(j.dimension === 1536, "dimension is " + j.dimension);
});

// 6) S3 presigned access (the 403 fix)
await test("TC6  S3 presigned GET returns 200 (raw object is private/403)", async () => {
  const key = `__e2e_test__/${Date.now()}.txt`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: "brio test object",
      ContentType: "text/plain",
    })
  );
  const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
  const pub = await fetch(publicUrl);
  const signed = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 300 }
  );
  const sig = await fetch(signed);
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  assert(pub.status === 403, "raw object should be 403, got " + pub.status);
  assert(sig.status === 200, "presigned GET should be 200, got " + sig.status);
});

// 7) Backend health
await test("TC7  Ingest backend is reachable", async () => {
  const r = await fetch(BACKEND, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert(r.status === 400, "expected 400 for empty body, got " + r.status);
});

// 8) Full ingest pipeline
await test("TC8  Document ingest pipeline: upload → embed → completed", async () => {
  state.userId = crypto.randomUUID();
  await sql`insert into "user" (id, email, name, role) values (${state.userId}, ${"e2e-" + Date.now() + "@brio-test.local"
    }, 'E2E Test', 'user')`;
  const cb =
    await sql`insert into chatbots ("userId", name) values (${state.userId}, 'E2E Test Bot') returning id`;
  state.chatbotId = cb[0].id;
  state.sourceKey = `${state.chatbotId}/${Date.now()}-test.pdf`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: state.sourceKey,
      Body: readFileSync("public/test.pdf"),
      ContentType: "application/pdf",
    })
  );
  const res = await fetch(BACKEND, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_key: state.sourceKey,
      file_name: "test.pdf",
      type: "pdf",
      userId: state.userId,
      chatbotId: state.chatbotId,
    }),
  });
  const j = await res.json();
  assert(j.sourceId, "no sourceId returned");
  let status = "processing";
  for (let i = 0; i < 20 && status === "processing"; i++) {
    await sleep(2000);
    const r = await sql`select status from kb_sources where id = ${j.sourceId}`;
    status = r[0]?.status;
  }
  assert(status === "completed", "final status was '" + status + "'");
});

// 9) Vectors landed in Pinecone
await test("TC9  Embeddings were stored in Pinecone", async () => {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(process.env.PINECONE_NAMESPACE);
  const stats = await index.describeIndexStats();
  const ns = stats.namespaces?.[state.chatbotId];
  assert(ns && ns.recordCount > 0, "no vectors in namespace " + state.chatbotId);
});

// 10) RAG chat
await test("TC10 Chat answers a question using the document (RAG)", async () => {
  const conv =
    await sql`insert into conversations ("userId","chatbotId") values (${state.userId}, ${state.chatbotId}) returning id`;
  state.convId = conv[0].id;
  const res = await fetch(`${FRONTEND}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "What is this document about?" }],
      chatId: state.convId,
      chatbotId: state.chatbotId,
    }),
  });
  assert(res.status === 200, "chat returned HTTP " + res.status);
  const raw = await res.text();
  let answer = "";
  for (const line of raw.split("\n")) {
    const m = line.match(/^0:"(.*)"$/);
    if (m) answer += m[1];
  }
  assert(answer.trim().length > 20, "answer too short: " + answer.slice(0, 80));
});

// 11) Cleanup
await test("TC11 Cleanup temp data (DB cascade + S3 + Pinecone)", async () => {
  if (state.sourceKey)
    await s3
      .send(new DeleteObjectCommand({ Bucket: BUCKET, Key: state.sourceKey }))
      .catch(() => { });
  if (state.chatbotId) {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    await pc
      .index(process.env.PINECONE_NAMESPACE)
      .namespace(state.chatbotId)
      .deleteAll()
      .catch(() => { });
  }
  if (state.userId) await sql`delete from "user" where id = ${state.userId}`; // cascades chatbot/sources/convos/messages
});

// summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
