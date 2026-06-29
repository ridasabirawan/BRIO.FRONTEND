"use server";

import { db } from "@/drizzle/db";
import {
  users,
  subscriptions,
  chatbots,
  kbSources,
  messages,
  tokens,
  conversationCounts,
  responses,
  recentSubscriptions,
  activityLogs,
} from "@/drizzle/schema";
import { auth } from "@/utils/auth";
import { and, count } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { eq, gte, sql, or, ilike } from "drizzle-orm";
import { Resend } from "resend";
import SourceDeleted from "@/components/emails/source-deleted";
import { revalidatePath } from "next/cache";
import { deleteVectorsBySourceId } from "@/utils/pinecone";
import { deleteFromS3 } from "@/utils/s3-server";
import { decrementUserSourcesCount } from "@/drizzle/queries/update";

const resend = new Resend(process.env.RESEND_API_KEY!);

const S3_BACKED_TYPES = new Set(["pdf", "docx", "txt", "csv", "pptx", "img"]);

/** Append an admin action to the audit trail. Best-effort: never throws. */
async function logActivity(entry: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
}) {
  try {
    await db.insert(activityLogs).values(entry);
  } catch (err) {
    console.error("activity log write failed:", err);
  }
}

export async function getActivityLogs(limit: number = 100) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("You must be an admin to view activity logs");
  }
  return db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function getAdminDashboardStats() {
  const session = await auth(); // Assuming you have a function to get the session

  if (!session || session.user.role !== "admin") {
    throw new Error("You must be an admin to access user details");
  }

  const [
    activeSubscriptionsCount,
    totalUsersCount,
    totalKnowledgeSourcesCount,
    totalChatbotsCount,
  ] = await Promise.all([
    db
      .select({
        count: sql<number>`count(distinct ${subscriptions.userId})`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionStatus, "active")),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(kbSources),
    db.select({ count: count() }).from(chatbots),
  ]);

  return {
    activeSubscriptions: Number(activeSubscriptionsCount[0].count),
    totalUsers: totalUsersCount[0].count,
    totalKnowledgeSources: totalKnowledgeSourcesCount[0].count,
    totalChatbots: totalChatbotsCount[0].count,
  };
}

