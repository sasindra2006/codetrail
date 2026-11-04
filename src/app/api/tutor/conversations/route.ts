import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { getDatabase } from "@/lib/db";
import { tutorConversations, tutorDailyUsage } from "@/lib/db/schema";
import { getTutorConfiguration } from "@/lib/tutor/provider";
import { getTutorDailyLimit, hasTutorConsent, readJsonLimited, tutorError } from "@/lib/tutor/server";

const createSchema = z.object({ title: z.string().trim().min(1).max(120).optional() }).strict();

export async function GET(request: Request) {
  let session;
  try { session = await getSession(request.headers); } catch { return tutorError("Authentication is temporarily unavailable.", 503); }
  if (!session) return tutorError("Sign in to use the AI Tutor.", 401);
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [conversations, [usage]] = await Promise.all([
      getDatabase().select({ id: tutorConversations.id, title: tutorConversations.title, updatedAt: tutorConversations.updatedAt })
        .from(tutorConversations).where(eq(tutorConversations.userId, session.user.id))
        .orderBy(desc(tutorConversations.updatedAt)).limit(50),
      getDatabase().select({ requestCount: tutorDailyUsage.requestCount }).from(tutorDailyUsage)
        .where(and(eq(tutorDailyUsage.userId, session.user.id), eq(tutorDailyUsage.periodDate, today))).limit(1),
    ]);
    let configured = true;
    try { getTutorConfiguration(); } catch { configured = false; }
    return Response.json({
      conversations, consented: await hasTutorConsent(session.user.id), configured,
      requestsUsed: usage?.requestCount ?? 0, dailyLimit: getTutorDailyLimit(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch { return tutorError("Tutor conversations could not be loaded.", 500); }
}

export async function POST(request: Request) {
  let session;
  try { session = await getSession(request.headers); } catch { return tutorError("Authentication is temporarily unavailable.", 503); }
  if (!session) return tutorError("Sign in to use the AI Tutor.", 401);
  try {
    const parsed = createSchema.safeParse(await readJsonLimited(request, 2_000));
    if (!parsed.success) return tutorError("Enter a conversation title up to 120 characters.", 400);
    const id = randomUUID();
    await getDatabase().insert(tutorConversations).values({ id, userId: session.user.id, title: parsed.data.title ?? "New conversation" });
    return Response.json({ conversation: { id, title: parsed.data.title ?? "New conversation" } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return tutorError(error instanceof Error && error.message === "request_too_large" ? "Request is too large." : "Conversation could not be created.", error instanceof Error && error.message === "request_too_large" ? 413 : 500);
  }
}
