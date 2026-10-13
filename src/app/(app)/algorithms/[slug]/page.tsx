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
        <Link className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-muted outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel" href="/algorithms">
          <svg aria-hidden="true" className="size-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="m14 18-6-6 6-6M8 12h12" /></svg>
          All algorithms
        </Link>
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

      <section aria-label={`${algorithm.name} explanation and complexity`} className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-panel p-5 sm:col-span-2"><p className="text-xs font-medium uppercase tracking-wider text-muted">How it works</p><p className="mt-2 text-sm leading-6 text-foreground">{algorithm.explanation}</p></div>
        {[["Best case", algorithm.bestCase], ["Average case", algorithm.averageCase], ["Worst case", algorithm.worstCase], ["Auxiliary space", algorithm.spaceComplexity]].map(([label, value]) => <div className="bg-panel p-5" key={label}><p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p><p className="mt-2 font-mono text-lg text-foreground">{value}</p></div>)}
      </section>
    </section>
  );
}
