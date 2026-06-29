import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "@/lib/utils";

export const getPineconeClient = () => {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

/**
 * Delete every vector belonging to a single source from a chatbot's namespace.
 *
 * Serverless Pinecone indexes do NOT support metadata-filtered deletes, so we
 * enumerate vector IDs by their `${sourceId}#` prefix (set at ingest time) and
 * delete them by ID in batches. Returns the number of vectors removed.
 */
export async function deleteVectorsBySourceId(
  chatbotId: string,
  sourceId: string
): Promise<number> {
  const client = getPineconeClient();
  const index = client.index(process.env.PINECONE_NAMESPACE!);
  const namespace = index.namespace(convertToAscii(chatbotId));

  const prefix = `${sourceId}#`;
  let deleted = 0;
  let paginationToken: string | undefined;

  do {
    const page: any = await namespace.listPaginated({
      prefix,
      paginationToken,
    });

    const ids: string[] = (page?.vectors || [])
      .map((v: any) => v.id)
      .filter(Boolean);

    if (ids.length > 0) {
      await namespace.deleteMany(ids);
      deleted += ids.length;
    }

    paginationToken = page?.pagination?.next;
  } while (paginationToken);

  return deleted;
}

/**
 * Delete an entire chatbot's namespace (all vectors). Used when a chatbot is
 * deleted. No-ops gracefully if the namespace doesn't exist.
 */
export async function deleteChatbotNamespace(chatbotId: string): Promise<void> {
  const client = getPineconeClient();
  const index = client.index(process.env.PINECONE_NAMESPACE!);
  const namespace = index.namespace(convertToAscii(chatbotId));
  try {
    await namespace.deleteAll();
  } catch (error: any) {
    // On serverless Pinecone, deleteAll() against a namespace that doesn't exist
    // (e.g. a chatbot that never ingested a source) rejects with a 404. Treat
    // that as a successful no-op; re-throw anything else.
    const status = error?.status ?? error?.cause?.status;
    const msg = String(error?.message || "").toLowerCase();
    if (status === 404 || msg.includes("not found") || msg.includes("404")) {
      return;
    }
    throw error;
  }
}
