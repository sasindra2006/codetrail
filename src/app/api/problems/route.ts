import { NextResponse } from "next/server";

export type Problem = {
  title: string;
  contestId: number | null;
  index: string;
  rating: number | null;
  tags: string[];
  solvedCount: number | null;
};

type CodeforcesProblem = {
  name?: unknown;
  contestId?: unknown;
  index?: unknown;
  rating?: unknown;
  tags?: unknown;
};

type CodeforcesResponse = {
  status?: unknown;
  comment?: unknown;
  result?: {
    problems?: unknown;
    problemStatistics?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeProblem(value: unknown, statistics: unknown): Problem | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.index !== "string") {
    return null;
  }

  const problem: CodeforcesProblem = {
  name: value.name,
  contestId: value.contestId,
  index: value.index,
  rating: value.rating,
  tags: value.tags,
  };
  const contestId = typeof problem.contestId === "number" && Number.isFinite(problem.contestId)
    ? problem.contestId
    : null;
  const rating = typeof problem.rating === "number" && Number.isFinite(problem.rating)
    ? problem.rating
    : null;
  const tags = Array.isArray(problem.tags)
    ? problem.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const solvedCount = isRecord(statistics) && typeof statistics.solvedCount === "number" && Number.isFinite(statistics.solvedCount)
    ? statistics.solvedCount
    : null;

  return {
  title: value.name,
  contestId,
  index: value.index,
  rating,
  tags,
  solvedCount,
  };
}

export async function GET() {
  try {
    const response = await fetch("https://codeforces.com/api/problemset.problems", {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Codeforces is temporarily unavailable. Please try again later." }, { status: 502 });
    }

    const payload: CodeforcesResponse = await response.json();
    if (payload.status !== "OK" || !Array.isArray(payload.result?.problems)) {
      return NextResponse.json({ error: "Codeforces returned an invalid problem list." }, { status: 502 });
    }

    const statistics = Array.isArray(payload.result.problemStatistics) ? payload.result.problemStatistics : [];
    const problems = payload.result.problems
      .map((problem, index) => normalizeProblem(problem, statistics[index]))
      .filter((problem): problem is Problem => problem !== null);

    return NextResponse.json({ problems }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load problems from Codeforces. Please try again." }, { status: 502 });
  }
}
