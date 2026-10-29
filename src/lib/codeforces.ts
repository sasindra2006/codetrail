export type CodeforcesProblem = {
  title: string;
  contestId: number | null;
  index: string;
  rating: number | null;
  tags: string[];
  solvedCount: number | null;
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

function normalizeProblem(value: unknown, statistics: unknown): CodeforcesProblem | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.index !== "string") {
    return null;
  }

  const contestId =
    typeof value.contestId === "number" && Number.isFinite(value.contestId)
      ? value.contestId
      : null;
  const rating =
    typeof value.rating === "number" && Number.isFinite(value.rating)
      ? value.rating
      : null;
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const solvedCount =
    isRecord(statistics) &&
    typeof statistics.solvedCount === "number" &&
    Number.isFinite(statistics.solvedCount)
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

export async function fetchCodeforcesProblems(): Promise<CodeforcesProblem[] | null> {
  try {
    const response = await fetch("https://codeforces.com/api/problemset.problems", {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const payload: CodeforcesResponse = await response.json();
    if (payload.status !== "OK" || !Array.isArray(payload.result?.problems)) {
      return null;
    }

    const statistics = Array.isArray(payload.result.problemStatistics)
      ? payload.result.problemStatistics
      : [];
    return payload.result.problems
      .map((problem, index) => normalizeProblem(problem, statistics[index]))
      .filter((problem): problem is CodeforcesProblem => problem !== null);
  } catch {
    return null;
  }
}

export async function findCodeforcesProblem(
  contestId: number,
  index: string
): Promise<CodeforcesProblem | null> {
  const problems = await fetchCodeforcesProblems();
  if (!problems) return null;
  const normalizedIndex = index.trim().toUpperCase();
  return (
    problems.find(
      (problem) =>
        problem.contestId === contestId &&
        problem.index.toUpperCase() === normalizedIndex
    ) ?? null
  );
}