export async function getRecentSubscriptions(limit: number = 5) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("You must be an admin to view subscriptions");
  }

  return db
    .select({
      id: recentSubscriptions.id,
      planName: recentSubscriptions.planName,
      createdAt: recentSubscriptions.createdAt,
      userId: recentSubscriptions.userId,
      user: {
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(recentSubscriptions)
    .leftJoin(users, eq(users.id, recentSubscriptions.userId))
    .orderBy(desc(recentSubscriptions.createdAt))
    .limit(limit);
}

export async function getAnalytics(days: number = 30) {
  const session = await auth(); // Assuming you have a function to get the session

  if (!session || session.user.role !== "admin") {
    throw new Error("You must be an admin to access user details");
  }
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Aggregate per calendar day across all users/chatbots within the window, so
  // each chart shows one bar per day (not one row per user) for the last N days.
  const tokensResult = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${tokens.date}), 'YYYY-MM-DD')`,
      tokens: sql<number>`coalesce(sum(${tokens.dailyTokens}), 0)`,
    })
    .from(tokens)
    .where(gte(tokens.date, startDate))
    .groupBy(sql`date_trunc('day', ${tokens.date})`)
    .orderBy(sql`date_trunc('day', ${tokens.date})`);

  const responsesResult = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${responses.date}), 'YYYY-MM-DD')`,
      responses: sql<number>`coalesce(sum(${responses.dailyResponses}), 0)`,
    })
    .from(responses)
    .where(gte(responses.date, startDate))
    .groupBy(sql`date_trunc('day', ${responses.date})`)
    .orderBy(sql`date_trunc('day', ${responses.date})`);

  const conversationResult = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${conversationCounts.date}), 'YYYY-MM-DD')`,
      chats: sql<number>`coalesce(sum(${conversationCounts.conversationCount}), 0)`,
    })
    .from(conversationCounts)
    .where(gte(conversationCounts.date, startDate))
    .groupBy(sql`date_trunc('day', ${conversationCounts.date})`)
    .orderBy(sql`date_trunc('day', ${conversationCounts.date})`);

  return {
    tokens: tokensResult.map((r) => ({ date: r.date, tokens: Number(r.tokens) })),
    responses: responsesResult.map((r) => ({
      date: r.date,
      responses: Number(r.responses),
    })),
    conversations: conversationResult.map((r) => ({
      date: r.date,
      chats: Number(r.chats),
    })),
  };
}

export const getUserDetails = async (userId: string) => {
  const session = await auth(); // Assuming you have a function to get the session

  if (!session || session.user.role !== "admin") {
    throw new Error("You must be an admin to access user details");
  }

  const userDetailsResult = await db
    .select({
      id: users.id,
      image: users.image,
      name: users.name,
      email: users.email,
      role: users.role,
      noOfTokens: users.noOfTokens,
      noOfKnowledgeSources: users.noOfKnowledgeSources,
      noOfChatbots: users.noOfChatbots,
      planName: subscriptions.planName,
      banned: users.banned,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .where(eq(users.id, userId));

  return userDetailsResult[0]; // Return the first result
};

export async function updateUserRole(formData: FormData) {
  const session = await auth(); // Assuming you have a function to get the session

  if (!session || session.user.role !== "admin") {
    throw new Error("You must be an admin to update user roles");
  }

  const userId = formData.get("userId") as string;
  const selectedRole = formData.get("selectedRole") as string;

  if (!userId || !selectedRole) {
    throw new Error("User ID and selected role must be provided");
  }

  // Only allow known roles (the server action must not trust the client).
  if (!["user", "admin"].includes(selectedRole)) {
    throw new Error("Invalid role");
  }

  // Prevent an admin from demoting themselves (avoids accidental lockout).
  if (userId === session.user.id && selectedRole !== "admin") {
    throw new Error("You cannot change your own admin role.");
  }

  const updated = await db
    .update(users)
    .set({ role: selectedRole })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (updated.length === 0) {
    throw new Error("User not found");
  }

  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "update_role",
    targetType: "user",
    targetId: userId,
    detail: `Set role to "${selectedRole}"`,
  });

  revalidatePath("/admin/users");
  return { message: "User role updated successfully" };
}

export async function banUser(userId: string, banOption: string) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    throw new Error("You must be an admin to ban user");
  }

  if (!userId) {
    throw new Error("User ID must be provided");
  }

  if (userId === session.user.id) {
    throw new Error("You cannot ban yourself.");
  }

  const banned = banOption === "true";
  const updated = await db
    .update(users)
    .set({ banned })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (updated.length === 0) {
    throw new Error("User not found");
  }

  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: banned ? "ban_user" : "unban_user",
    targetType: "user",
    targetId: userId,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { message: banned ? "User banned successfully" : "User unbanned" };
}

export async function getKnowledgeSources(
  userId: string,
  query: string = "",
  page: number = 1,
  pageSize: number = 10
) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    throw new Error("You must be an admin to access sources");
  }

  if (!userId) {
    throw new Error("User ID must be provided");
  }

  const offset = (page - 1) * pageSize;

  const sources = await db
    .select()
    .from(kbSources)
    .where(
      and(
        eq(kbSources.userId, userId),
        query
          ? or(
              ilike(kbSources.name, `%${query}%`),
              ilike(kbSources.type, `%${query}%`)
            )
          : undefined
      )
    )
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(kbSources.createdAt));

  const totalSources = await db
    .select({ count: sql<number>`count(*)` })
    .from(kbSources)
    .where(
      and(
        eq(kbSources.userId, userId),
        query
          ? or(
              ilike(kbSources.name, `%${query}%`),
              ilike(kbSources.type, `%${query}%`)
            )
          : undefined
      )
    );

  return {
    sources,
    totalSources: Number(totalSources[0].count),
  };
}

export async function deleteSource(
  sourceId: string,
  sendEmail: boolean = false
) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    throw new Error("You must be an admin to delete sources");
  }

  // Get source details before deletion (null-check BEFORE any dereference).
  const [source] = await db
    .select()
    .from(kbSources)
    .where(eq(kbSources.id, sourceId));

  if (!source) {
    throw new Error("Source not found");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, source.userId));

  // Clean up the underlying file + vectors, not just the DB row (mirrors the
  // user-facing deleteSource so deleted knowledge is truly gone).
  if (S3_BACKED_TYPES.has(source.type) && source.sourceKey) {
    try {
      await deleteFromS3(source.sourceKey);
    } catch (error) {
      console.error("admin deleteSource S3 error (continuing):", error);
    }
  }
  try {
    await deleteVectorsBySourceId(source.chatbotId, sourceId);
  } catch (error) {
    console.error("admin deleteSource Pinecone error (continuing):", error);
  }

  // Delete the source row
  await db.delete(kbSources).where(eq(kbSources.id, sourceId));

  // Send email if requested and email is available
  if (sendEmail && user?.email) {
    await resend.emails.send({
      from: "Brio.chat <onboarding@resend.dev>",
      to: [user.email || ""],
      subject: "Knowledge Source Deleted",
      react: SourceDeleted({
        firstName: user.name || "",
        sourceName: source.name || "",
      }),
    });
  }

  // Keep the owner's source counter in sync (mirrors the user-facing delete).
  try {
    await decrementUserSourcesCount(source.userId);
  } catch (e) {
    console.error("decrement source counter failed:", e);
  }

  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "delete_source",
    targetType: "kb_source",
    targetId: sourceId,
    detail: source.name || undefined,
  });

  revalidatePath(`/admin/users/${source.userId}`);

  return { success: true };
}
