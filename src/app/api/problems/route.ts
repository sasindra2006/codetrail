import { NextResponse } from "next/server";
import { getExercismListings } from "@/lib/exercism";
import { internalProblems, toInternalProblemListing, type ProblemListingItem } from "@/lib/problems";

export type Problem = ProblemListingItem;

export async function GET() {
  const byKey = new Map<string, ProblemListingItem>();
  for (const problem of internalProblems) {
    const item = toInternalProblemListing(problem);
    byKey.set(item.key, item);
  }
  for (const exercism of getExercismListings()) byKey.set(exercism.key, exercism);

  return NextResponse.json(
    { problems: [...byKey.values()] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
