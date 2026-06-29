"use server";

import { db } from "../db";
import { and, eq, sql } from "drizzle-orm";
import { chatbots, DrizzleChatbot, subscriptions, users } from "../schema";
import { auth } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export async function updateUserSubscription(
  subscriptionId: string,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(subscriptions)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function updateChatbot(chatbotData: DrizzleChatbot) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(chatbots)
    .set(chatbotData)
    .where(eq(chatbots.id, chatbotData.id));
}

export async function incrementUserChatbotsCount(userId: string) {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const result = await db
    .select({
      noOfChatbots: users.noOfChatbots,
      planName: subscriptions.planName,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .where(eq(users.id, userId));

  if (!result.length) {
    throw new Error("User not found");
  }

  const userPlan = result[0].planName || "Free"; // Assuming planName is a field in the users table
  let maxChatbots;

  switch (userPlan) {
    case "Free":
      maxChatbots = 3;
      break;
    case "Basic Plan":
    case "Basic Yearly":
      maxChatbots = 5;
      break;
    case "Pro Plan":
    case "Pro Yearly":
      maxChatbots = 10;
      break;
    default:
      // Unknown/blank plan → fall back to Free limits.
      maxChatbots = 3;
  }

  const currentChatbotsCount = result[0].noOfChatbots;

  if (currentChatbotsCount >= maxChatbots) {
    throw new Error("Maximum number of chatbots reached for this plan");
  }

  await db
    .update(users)
    .set({ noOfChatbots: sql`${users.noOfChatbots} + 1` })
    .where(eq(users.id, userId));
}

async function getUserIdfromChatbot(chatbotId: string) {
  const result = await db
    .select({
      userId: chatbots.userId,
    })
    .from(chatbots)
    .where(eq(chatbots.id, chatbotId));

  return result[0].userId;
}

export async function incrementUserTokensCount(userId: string, tokens: number) {
  // Get the user plan
  const result = await db
    .select({
      noOfTokens: users.noOfTokens,
      planName: subscriptions.planName,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .where(eq(users.id, userId));

  if (!result.length) {
    throw new Error("User not found");
  }

  const userPlan = result[0].planName || "Free"; // Assuming planName is a field in the users table
  let maxTokens;

  switch (userPlan) {
    case "Free":
      maxTokens = 100000;
      break;
    case "Basic Plan":
    case "Basic Yearly":
      maxTokens = 300000;
      break;
    case "Pro Plan":
    case "Pro Yearly":
      maxTokens = 1000000;
      break;
    default:
      // Unknown/blank plan → fall back to Free limits instead of throwing.
      maxTokens = 100000;
  }

  const currentTokensCount = result[0].noOfTokens;

  // Hard cap: reject if this batch would push the user over the limit.
  if (currentTokensCount + tokens > maxTokens) {
    throw new Error("Maximum number of tokens reached for this plan");
  }

  await db
    .update(users)
    .set({ noOfTokens: sql`${users.noOfTokens} + ${tokens}` })
    .where(eq(users.id, userId));
}

export async function incrementUserSourcesCount(userId: string) {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const result = await db
    .select({
      noOfKnowledgeSources: users.noOfKnowledgeSources,
      planName: subscriptions.planName,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .where(eq(users.id, userId));

  if (!result.length) {
    throw new Error("User not found");
  }

  const userPlan = result[0].planName || "Free"; // Assuming planName is a field in the users table
  let maxKnowlegeSources;

  switch (userPlan) {
    case "Free":
      maxKnowlegeSources = 50;
      break;
    case "Basic Plan":
    case "Basic Yearly":
      maxKnowlegeSources = 150;
      break;
    case "Pro Plan":
    case "Pro Yearly":
      maxKnowlegeSources = 300;
      break;
    default:
      // Unknown/blank plan → fall back to Free limits.
      maxKnowlegeSources = 50;
  }

  const currentChatbotsCount = result[0].noOfKnowledgeSources;

  if (currentChatbotsCount >= maxKnowlegeSources) {
    throw new Error("Maximum number of sources reached for this plan");
  }

  await db
    .update(users)
    .set({ noOfKnowledgeSources: sql`${users.noOfKnowledgeSources} + 1` })
    .where(eq(users.id, userId));
}

export async function updateTokens(userId: string) {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({ noOfTokens: sql`${users.noOfTokens} + 1000` })
    .where(eq(users.id, userId));
}
export async function decrementUserSourcesCount(userId: string) {
  await db
    .update(users)
    .set({
      noOfKnowledgeSources: sql`
        CASE
          WHEN ${users.noOfKnowledgeSources} > 0
          THEN ${users.noOfKnowledgeSources} - 1
          ELSE 0
        END
      `,
    })
    .where(eq(users.id, userId));
}

export async function renameChatbot(chatbotId: string, name: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await db
      .update(chatbots)
      .set({ name })
      .where(
        and(
          eq(chatbots.id, chatbotId),
          eq(chatbots.userId, session.user.id)
        )
      );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Rename chatbot error:", error);
    return {
      success: false,
      message: "An error occurred while renaming the chatbot",
    };
  }
}