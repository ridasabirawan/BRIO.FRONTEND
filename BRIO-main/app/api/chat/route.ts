import { Message, streamText, StreamData } from "ai";
import { getContext } from "@/utils/context";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { conversations, messages as _messages } from "@/drizzle/schema";
import { createOpenAI } from "@ai-sdk/openai";
import {
  incrementResponseCount,
  incrementTokenCount,
} from "@/utils/analytics/update";

// Route chat completions through OpenRouter (OpenAI-compatible API).
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": process.env.AUTH_URL || "http://localhost:3000",
    "X-Title": "Brio.chat",
  },
});
const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-4o-mini";
import { createConversationWithoutUserId } from "@/drizzle/queries/insert";
import { incrementUserTokensCount } from "@/drizzle/queries/update";
import { getUserIdFromChatbot } from "@/drizzle/queries/select";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, chatId, chatbotId } = await req.json();

    //Check if chat exists
    const _chats = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, chatId));
    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }
    const lastMessage = messages[messages.length - 1];

    // If this is the first message, update the conversation's firstMessage
    if (messages.length === 1) {
      await db
        .update(conversations)
        .set({ firstMessage: lastMessage.content })
        .where(eq(conversations.id, chatId));
    }

    // Store the user message
    await db.insert(_messages).values({
      conversationId: chatId,
      content: lastMessage.content,
      role: "user",
    });


    const { contextText, sources, hasContext } = await getContext(
      lastMessage.content,
      chatbotId
    );

    const noAnswerMessage =
      "I couldn't find information related to this question in the uploaded knowledge sources. Please upload a document containing this information.";

    const systemPrompt = `
You are BRIO.CHAT, an AI assistant that answers questions ONLY using the provided knowledge-base context.

<context>
${hasContext ? contextText : "NO RELEVANT CONTEXT WAS FOUND IN THE UPLOADED KNOWLEDGE BASE."}
</context>

Rules:

1. Answer factual questions using ONLY the information present in the context above. The context may combine multiple uploaded sources — use all of them as needed.
2. NEVER invent, assume, or use outside knowledge for factual questions. Do not hallucinate.
3. Use the earlier messages in THIS conversation to understand follow-up questions (e.g. "tell me more about that", "and its history?") and to answer questions about the conversation itself (e.g. "what did I just ask?", "summarize what we discussed"). Treat the conversation so far as short-term memory.
4. If a factual question's answer is not in the context above and cannot be derived from an earlier grounded answer in this conversation, respond with EXACTLY this sentence and nothing else:
   "${noAnswerMessage}"
5. If the user asks for a summary, what a document is about, what a file contains, or to explain the document, summarize the relevant context instead of refusing.
6. Questions about any person, organization, university, company, location, date, topic or keyword that appears in the context ARE considered related to the context.

Format your response using Markdown with headings and bullet points when appropriate.
`;

    // Stream the retrieved sources to the client as a message annotation so the
    // UI can render which document(s), file name(s), URL(s) and chunks were used.
    const data = new StreamData();
    data.appendMessageAnnotation({
      type: "sources",
      hasContext,
      sources,
    });

    // Pass the full conversation (capped) so the model has memory of earlier
    // turns. The DB stores assistant replies with role "system", and useChat
    // uses "assistant" for live ones — normalise both to "assistant".
    const MAX_TURNS = 12;
    const conversation = (messages as Message[])
      .filter(
        (m) =>
          m.content &&
          (m.role === "user" || m.role === "assistant" || m.role === "system")
      )
      .slice(-MAX_TURNS)
      .map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: m.content,
      }));

    const result = streamText({
      model: openrouter.chat(CHAT_MODEL),
      system: systemPrompt,
      messages: conversation,

      // Cap the response length. Without this the provider reserves the model's
      // full context for output (16k for gpt-4o-mini), which both wastes credits
      // and makes OpenRouter reject the request with a 402 when the account
      // can't pre-fund that many tokens. Chatbot answers never need this much.
      maxTokens: Number(process.env.OPENROUTER_MAX_TOKENS) || 1024,

      // Runs only on successful completion. Persist the answer + analytics here.
      // Do NOT close `data` or throw here — closing is handled below so it also
      // happens when the stream errors (onFinish never fires on error in v4).
      async onFinish({ text, usage }) {
        try {
          await db.insert(_messages).values({
            conversationId: chatId,
            content: text,
            role: "system",
          });

          const userId = await getUserIdFromChatbot(chatbotId);
          if (!userId) {
            console.error("userId not found for chatbot", chatbotId);
            return;
          }

          await incrementResponseCount(userId, chatbotId);
          await incrementTokenCount(userId, chatbotId, usage.totalTokens);
          await incrementUserTokensCount(userId, usage.totalTokens);
        } catch (err) {
          console.error("chat onFinish persistence error:", err);
        }
      },
    });

    // Close the StreamData when generation settles — on success OR error — so
    // the merged data stream always terminates and never leaks on failure.
    result.text.then(
      () => data.close(),
      (err) => {
        console.error("chat stream error:", err);
        data.close();
      }
    );

    return result.toDataStreamResponse({
      data,
      getErrorMessage: () =>
        "An error occurred while generating the response. Please try again.",
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
