import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-server";
import { getDatabase } from "@/lib/db";
import { tutorConversations, tutorMessages } from "@/lib/db/schema";
import { tutorError } from "@/lib/tutor/server";

const validId = (id: string) => /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id);

export async function POST(request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  let session;
  try { session = await getSession(request.headers); } catch { return tutorError("Authentication is temporarily unavailable.", 503); }
  if (!session) return tutorError("Sign in to manage this tutor response.", 401);
  const { id, messageId } = await params;
  if (!validId(id) || !validId(messageId)) return tutorError("Tutor message not found.", 404);
  try {
    const [conversation] = await getDatabase().select({ id: tutorConversations.id }).from(tutorConversations)
      .where(and(eq(tutorConversations.id, id), eq(tutorConversations.userId, session.user.id))).limit(1);
    if (!conversation) return tutorError("Conversation not found.", 404);
    const [message] = await getDatabase().select({ id: tutorMessages.id, status: tutorMessages.status }).from(tutorMessages)
      .where(and(eq(tutorMessages.id, messageId), eq(tutorMessages.conversationId, id), eq(tutorMessages.role, "assistant"))).limit(1);
    if (!message) return tutorError("Tutor message not found.", 404);
    if (message.status !== "streaming") return Response.json({ cancelRequested: false, status: message.status }, { headers: { "Cache-Control": "no-store" } });
    await getDatabase().update(tutorMessages).set({ status: "cancel_requested" })
      .where(and(eq(tutorMessages.id, messageId), eq(tutorMessages.conversationId, id), eq(tutorMessages.status, "streaming")));
    return Response.json({ cancelRequested: true, status: "cancel_requested" }, { headers: { "Cache-Control": "no-store" } });
  } catch { return tutorError("Tutor response could not be stopped.", 500); }
}
