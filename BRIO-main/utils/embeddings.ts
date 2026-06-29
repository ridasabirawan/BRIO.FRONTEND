// Embeddings via OpenRouter (OpenAI-compatible). Returns 1536-dim vectors
// (text-embedding-ada-002) to match the existing Pinecone index.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL || "text-embedding-ada-002";

export async function getEmbeddings(text: string) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.AUTH_URL || "http://localhost:3000",
        "X-Title": "Brio.chat",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.replace(/\n/g, " "),
      }),
    });
    const result = await response.json();
    if (!response.ok || !result?.data?.[0]?.embedding) {
      const detail = result?.error?.message || JSON.stringify(result);
      throw new Error(`OpenRouter embeddings request failed: ${detail}`);
    }
    return result.data[0].embedding as number[];
  } catch (error) {
    console.log("error calling embeddings api", error);
    throw error;
  }
}
