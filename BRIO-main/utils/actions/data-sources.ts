"use server";

import { db } from "@/drizzle/db";
import { kbSources } from "@/drizzle/schema";
import { deleteFromS3 } from "../s3-server";
import { and, eq } from "drizzle-orm";
import {
  deleteVectorsBySourceId,
  getPineconeClient,
} from "../pinecone";
import { convertToAscii } from "../../lib/utils";
import { revalidatePath } from "next/cache";
import { decrementUserSourcesCount } from "@/drizzle/queries/update";
import { auth } from "@/utils/auth";

// Source types whose content actually lives in S3. url / text / yt / sitemap
// store their content (a URL or raw text) in sourceKey and have no S3 object.
const S3_BACKED_TYPES = new Set(["pdf", "docx", "txt", "csv", "pptx", "img"]);

export async function deleteSource(sourceId: string) {
  // SECURITY: require an authenticated owner. Scope the lookup by userId so a
  // user can only delete their OWN source (prevents IDOR via guessed UUIDs).
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to use this");
  }

  const [source] = await db
    .select()
    .from(kbSources)
    .where(
      and(eq(kbSources.id, sourceId), eq(kbSources.userId, session.user.id))
    );

  if (!source) {
    throw new Error("Source not found");
  }

  // 1. Delete the underlying file from S3 — only for file-backed source types.
  if (S3_BACKED_TYPES.has(source.type) && source.sourceKey) {
    try {
      await deleteFromS3(source.sourceKey);
    } catch (error) {
      console.error("S3 delete failed (continuing):", error);
    }
  }

  // 2. Delete the source's vectors from Pinecone.
  //    Primary path: serverless-safe prefix delete (ids = `${sourceId}#...`).
  //    Fallback: legacy metadata-filter delete for vectors ingested before the
  //    id-prefix scheme (works only on pod indexes; harmless no-op otherwise).
  try {
    const removed = await deleteVectorsBySourceId(source.chatbotId, sourceId);
    console.log(`Deleted ${removed} Pinecone vectors for source:`, sourceId);

    if (removed === 0) {
      try {
        const client = getPineconeClient();
        const pineconeIndex = client.index(process.env.PINECONE_NAMESPACE!);
        const namespace = pineconeIndex.namespace(
          convertToAscii(source.chatbotId)
        );
        await namespace.deleteMany({ source: { $eq: source.sourceKey } });
      } catch (legacyError) {
        // Expected to throw on serverless indexes — safe to ignore.
        console.warn(
          "Legacy metadata-filter delete not supported (ignored)."
        );
      }
    }
  } catch (error) {
    console.error("Pinecone delete error (continuing):", error);
  }

  // 3. Delete from database + decrement the user's source counter.
  await db.delete(kbSources).where(eq(kbSources.id, sourceId));
  await decrementUserSourcesCount(source.userId);
  revalidatePath(`/dashboard/chatbot/${source.chatbotId}/train`);

  return { message: "Source deleted successfully" };
}
