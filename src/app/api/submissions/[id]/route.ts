import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getDatabase } from "@/lib/db";
import { problemSubmissions } from "@/lib/db/schema";
import { findInternalProblem } from "@/lib/problems";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try { session = await getSession(request.headers); } catch {
    return NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 });
  }
  if (!session) return NextResponse.json({ error: "Sign in to view this submission." }, { status: 401 });
  const { id } = await params;
  if (!/^[\w-]{1,36}$/.test(id)) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  try {
    const [submission] = await getDatabase().select({
      id: problemSubmissions.id, problemSlug: problemSubmissions.problemSlug, language: problemSubmissions.language,
      sourceCode: problemSubmissions.sourceCode, status: problemSubmissions.status,
      passedCount: problemSubmissions.passedCount, totalCount: problemSubmissions.totalCount,
      createdAt: problemSubmissions.createdAt,
    }).from(problemSubmissions).where(and(
      eq(problemSubmissions.id, id), eq(problemSubmissions.userId, session.user.id), eq(problemSubmissions.isSampleRun, false),
    )).limit(1);
    if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    return NextResponse.json({ submission: { ...submission, problemTitle: findInternalProblem(submission.problemSlug)?.title ?? submission.problemSlug } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Submission could not be loaded." }, { status: 500 });
  }
}
