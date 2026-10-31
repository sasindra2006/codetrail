import { NextResponse } from "next/server";
import { fetchCodeforcesProblems, type CodeforcesProblem } from "@/lib/codeforces";
import { internalProblems, toInternalProblemListing, type ProblemListingItem } from "@/lib/problems";

export type Problem = ProblemListingItem;

function toCodeforcesListing(problem: CodeforcesProblem): ProblemListingItem | null {
  if (problem.contestId === null || !/^\w+$/i.test(problem.index)) return null;
  const index = problem.index.toUpperCase();
  return {
    key: `codeforces:${problem.contestId}:${index}`,
    source: "codeforces",
    title: problem.title,
    href: `/problems/codeforces/${problem.contestId}/${encodeURIComponent(index)}`,
    difficulty: null,
    rating: problem.rating,
    topics: problem.tags,
    problemId: `${problem.contestId}${index}`,
    solvedCount: problem.solvedCount,
  };
}

export async function GET() {
  const problems = await fetchCodeforcesProblems();
  const byKey = new Map<string, ProblemListingItem>();
  for (const problem of internalProblems) {
    const item = toInternalProblemListing(problem);
    byKey.set(item.key, item);
  }
  for (const problem of problems ?? []) {
    const item = toCodeforcesListing(problem);
    if (item && !byKey.has(item.key)) byKey.set(item.key, item);
  }

  return NextResponse.json(
    { problems: [...byKey.values()], externalUnavailable: problems === null },
    {
      headers: {
        "Cache-Control": problems === null
          ? "no-store"
          : "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
