"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Problem } from "@/app/api/problems/route";
import { internalProblems } from "@/lib/problems";

type ProblemResponse = { problems?: Problem[]; error?: string };
type Difficulty = "all" | "unrated" | "800-1200" | "1300-1600" | "1700-2000" | "2100+";

let cachedProblems: Problem[] | null = null;
let pendingRequest: Promise<Problem[]> | null = null;

async function loadProblems(): Promise<Problem[]> {
  if (cachedProblems) return cachedProblems;
  if (!pendingRequest) {
    pendingRequest = fetch("/api/problems")
      .then(async (response) => {
        const payload = (await response.json()) as ProblemResponse;
        if (!response.ok) throw new Error(payload.error ?? "Unable to load problems.");
        if (!Array.isArray(payload.problems)) throw new Error("The problem list was not available.");
        cachedProblems = payload.problems;
        return payload.problems;
      })
      .finally(() => { pendingRequest = null; });
  }
  return pendingRequest;
}

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: "all", label: "All ratings" },
  { value: "unrated", label: "Unrated" },
  { value: "800-1200", label: "800â€“1200" },
  { value: "1300-1600", label: "1300â€“1600" },
  { value: "1700-2000", label: "1700â€“2000" },
  { value: "2100+", label: "2100+" },
];

function matchesDifficulty(rating: number | null, difficulty: Difficulty) {
  if (difficulty === "all") return true;
  if (difficulty === "unrated") return rating === null;
  if (rating === null) return false;
  if (difficulty === "800-1200") return rating <= 1200;
  if (difficulty === "1300-1600") return rating >= 1300 && rating <= 1600;
  if (difficulty === "1700-2000") return rating >= 1700 && rating <= 2000;
  return rating >= 2100;
}

