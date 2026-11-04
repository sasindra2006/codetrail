import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { tutorError, readJsonLimited, hasTutorConsent, recordTutorConsent } from "@/lib/tutor/server";

const consentSchema = z.object({ accepted: z.literal(true), ageConfirmed: z.literal(true) }).strict();

export async function GET(request: Request) {
  let session;
  try { session = await getSession(request.headers); } catch { return tutorError("Authentication is temporarily unavailable.", 503); }
  if (!session) return tutorError("Sign in to use the AI Tutor.", 401);
  try { return Response.json({ consented: await hasTutorConsent(session.user.id) }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return tutorError("Tutor settings could not be loaded.", 500); }
}

export async function POST(request: Request) {
  let session;
  try { session = await getSession(request.headers); } catch { return tutorError("Authentication is temporarily unavailable.", 503); }
  if (!session) return tutorError("Sign in to use the AI Tutor.", 401);
  try {
    const body = consentSchema.safeParse(await readJsonLimited(request, 2_000));
    if (!body.success) return tutorError("Confirm the age and data-use notice to continue.", 400);
    await recordTutorConsent(session.user.id);
    return Response.json({ consented: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return tutorError(error instanceof Error && error.message === "request_too_large" ? "Request is too large." : "Tutor settings could not be saved.", error instanceof Error && error.message === "request_too_large" ? 413 : 500);
  }
}
