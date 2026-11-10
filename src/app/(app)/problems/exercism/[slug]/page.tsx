import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth-server";
import { getExercismProblem, getExercismProblemTitle } from "@/lib/exercism";
import { ProblemWorkspace } from "../../[slug]/problem-workspace";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = getExercismProblemTitle(`exercism:${slug}`);
  return { title: title ? `${title} · CodeTrail` : "Exercise not found · CodeTrail" };
}

export default async function ExercismProblemPage({ params }: Props) {
  const { slug } = await params;
  await requireSession(`/problems/exercism/${encodeURIComponent(slug)}`);
  const problemKey = `exercism:${slug}`;
  if (!getExercismProblemTitle(problemKey)) notFound();

  let problem;
  try {
    problem = await getExercismProblem(problemKey);
  } catch {
    return (
      <section className="mx-auto max-w-2xl border border-line bg-panel p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Exercism exercise</p>
        <h1 className="mt-2 text-lg font-semibold">Exercise content is temporarily unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-muted">CodeTrail could not retrieve the reviewed exercise files. Try again in a moment.</p>
        <div className="mt-5 flex gap-4 text-sm">
          <Link className="text-accent hover:underline" href={`/problems/exercism/${encodeURIComponent(slug)}`}>Retry</Link>
          <Link className="text-muted hover:text-foreground" href="/problems">Back to Problems</Link>
        </div>
      </section>
    );
  }
  if (!problem) notFound();
  return <ProblemWorkspace key={problem.slug} problem={problem} />;
}
