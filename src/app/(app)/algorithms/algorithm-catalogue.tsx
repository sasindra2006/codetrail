"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { algorithms, type AlgorithmCategory } from "@/lib/algorithms/catalog";

type CategoryFilter = "All categories" | AlgorithmCategory;
type SortOrder = "az" | "za";

export function AlgorithmCatalogue() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All categories");
  const [sortOrder, setSortOrder] = useState<SortOrder>("az");
  const categories = useMemo(() => [...new Set(algorithms.map((algorithm) => algorithm.category))].sort(), []);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return algorithms
      .filter((algorithm) => (!normalized || `${algorithm.name} ${algorithm.category} ${algorithm.description} ${algorithm.keywords.join(" ")}`.toLowerCase().includes(normalized))
        && (category === "All categories" || algorithm.category === category))
      .sort((a, b) => sortOrder === "az" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  }, [query, category, sortOrder]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent">Learn and visualize</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Algorithms</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Explore step-by-step algorithm explanations, complexity, and interactive visualizations.</p>
        </div>
        <p aria-live="polite" className="shrink-0 text-sm text-muted">{results.length} of {algorithms.length} algorithms</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(15rem,1fr)_12rem_12rem]">
        <label className="flex flex-col gap-2 text-xs font-medium text-muted">
          Search algorithms
          <span className="flex h-11 items-center gap-2 border border-line bg-panel px-3 focus-within:border-accent">
            <svg aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input aria-label="Search by name or keyword" className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted" onChange={(event) => setQuery(event.target.value)} placeholder="Name, topic, or keyword" value={query} />
          </span>
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-muted">
          Category
          <select className="h-11 border border-line bg-panel px-3 text-sm text-foreground outline-none focus:border-accent" onChange={(event) => setCategory(event.target.value as CategoryFilter)} value={category}>
            <option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-muted sm:col-span-2 lg:col-span-1">
          Sort by
          <select className="h-11 border border-line bg-panel px-3 text-sm text-foreground outline-none focus:border-accent" onChange={(event) => setSortOrder(event.target.value as SortOrder)} value={sortOrder}>
            <option value="az">Name (A to Z)</option><option value="za">Name (Z to A)</option>
          </select>
        </label>
      </div>

      {results.length === 0 ? (
        <div className="border border-line bg-panel px-5 py-14 text-center"><p className="text-sm font-medium text-foreground">No matching algorithms</p><p className="mt-2 text-sm text-muted">Try another search or adjust the selected category.</p><button className="mt-4 text-sm font-medium text-accent hover:underline" onClick={() => { setQuery(""); setCategory("All categories"); }} type="button">Clear filters</button></div>
      ) : (
        <ul aria-label="Algorithm catalogue" className="overflow-hidden border border-line bg-panel">
          {results.map((algorithm) => <li className="border-b border-line last:border-0" key={algorithm.slug}>
            <Link className="group grid gap-4 p-5 outline-none transition-colors hover:bg-hover/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6" href={`/algorithms/${algorithm.slug}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-foreground group-hover:text-accent">{algorithm.name}</h2><span className="border border-line-strong px-2 py-0.5 text-[11px] text-muted">{algorithm.category}</span></div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{algorithm.description}</p>
              </div>
              <div className="flex items-center justify-between gap-5 sm:justify-end">
                <dl className="flex gap-5 text-xs"><div><dt className="text-muted">Time</dt><dd className="mt-1 font-mono text-foreground">{algorithm.timeComplexity}</dd></div><div><dt className="text-muted">Space</dt><dd className="mt-1 font-mono text-foreground">{algorithm.spaceComplexity}</dd></div></dl>
                <span aria-hidden="true" className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent">→</span>
              </div>
            </Link>
          </li>)}
        </ul>
      )}
    </section>
  );
}
