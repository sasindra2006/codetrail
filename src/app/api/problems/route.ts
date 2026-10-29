import { NextResponse } from "next/server";
import { fetchCodeforcesProblems, type CodeforcesProblem } from "@/lib/codeforces";

export type Problem = CodeforcesProblem;

export async function GET() {
  const problems = await fetchCodeforcesProblems();
  if (!problems) {
    return NextResponse.json(
      { error: "Codeforces is temporarily unavailable. Please try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { problems },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
