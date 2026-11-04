import "server-only";

import { eq, sql } from "drizzle-orm";
import { getDatabase } from "@/lib/db";
import { tutorDailyUsage, userPreferences } from "@/lib/db/schema";

export function tutorError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readJsonLimited(request: Request, maxBytes = 50_000): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) throw new Error("request_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_json");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("request_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new Error("invalid_json"); }
}

export async function hasTutorConsent(userId: string) {
  const [row] = await getDatabase().select({ consentAt: userPreferences.aiTutorConsentAt })
    .from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return Boolean(row?.consentAt);
}

export async function recordTutorConsent(userId: string) {
  const acceptedAt = new Date();
  await getDatabase().insert(userPreferences).values({ userId, aiTutorConsentAt: acceptedAt })
    .onDuplicateKeyUpdate({ set: { aiTutorConsentAt: acceptedAt } });
}

export function getTutorDailyLimit() {
  const configured = Number(process.env.TUTOR_DAILY_REQUEST_LIMIT ?? "20");
  return Number.isInteger(configured) && configured >= 1 && configured <= 100 ? configured : 20;
}

export async function consumeTutorRequest(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const usage = getDatabase();
  await usage.insert(tutorDailyUsage).values({ userId, periodDate: today, requestCount: 1 })
    .onDuplicateKeyUpdate({ set: {
      // Evaluate this before replacing periodDate so the comparison sees the previous day.
      requestCount: sql`if(${tutorDailyUsage.periodDate} = ${today}, ${tutorDailyUsage.requestCount} + 1, 1)`,
      periodDate: today,
    } });
  const [row] = await usage.select({ periodDate: tutorDailyUsage.periodDate, requestCount: tutorDailyUsage.requestCount })
    .from(tutorDailyUsage).where(eq(tutorDailyUsage.userId, userId)).limit(1);
  const limit = getTutorDailyLimit();
  return { allowed: Boolean(row && row.periodDate === today && row.requestCount <= limit), used: row?.requestCount ?? 0, limit };
}

export function friendlyProviderError(error: unknown) {
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown };
  const status = Number(candidate?.status ?? candidate?.code);
  const detail = typeof candidate?.message === "string" ? candidate.message.toLowerCase() : "";
  if (status === 429 || /resource_exhausted|quota|rate.?limit/.test(detail)) {
    return "Google's current Gemini request limit has been reached. Please try again later; CodeTrail will not switch to another model.";
  }
  if (status === 401 || status === 403) return "The Gemini service is not available for this API key or project configuration.";
  if (status === 404) return "The configured Gemini model is unavailable. Check the server model setting.";
  if (error instanceof Error && error.name === "AbortError") return "Generation was stopped or timed out.";
  return "The tutor could not complete this response. Please try again shortly.";
}
