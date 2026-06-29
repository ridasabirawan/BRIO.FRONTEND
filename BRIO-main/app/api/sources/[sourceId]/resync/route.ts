import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { kbSources } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/utils/auth";

/**
 * Retry / resync a knowledge source. Re-runs ingestion for the EXISTING source
 * (clears its old vectors and re-embeds) by calling the ingest backend's
 * /api/reprocess-source endpoint. Does not create a duplicate row.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sourceId } = await params;

  // Verify the source belongs to the signed-in user.
  const [source] = await db
    .select()
    .from(kbSources)
    .where(and(eq(kbSources.id, sourceId), eq(kbSources.userId, session.user.id)));

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  // Derive the reprocess endpoint from the configured ingest endpoint.
  const ingestUrl =
    process.env.NEXT_PUBLIC_BRIO_INGEST_BACKEND ||
    "http://localhost:5000/api/ingest-source";
  const reprocessUrl = ingestUrl.replace(
    /\/api\/ingest-source\/?$/,
    "/api/reprocess-source"
  );

  try {
    const res = await fetch(reprocessUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId: source.id,
        chatbotId: source.chatbotId,
        type: source.type,
        sourceKey: source.sourceKey,
        content: source.sourceKey,
        userId: source.userId,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("reprocess backend error:", res.status, detail);
      return NextResponse.json(
        { error: "Failed to start reprocessing" },
        { status: 502 }
      );
    }

    // NOTE: do NOT write status here. The backend sets status to "processing"
    // synchronously before responding and then writes the terminal
    // "completed"/"failed" from its background task. A status write here could
    // race and clobber an already-finished terminal status back to "processing".
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("resync route error:", error);
    return NextResponse.json(
      { error: "Ingest backend unreachable" },
      { status: 502 }
    );
  }
}