function formatSolvedCount(count: number | null) {
  if (count === null) return "â€”";
  return new Intl.NumberFormat("en", { notation: count >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(count);
}

function problemUrl(problem: Problem) {
  if (problem.contestId === null || !/^\w+$/.test(problem.index)) return null;
  return `https://codeforces.com/problemset/problem/${problem.contestId}/${encodeURIComponent(problem.index)}`;
}

export function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [selectedTag, setSelectedTag] = useState("all");

  useEffect(() => {
    let active = true;
    loadProblems()
      .then((data) => { if (active) setProblems(data); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load problems.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const tags = useMemo(() => [...new Set(problems.flatMap((problem) => problem.tags))].sort(), [problems]);
  const filteredProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return problems.filter((problem) => {
      const matchesQuery = !normalizedQuery || problem.title.toLowerCase().includes(normalizedQuery)
        || problem.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
        || `${problem.contestId ?? ""}${problem.index}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && matchesDifficulty(problem.rating, difficulty)
        && (selectedTag === "all" || problem.tags.includes(selectedTag));
    });
  }, [problems, query, difficulty, selectedTag]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent">Practice studio</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Problems</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Solve CodeTrail practice problems in the built-in C++ editor, or browse the Codeforces catalog by title, rating, and topic.</p>
        </div>
        <p className="shrink-0 text-sm text-muted" aria-live="polite">
          {loading ? "Loading problem setâ€¦" : error ? "Problem set unavailable" : `${filteredProblems.length.toLocaleString()} of ${problems.length.toLocaleString()} problems`}
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="codetrail-problems-heading">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Solve in CodeTrail</p><h2 className="mt-1 text-lg font-semibold text-foreground" id="codetrail-problems-heading">Practice problems</h2></div>
          <span className="text-xs text-muted">C++17 · Sample runs</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {internalProblems.map((problem) => <Link className="group flex min-h-36 flex-col justify-between border border-line bg-panel p-4 outline-none transition-colors hover:border-line-strong hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent" href={`/problems/${problem.slug}`} key={problem.slug} rel="noopener noreferrer" target="_blank">
            <div><div className="flex items-start justify-between gap-3"><h3 className="font-medium text-foreground group-hover:text-accent">{problem.title}</h3><span className="shrink-0 border border-line-strong px-2 py-0.5 text-[11px] text-muted">{problem.difficulty}</span></div><div className="mt-3 flex flex-wrap gap-1.5">{problem.topics.map((topic) => <span className="border border-line px-2 py-1 text-[11px] text-muted" key={topic}>{topic}</span>)}</div></div>
          </Link>)}
        </div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="codeforces-catalog-heading">
      <div className="flex flex-col gap-1 border-b border-line pb-4"><h2 className="text-lg font-semibold text-foreground" id="codeforces-catalog-heading">Codeforces catalog</h2><p className="text-sm text-muted">Browse external problems. Selecting one opens the official Codeforces page.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(15rem,1fr)_12rem_minmax(12rem,16rem)]">
        <label className="flex flex-col gap-2 text-xs font-medium text-muted">
          Search problems
          <span className="flex h-11 items-center gap-2 border border-line bg-panel px-3 focus-within:border-accent">
            <svg aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted" onChange={(event) => setQuery(event.target.value)} placeholder="Title, tag, or problem ID" value={query} />
          </span>
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-muted">
          Difficulty
          <select className="h-11 border border-line bg-panel px-3 text-sm text-foreground outline-none focus:border-accent" onChange={(event) => setDifficulty(event.target.value as Difficulty)} value={difficulty}>
            {difficultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-muted sm:col-span-2 lg:col-span-1">
          Topic
          <select className="h-11 border border-line bg-panel px-3 text-sm text-foreground outline-none focus:border-accent" onChange={(event) => setSelectedTag(event.target.value)} value={selectedTag}>
            <option value="all">All topics</option>
            {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="border border-line bg-panel px-5 py-14 text-center" role="status"><p className="text-sm font-medium text-foreground">Loading problems</p><p className="mt-2 text-sm text-muted">Fetching the latest available Codeforces problem set.</p></div>
      ) : error ? (
        <div className="border border-line bg-panel px-5 py-12 text-center" role="alert"><p className="text-sm font-medium text-foreground">We couldnâ€™t load the problem set</p><p className="mt-2 text-sm text-muted">{error}</p><button className="mt-5 border border-line-strong px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => { cachedProblems = null; setError(null); setLoading(true); loadProblems().then(setProblems).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load problems.")).finally(() => setLoading(false)); }} type="button">Try again</button></div>
      ) : filteredProblems.length === 0 ? (
        <div className="border border-line bg-panel px-5 py-14 text-center"><p className="text-sm font-medium text-foreground">No matching problems</p><p className="mt-2 text-sm text-muted">Try another search or adjust the selected filters.</p><button className="mt-4 text-sm font-medium text-accent hover:underline" onClick={() => { setQuery(""); setDifficulty("all"); setSelectedTag("all"); }} type="button">Clear filters</button></div>
      ) : (
        <div className="overflow-hidden border border-line bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead><tr className="border-b border-line bg-surface text-[11px] font-medium uppercase tracking-[0.12em] text-muted"><th className="px-5 py-3">Problem</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Topics</th><th className="px-4 py-3 text-right">Solved</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
              <tbody>{filteredProblems.slice(0, 100).map((problem, index) => {
                const url = problemUrl(problem);
                return <tr className="border-b border-line last:border-0 hover:bg-hover/50" key={`${problem.contestId ?? "unknown"}-${problem.index}-${problem.title}-${index}`}>
                  <td className="px-5 py-4"><div className="font-medium text-foreground">{problem.title}</div><div className="mt-1 font-mono text-xs text-muted">{problem.contestId === null ? "Problem" : `${problem.contestId}${problem.index}`}</div></td>
                  <td className="px-4 py-4 text-sm tabular-nums text-muted">{problem.rating ?? "â€”"}</td>
                  <td className="px-4 py-4"><div className="flex max-w-sm flex-wrap gap-1.5">{problem.tags.length ? problem.tags.slice(0, 3).map((tag) => <button className="border border-line-strong px-2 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" key={tag} onClick={() => setSelectedTag(tag)} type="button">{tag}</button>) : <span className="text-sm text-muted">â€”</span>}{problem.tags.length > 3 && <span className="px-1 py-1 text-xs text-muted">+{problem.tags.length - 3}</span>}</div></td>
                  <td className="px-4 py-4 text-right text-sm tabular-nums text-muted">{formatSolvedCount(problem.solvedCount)}</td>
                  <td className="px-5 py-4 text-right">{url ? <a className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent" href={url} rel="noreferrer" target="_blank">Open problem<svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 4h6v6m0-6-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg></a> : <span className="text-xs text-muted">Link unavailable</span>}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          {filteredProblems.length > 100 && <p className="border-t border-line px-5 py-3 text-xs text-muted">Showing the first 100 matches. Refine your search or filters to find a specific problem.</p>}
        </div>
      )}
      <p className="text-xs leading-5 text-muted">Problem metadata is provided by Codeforces. Problem statements and submissions remain on the official site.</p>
      </section>
    </section>
  );
}
