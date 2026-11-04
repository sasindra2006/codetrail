import { and, desc, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { getDatabase } from "@/lib/db";
import { tutorConversations, tutorMessages } from "@/lib/db/schema";
import { readJsonLimited, tutorError } from "@/lib/tutor/server";

const renameSchema = z.object({ title: z.string().trim().min(1).max(120) }).strict();
const validId = (id: string) => /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id);

async function authorize(request: Request) {
  try {
    const session = await getSession(request.headers);
    return session ? { session } : { response: tutorError("Sign in to use the AI Tutor.", 401) };
  } catch { return { response: tutorError("Authentication is temporarily unavailable.", 503) }; }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!validId(id)) return tutorError("Conversation not found.", 404);
  try {
    const [conversation] = await getDatabase().select({ id: tutorConversations.id, title: tutorConversations.title })
      .from(tutorConversations).where(and(eq(tutorConversations.id, id), eq(tutorConversations.userId, auth.session.user.id))).limit(1);
    if (!conversation) return tutorError("Conversation not found.", 404);
    await getDatabase().update(tutorMessages).set({ status: "interrupted" })
      .where(and(eq(tutorMessages.conversationId, id), eq(tutorMessages.status, "streaming"), lt(tutorMessages.createdAt, new Date(Date.now() - 120_000))));
    await getDatabase().update(tutorMessages).set({ status: "cancelled" })
      .where(and(eq(tutorMessages.conversationId, id), eq(tutorMessages.status, "cancel_requested"), lt(tutorMessages.createdAt, new Date(Date.now() - 120_000))));
    const messages = await getDatabase().select({
      id: tutorMessages.id, role: tutorMessages.role, content: tutorMessages.content,
      status: tutorMessages.status, createdAt: tutorMessages.createdAt,
    }).from(tutorMessages).where(eq(tutorMessages.conversationId, id))
      .orderBy(desc(tutorMessages.createdAt), desc(tutorMessages.id)).limit(100);
    return Response.json({ conversation, messages: messages.reverse() }, { headers: { "Cache-Control": "no-store" } });
  } catch { return tutorError("Conversation could not be loaded.", 500); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!validId(id)) return tutorError("Conversation not found.", 404);
  try {
    const parsed = renameSchema.safeParse(await readJsonLimited(request, 2_000));
    if (!parsed.success) return tutorError("Enter a title up to 120 characters.", 400);
    const [existing] = await getDatabase().select({ id: tutorConversations.id }).from(tutorConversations)
      .where(and(eq(tutorConversations.id, id), eq(tutorConversations.userId, auth.session.user.id))).limit(1);
    if (!existing) return tutorError("Conversation not found.", 404);
    await getDatabase().update(tutorConversations).set({ title: parsed.data.title, updatedAt: new Date() })
      .where(and(eq(tutorConversations.id, id), eq(tutorConversations.userId, auth.session.user.id)));
    return Response.json({ renamed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return tutorError(error instanceof Error && error.message === "request_too_large" ? "Request is too large." : "Conversation could not be renamed.", error instanceof Error && error.message === "request_too_large" ? 413 : 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!validId(id)) return tutorError("Conversation not found.", 404);
  try {
    const result = await getDatabase().delete(tutorConversations)
      .where(and(eq(tutorConversations.id, id), eq(tutorConversations.userId, auth.session.user.id)));
    if (result[0].affectedRows === 0) return tutorError("Conversation not found.", 404);
    return Response.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return tutorError("Conversation could not be deleted.", 500); }
}
