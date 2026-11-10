import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth-server";
import { findInternalProblem } from "@/lib/problems";
import { ProblemWorkspace } from "./problem-workspace";

export default async function InternalProblemPage({ params }: PageProps<"/problems/[slug]">) {
  const { slug } = await params;
  await requireSession(`/problems/${encodeURIComponent(slug)}`);
  const problem = findInternalProblem(slug);
  if (!problem) notFound();

  return <ProblemWorkspace key={problem.slug} problem={problem} />;
}
