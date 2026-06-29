"use server";

import { auth } from "@/utils/auth";
import { db } from "../db";
import { conversations, chatbots, users, kbSources } from "../schema";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { deleteFromS3 } from "@/utils/s3-server";
import { deleteChatbotNamespace } from "@/utils/pinecone";

// Source types whose content lives in S3 (mirrors data-sources.ts).
const S3_BACKED_TYPES = new Set(["pdf", "docx", "txt", "csv", "pptx", "img"]);

export async function deleteChat(chatId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "You must be signed in to use this" };
  }

  try {
    // Scope by owner so a user can only delete their OWN conversation (IDOR).
    await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.id, chatId),
          eq(conversations.userId, session.user.id)
        )
      );
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete chat error:", error);

    return {
      success: false,
      message: "An error occurred while deleting the conversation.",
    };
  }
}

export async function deleteChatbot(chatbotId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "You must be signed in to use this" };
  }

  try {
    // SECURITY: verify the caller owns this chatbot BEFORE any destructive
    // cleanup. Otherwise an authenticated user could pass someone else's
    // chatbotId and wipe their S3 files / Pinecone vectors (IDOR).
    const owned = await db
      .select({ id: chatbots.id })
      .from(chatbots)
      .where(
        and(eq(chatbots.id, chatbotId), eq(chatbots.userId, session.user.id))
      );

    if (!owned.length) {
      return { success: false, message: "Chatbot not found." };
    }

    // Ownership confirmed — fetch sources and clean up S3 + Pinecone before the
    // DB rows cascade-delete. Scope by userId as defence-in-depth.
    const sources = await db
      .select()
      .from(kbSources)
      .where(
        and(
          eq(kbSources.chatbotId, chatbotId),
          eq(kbSources.userId, session.user.id)
        )
      );

    // Remove all S3 files belonging to this chatbot's sources.
    for (const source of sources) {
      if (S3_BACKED_TYPES.has(source.type) && source.sourceKey) {
        try {
          await deleteFromS3(source.sourceKey);
        } catch (error) {
          console.error(`S3 delete failed for source ${source.id}:`, error);
        }
      }
    }

    // Drop the chatbot's entire Pinecone namespace (all of its vectors).
    try {
      await deleteChatbotNamespace(chatbotId);
    } catch (error) {
      console.error("Pinecone namespace delete failed (continuing):", error);
    }

    const deletedChatbot = await db
      .delete(chatbots)
      .where(
        and(
          eq(chatbots.id, chatbotId),
          eq(chatbots.userId, session.user.id)
        )
      )
      .returning();

    if (!deletedChatbot.length) {
      return { success: false, message: "Chatbot not found." };
    }

    await db
      .update(users)
      .set({
        noOfChatbots: sql`GREATEST(${users.noOfChatbots} - 1, 0)`,
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete chatbot error:", error);

    return {
      success: false,
      message: "An error occurred while deleting the chatbot.",
    };
  }
}