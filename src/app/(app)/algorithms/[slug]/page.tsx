import Link from "next/link";
import { notFound } from "next/navigation";
import { AlgorithmVisualizer } from "@/components/algorithm-visualizer";
import { findAlgorithm } from "@/lib/algorithms/catalog";

export default async function AlgorithmPage({ params }: PageProps<"/algorithms/[slug]">) {
  const { slug } = await params;
  const algorithm = findAlgorithm(slug);
  if (!algorithm) notFound();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link className="w-fit text-xs font-medium uppercase tracking-[0.2em] text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href="/algorithms">Algorithm catalogue</Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{algorithm.category}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{algorithm.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{algorithm.description}</p>
          </div>
          <span className="border border-line px-3 py-1.5 font-mono text-xs text-muted">{algorithm.properties}</span>
        </div>
      </header>

      <AlgorithmVisualizer key={algorithm.slug} algorithm={algorithm.visualizer} />

      <section aria-label={`${algorithm.name} explanation and complexity`} className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-panel p-5 sm:col-span-2 lg:col-span-1"><p className="text-xs font-medium uppercase tracking-wider text-muted">How it works</p><p className="mt-2 text-sm leading-6 text-foreground">{algorithm.explanation}</p></div>
        <div className="bg-panel p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted">Time complexity</p><p className="mt-2 font-mono text-lg text-foreground">{algorithm.timeComplexity}</p><p className="mt-1 text-xs text-muted">Average and worst case</p></div>
        <div className="bg-panel p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted">Space complexity</p><p className="mt-2 font-mono text-lg text-foreground">{algorithm.spaceComplexity}</p><p className="mt-1 text-xs text-muted">Auxiliary space</p></div>
      </section>
    </section>
  );
}
