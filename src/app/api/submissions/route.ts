import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getDatabase } from "@/lib/db";
import { problemSubmissions } from "@/lib/db/schema";
import { findInternalProblem } from "@/lib/problems";
import { getExercismProblemTitle } from "@/lib/exercism";

const verdicts = ["accepted", "wrong_answer", "time_limit_exceeded", "runtime_error", "compilation_error", "internal_judge_error"] as const;
const languages = ["cpp17", "python3"] as const;

export async function GET(request: Request) {
  let session;
  try { session = await getSession(request.headers); } catch {
    return NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 });
  }
  if (!session) return NextResponse.json({ error: "Sign in to view submissions." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const rawLimit = params.get("limit") ?? "20";
  const rawOffset = params.get("offset") ?? "0";
  if (!/^\d+$/.test(rawLimit) || !/^\d+$/.test(rawOffset)) return NextResponse.json({ error: "Invalid pagination." }, { status: 400 });
  const limit = Math.min(Math.max(Number(rawLimit), 1), 50);
  const offset = Number(rawOffset);
  if (!Number.isSafeInteger(offset) || offset > 1_000_000) return NextResponse.json({ error: "Invalid pagination." }, { status: 400 });
  const verdict = params.get("verdict");
  const language = params.get("language");
  const problem = params.get("problem");
  if (verdict && !verdicts.includes(verdict as typeof verdicts[number])) return NextResponse.json({ error: "Invalid verdict filter." }, { status: 400 });
  if (language && !languages.includes(language as typeof languages[number])) return NextResponse.json({ error: "Invalid language filter." }, { status: 400 });
  if (problem && !findInternalProblem(problem) && !getExercismProblemTitle(problem)) return NextResponse.json({ error: "Invalid problem filter." }, { status: 400 });

  try {
    const conditions = [eq(problemSubmissions.userId, session.user.id), eq(problemSubmissions.isSampleRun, false)];
    if (verdict) conditions.push(eq(problemSubmissions.status, verdict));
    if (language) conditions.push(eq(problemSubmissions.language, language));
    if (problem) conditions.push(eq(problemSubmissions.problemSlug, problem));
    const rows = await getDatabase().select({
      id: problemSubmissions.id, problemSlug: problemSubmissions.problemSlug, language: problemSubmissions.language,
      status: problemSubmissions.status, passedCount: problemSubmissions.passedCount,
      totalCount: problemSubmissions.totalCount, createdAt: problemSubmissions.createdAt,
    }).from(problemSubmissions).where(and(...conditions)).orderBy(desc(problemSubmissions.createdAt)).limit(limit + 1).offset(offset);
    const hasMore = rows.length > limit;
    const submissions = rows.slice(0, limit).map((row) => ({
      ...row,
      problemTitle: findInternalProblem(row.problemSlug)?.title ?? getExercismProblemTitle(row.problemSlug) ?? row.problemSlug,
    }));
    return NextResponse.json({ submissions, hasMore, limit, offset }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Submissions could not be loaded." }, { status: 500 });
  }
}
