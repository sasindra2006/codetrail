import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCodeforcesProblem } from "@/lib/codeforces";
import type { ExternalProblem } from "@/lib/problems";
import { ProblemWorkspace } from "../../../[slug]/problem-workspace";

type RouteParams = {
  contestId: string;
  index: string;
};

type Props = {
  params: Promise<RouteParams>;
};

const defaultStarterCode = `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    // Write your solution here

    return 0;
}
`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { contestId, index } = await params;
  const parsedContestId = Number.parseInt(contestId, 10);
  if (!Number.isInteger(parsedContestId) || parsedContestId <= 0 || !/^\w+$/i.test(index)) {
    return { title: "Problem not found · CodeTrail" };
  }

  const problem = await findCodeforcesProblem(parsedContestId, index);
  if (!problem || problem.contestId === null) {
    return { title: "Problem not found · CodeTrail" };
  }

  return {
    title: `${problem.contestId}${problem.index}. ${problem.title} · CodeTrail`,
  };
}

export default async function CodeforcesProblemPage({ params }: Props) {
  const { contestId, index } = await params;
  const parsedContestId = Number.parseInt(contestId, 10);

  if (!Number.isInteger(parsedContestId) || parsedContestId <= 0) {
    notFound();
  }

  const normalizedIndex = index.trim().toUpperCase();
  if (!/^\w+$/i.test(normalizedIndex)) {
    notFound();
  }

  const problem = await findCodeforcesProblem(parsedContestId, normalizedIndex);
  if (!problem || problem.contestId === null) {
    notFound();
  }

  const workspaceProblem: ExternalProblem = {
    kind: "codeforces",
    contestId: problem.contestId,
    index: problem.index,
    title: problem.title,
    rating: problem.rating,
    topics: problem.tags,
    solvedCount: problem.solvedCount,
    externalUrl: `https://codeforces.com/problemset/problem/${problem.contestId}/${encodeURIComponent(problem.index)}`,
    starterCode: defaultStarterCode,
  };

  return (
    <ProblemWorkspace
      key={`codeforces-${workspaceProblem.contestId}-${workspaceProblem.index}`}
      problem={workspaceProblem}
    />
  );
}
