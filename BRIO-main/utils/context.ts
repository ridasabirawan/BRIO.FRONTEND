import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "@/lib/utils";
import { db } from "@/drizzle/db";
import { kbSources } from "@/drizzle/schema";
import { and, eq, inArray, or } from "drizzle-orm";

// Retrieval tuning.
const TOP_K = 8; // pull more candidates so multiple sources can contribute
const SCORE_THRESHOLD = 0.6; // cosine floor (ada-002 scores are compressed/high)
const CONTEXT_CHAR_BUDGET = 6000; // combined context size sent to the model

type VectorMetadata = {
  text?: string;
  pageNumber?: number;
  source?: string; // sourceKey (S3 key / url / label)
  sourceId?: string; // kb_sources.id (added by the new ingest pipeline)
  url?: string;
};

/** A retrieved chunk, enriched with its originating source for citations. */
export type RetrievedChunk = {
  sourceId: string | null;
  sourceName: string;
  sourceType: string;
  sourceUrl: string;
  pageNumber: number | null;
  score: number;
  snippet: string;
};

export type ContextResult = {
  contextText: string;
  /** Deduplicated, per-source citations (highest-scoring chunk per source). */
  sources: RetrievedChunk[];
  hasContext: boolean;
};

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  chatbotId: string
) {
  try {
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = await client.index(process.env.PINECONE_NAMESPACE!);
    const namespace = pineconeIndex.namespace(convertToAscii(chatbotId));
    const queryResult = await namespace.query({
      topK: TOP_K,
      vector: embeddings,
      includeMetadata: true,
    });

    return queryResult.matches || [];
  } catch (error) {
    console.log("error querying embeddings", error);
    throw error;
  }
}

/**
 * Retrieve relevant chunks for a query and resolve each one back to its
 * kb_sources row so responses can cite the source document / file / url / page.
 */
export async function getContext(
  query: string,
  chatbotId: string
): Promise<ContextResult> {
  const queryEmbeddings = await getEmbeddings(query);
  const matches = await getMatchesFromEmbeddings(queryEmbeddings, chatbotId);

  const qualifying = matches.filter(
    (m) => typeof m.score === "number" && m.score >= SCORE_THRESHOLD
  );

  if (qualifying.length === 0) {
    return { contextText: "", sources: [], hasContext: false };
  }

  // Collect the identifiers we can use to look up the originating source rows.
  const sourceIds = new Set<string>();
  const sourceKeys = new Set<string>();
  for (const m of qualifying) {
    const md = (m.metadata || {}) as VectorMetadata;
    if (md.sourceId) sourceIds.add(md.sourceId);
    if (md.source) sourceKeys.add(md.source);
  }

  // One DB round-trip: fetch source rows by id (new vectors) or sourceKey (legacy).
  const conditions = [];
  if (sourceIds.size > 0)
    conditions.push(inArray(kbSources.id, Array.from(sourceIds)));
  if (sourceKeys.size > 0)
    conditions.push(inArray(kbSources.sourceKey, Array.from(sourceKeys)));

  const rows =
    conditions.length > 0
      ? await db
          .select({
            id: kbSources.id,
            name: kbSources.name,
            type: kbSources.type,
            sourceKey: kbSources.sourceKey,
            sourceUrl: kbSources.sourceUrl,
          })
          .from(kbSources)
          .where(and(eq(kbSources.chatbotId, chatbotId), or(...conditions)))
      : [];

  const byId = new Map(rows.map((r) => [r.id, r]));
  const byKey = new Map(rows.map((r) => [r.sourceKey, r]));

  // Build context text (capped) + per-source citations (best chunk per source).
  let contextText = "";
  const bestPerSource = new Map<string, RetrievedChunk>();

  for (const m of qualifying) {
    const md = (m.metadata || {}) as VectorMetadata;
    const text = md.text || "";
    const row =
      (md.sourceId && byId.get(md.sourceId)) ||
      (md.source && byKey.get(md.source)) ||
      undefined;

    // Only a chunk actually added to the context becomes a citation — keeps
    // `hasContext` and `sources` consistent (no "N sources used" under a
    // "not found" answer, and no citing chunks dropped past the budget).
    if (!text) continue;
    if (contextText.length >= CONTEXT_CHAR_BUDGET) continue;

    const sourceLabel = row?.name || "Knowledge base";
    contextText += `\n[Source: ${sourceLabel}]\n${text}\n`;

    const dedupeKey = row?.id || md.sourceId || md.source || m.id;
    const chunk: RetrievedChunk = {
      sourceId: row?.id || md.sourceId || null,
      sourceName: row?.name || "Unknown source",
      sourceType: row?.type || "unknown",
      sourceUrl: row?.sourceUrl || md.url || "",
      pageNumber: typeof md.pageNumber === "number" ? md.pageNumber : null,
      score: m.score || 0,
      snippet: text.slice(0, 240).trim(),
    };

    const existing = bestPerSource.get(dedupeKey);
    if (!existing || chunk.score > existing.score) {
      bestPerSource.set(dedupeKey, chunk);
    }
  }

  const sources = Array.from(bestPerSource.values()).sort(
    (a, b) => b.score - a.score
  );

  return {
    contextText: contextText.slice(0, CONTEXT_CHAR_BUDGET),
    sources,
    hasContext: contextText.trim().length > 0,
  };
}
