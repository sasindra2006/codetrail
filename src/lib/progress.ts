import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/lib/db";
import { problemSubmissions } from "@/lib/db/schema";
import { findInternalProblem } from "@/lib/problems";

const dayMs = 24 * 60 * 60 * 1000;
const verdictKeys = ["accepted", "wrong_answer", "compilation_error", "runtime_error", "time_limit_exceeded", "internal_judge_error"] as const;

export type ProgressSnapshot = {
  totalSolved: number;
  totalAttempted: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  verdicts: Array<{ verdict: string; count: number }>;
  languages: Array<{ language: string; count: number }>;
  difficulties: Array<{ difficulty: string; attempted: number; solved: number }>;
  activity: Array<{ date: string; count: number }>;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  recentSubmissions: Array<{ id: string; problemSlug: string; problemTitle: string; language: string; status: string; passedCount: number; totalCount: number; createdAt: string }>;
};

/** Calendar and streak dates use UTC. Today counts if active; otherwise a streak may continue from yesterday. */
export async function getProgressSnapshot(userId: string, now = new Date()): Promise<ProgressSnapshot> {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(today.getTime() - 364 * dayMs);
  const tomorrow = new Date(today.getTime() + dayMs);
  const startEpoch = Math.floor(start.getTime() / 1000);
  const tomorrowEpoch = Math.floor(tomorrow.getTime() / 1000);
  const base = and(eq(problemSubmissions.userId, userId), eq(problemSubmissions.isSampleRun, false));

  const [statusRows, languageRows, problemRows, activityRows, recentRows] = await Promise.all([
    getDatabase().select({ status: problemSubmissions.status, count: sql<number>`count(*)` })
      .from(problemSubmissions).where(base).groupBy(problemSubmissions.status),
    getDatabase().select({ language: problemSubmissions.language, count: sql<number>`count(*)` })
      .from(problemSubmissions).where(base).groupBy(problemSubmissions.language),
    getDatabase().select({
      problemSlug: problemSubmissions.problemSlug,
      attempted: sql<number>`count(*)`,
      solved: sql<number>`sum(case when ${problemSubmissions.status} = 'accepted' then 1 else 0 end)`,
    }).from(problemSubmissions).where(base).groupBy(problemSubmissions.problemSlug),
    getDatabase().select({
      date: sql<string>`date_format(convert_tz(${problemSubmissions.createdAt}, @@session.time_zone, '+00:00'), '%Y-%m-%d')`,
      count: sql<number>`count(*)`,
    }).from(problemSubmissions).where(and(
      base,
      sql`${problemSubmissions.createdAt} >= from_unixtime(${startEpoch})`,
      sql`${problemSubmissions.createdAt} < from_unixtime(${tomorrowEpoch})`,
    ))
      .groupBy(sql`date_format(convert_tz(${problemSubmissions.createdAt}, @@session.time_zone, '+00:00'), '%Y-%m-%d')`),
    getDatabase().select({
      id: problemSubmissions.id, problemSlug: problemSubmissions.problemSlug, language: problemSubmissions.language,
      status: problemSubmissions.status, passedCount: problemSubmissions.passedCount, totalCount: problemSubmissions.totalCount,
      createdAt: problemSubmissions.createdAt,
    }).from(problemSubmissions).where(base).orderBy(desc(problemSubmissions.createdAt)).limit(6),
  ]);

  const countsByVerdict = new Map(statusRows.map((row) => [row.status, Number(row.count)]));
  const verdicts = verdictKeys.map((verdict) => ({ verdict, count: countsByVerdict.get(verdict) ?? 0 }));
  const totalSubmissions = statusRows.reduce((sum, row) => sum + Number(row.count), 0);
  const acceptedSubmissions = countsByVerdict.get("accepted") ?? 0;
  const recognizedProblems = problemRows.filter((row) => findInternalProblem(row.problemSlug));
  const totalSolved = recognizedProblems.filter((row) => Number(row.solved) > 0).length;
  const totalAttempted = recognizedProblems.length;
  const easy = recognizedProblems.filter((row) => findInternalProblem(row.problemSlug)?.difficulty === "Easy");

  const activityMap = new Map(activityRows.map((row) => [String(row.date).slice(0, 10), Number(row.count)]));
  const activity = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(start.getTime() + index * dayMs).toISOString().slice(0, 10);
    return { date, count: activityMap.get(date) ?? 0 };
  });
  const activeDates = activity.filter((day) => day.count > 0).map((day) => day.date);
  const activeSet = new Set(activeDates);
  let longestStreak = 0;
  let run = 0;
  for (const day of activity) {
    run = day.count > 0 ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  let currentStreak = 0;
  const todayString = today.toISOString().slice(0, 10);
  let cursor = activeSet.has(todayString) ? today : new Date(today.getTime() - dayMs);
  while (activeSet.has(cursor.toISOString().slice(0, 10))) {
    currentStreak += 1;
    cursor = new Date(cursor.getTime() - dayMs);
  }

  return {
    totalSolved, totalAttempted, totalSubmissions, acceptedSubmissions,
    acceptanceRate: totalSubmissions ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
    verdicts,
    languages: languageRows.map((row) => ({ language: row.language, count: Number(row.count) })),
    difficulties: [{ difficulty: "Easy", attempted: easy.length, solved: easy.filter((row) => Number(row.solved) > 0).length }],
    activity,
    activeDays: activeDates.length,
    currentStreak,
    longestStreak,
    recentSubmissions: recentRows.map((row) => ({
      ...row,
      problemTitle: findInternalProblem(row.problemSlug)?.title ?? row.problemSlug,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
