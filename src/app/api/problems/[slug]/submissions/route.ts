import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getDatabase } from "@/lib/db";
import { problemSubmissions } from "@/lib/db/schema";
import { getSubmissionTestCases } from "@/lib/function-test-cases";
import { runSubmissionSuite } from "@/lib/submission-runner";
import { findInternalProblem } from "@/lib/problems";

export const maxDuration = 30;

const maxRequestBytes = 24_000;
const maxSourceBytes = 20_000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!findInternalProblem(slug)) {
    return NextResponse.json({ error: "That CodeTrail problem could not be found." }, { status: 404 });
  }

  let session;
  try {
    session = await getSession(request.headers);
  } catch {
    return NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 });
  }
  if (!session) {
    return NextResponse.json({ error: "Sign in to view sample-run history." }, { status: 401 });
  }

  try {
    const submissions = await getDatabase()
      .select({
        id: problemSubmissions.id,
        problemSlug: problemSubmissions.problemSlug,
        language: problemSubmissions.language,
        sourceCode: problemSubmissions.sourceCode,
        status: problemSubmissions.status,
        passedCount: problemSubmissions.passedCount,
        totalCount: problemSubmissions.totalCount,
        isSampleRun: problemSubmissions.isSampleRun,
        createdAt: problemSubmissions.createdAt,
      })
      .from(problemSubmissions)
      .where(and(
        eq(problemSubmissions.userId, session.user.id),
        eq(problemSubmissions.problemSlug, slug),
      ))
      .orderBy(desc(problemSubmissions.createdAt))
      .limit(20);

    return NextResponse.json({ submissions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Sample-run history could not be loaded." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  let session;
  try {
    session = await getSession(request.headers);
  } catch {
    return jsonError("Authentication is temporarily unavailable.", 503);
  }
  if (!session) return jsonError("Sign in to submit a solution.", 401);

  const { slug } = await params;
  const problem = findInternalProblem(slug);
  if (!problem) return jsonError("That CodeTrail problem could not be found.", 404);
  if (problem.executionMode !== "function") {
    return jsonError("Full submissions are not configured for this problem.", 400);
  }
  const testCases = getSubmissionTestCases(slug);
  if (!testCases?.length) return jsonError("The full test suite is not configured for this problem.", 503);

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return jsonError("The submission request is too large.", 413);
  }
  const reader = request.body?.getReader();
  if (!reader) return jsonError("Send valid JSON with source code and language.", 400);
  let requestBytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      requestBytes += value.byteLength;
      if (requestBytes > maxRequestBytes) {
        await reader.cancel();
        return jsonError("The submission request is too large.", 413);
      }
      chunks.push(value);
    }
  } catch {
    return jsonError("Send valid JSON with source code and language.", 400);
  } finally {
    reader.releaseLock();
  }

  const requestBuffer = new Uint8Array(requestBytes);
  let offset = 0;
  for (const chunk of chunks) {
    requestBuffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(requestBuffer)) as unknown;
  } catch {
    return jsonError("Send valid JSON with source code and language.", 400);
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError("Send source code and a supported language.", 400);
  }
  const { sourceCode, language } = body as { sourceCode?: unknown; language?: unknown };
  if (typeof sourceCode !== "string" || (language !== "cpp17" && language !== "python3")) {
    return jsonError("Send source code and a supported language.", 400);
  }
  if (!problem.supportedLanguages?.includes(language)) {
    return jsonError("That language is not supported for this problem.", 400);
  }
  if (!sourceCode.trim()) return jsonError("Add some code before submitting.", 400);
  if (new TextEncoder().encode(sourceCode).byteLength > maxSourceBytes) {
    return jsonError("Source code must be 20 KB or smaller.", 413);
  }

  let execution;
  try {
    execution = await runSubmissionSuite({ slug, language, sourceCode, testCases });
  } catch {
    execution = {
      verdict: "internal_judge_error" as const,
      passedCount: 0,
      totalCount: testCases.length,
      message: "The judge could not complete this submission. Please try again.",
    };
  }

  let historySaved = false;
  try {
    await getDatabase().insert(problemSubmissions).values({
      id: randomUUID(),
      userId: session.user.id,
      problemSlug: slug,
      language,
      sourceCode,
      status: execution.verdict,
      passedCount: execution.passedCount,
      totalCount: execution.totalCount,
      isSampleRun: false,
    });
    historySaved = true;
  } catch {
    console.error("[Submission] Could not save the authenticated user's submission history.");
  }

  return NextResponse.json({ ...execution, historySaved }, { headers: { "Cache-Control": "no-store" } });
}
