"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Problem } from "@/app/api/problems/route";

type ProblemResponse = { problems?: Problem[]; externalUnavailable?: boolean; error?: string };
type Difficulty = "all" | "Easy" | "Medium" | "Hard" | "Very Hard" | "Expert" | "Unrated";
type SortOption = "recommended" | "difficulty-asc" | "difficulty-desc" | "solved-desc" | "solved-asc" | "title-asc" | "title-desc";

let cachedProblems: Problem[] | null = null;
let cachedExternalUnavailable = false;
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
        cachedExternalUnavailable = payload.externalUnavailable === true;
        return payload.problems;
      })
      .finally(() => { pendingRequest = null; });
  }
  return pendingRequest;
}

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: "all", label: "All difficulties" },
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
  { value: "Very Hard", label: "Very Hard" },
  { value: "Expert", label: "Expert" },
  { value: "Unrated", label: "Unrated" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "difficulty-asc", label: "Difficulty: Easy to Hard" },
  { value: "difficulty-desc", label: "Difficulty: Hard to Easy" },
  { value: "solved-desc", label: "Most Solved" },
  { value: "solved-asc", label: "Least Solved" },
  { value: "title-asc", label: "Title: A to Z" },
  { value: "title-desc", label: "Title: Z to A" },
];

function isValidRating(rating: number | null): rating is number {
  return rating !== null && Number.isInteger(rating) && rating >= 800;
}

function difficultyLabel(problem: Problem): Exclude<Difficulty, "all"> {
  if (problem.difficulty !== null) return problem.difficulty === "Easy" ? "Easy" : "Unrated";
  if (!isValidRating(problem.rating)) return "Unrated";
  if (problem.rating < 1200) return "Easy";
  if (problem.rating < 1600) return "Medium";
  if (problem.rating < 2000) return "Hard";
  if (problem.rating < 2400) return "Very Hard";
  return "Expert";
}

function matchesDifficulty(problem: Problem, difficulty: Difficulty) {
  return difficulty === "all" || difficultyLabel(problem) === difficulty;
}

function formatCount(count: number | null) {
  if (count === null) return "—";
  return new Intl.NumberFormat("en", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);
}

const batchSize = 50;
const difficultyOrder: Record<Exclude<Difficulty, "all">, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
  "Very Hard": 3,
  Expert: 4,
  Unrated: 5,
};

export function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [externalUnavailable, setExternalUnavailable] = useState(false);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visibleCountRef = useRef(batchSize);
  const loadingMoreRef = useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    loadProblems()
      .then((data) => {
        if (active) {
          setProblems(data);
          setExternalUnavailable(cachedExternalUnavailable);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load problems.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const tags = useMemo(() => [...new Set(problems.flatMap((problem) => problem.topics))].sort(), [problems]);
  const filteredProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return problems.filter((problem) => {
      const matchesQuery = !normalizedQuery
        || problem.title.toLowerCase().includes(normalizedQuery)
        || problem.topics.some((tag) => tag.toLowerCase().includes(normalizedQuery))
        || (problem.problemId?.toLowerCase().includes(normalizedQuery) ?? false);
      return matchesQuery && matchesDifficulty(problem, difficulty)
        && (selectedTag === "all" || problem.topics.includes(selectedTag));
    });
  }, [problems, query, difficulty, selectedTag]);

  const sortedProblems = useMemo(() => {
    if (sort === "recommended") return filteredProblems;

    const recommendedOrder = new Map(problems.map((problem, index) => [problem.key, index]));
    const compareDifficulty = (left: Problem, right: Problem, descending: boolean) => {
      const leftLabel = difficultyLabel(left);
      const rightLabel = difficultyLabel(right);
      const leftKnown = leftLabel !== "Unrated";
      const rightKnown = rightLabel !== "Unrated";
      if (leftKnown !== rightKnown) return leftKnown ? -1 : 1;
      if (!leftKnown) return 0;

      if (left.difficulty === null && right.difficulty === null
        && isValidRating(left.rating) && isValidRating(right.rating)
        && left.rating !== right.rating) {
        return descending ? right.rating - left.rating : left.rating - right.rating;
      }
      const categoryComparison = difficultyOrder[leftLabel] - difficultyOrder[rightLabel];
      return descending ? -categoryComparison : categoryComparison;
    };

    return [...filteredProblems].sort((left, right) => {
      let comparison = 0;
      if (sort === "difficulty-asc" || sort === "difficulty-desc") {
        comparison = compareDifficulty(left, right, sort === "difficulty-desc");
      } else if (sort === "solved-desc" || sort === "solved-asc") {
        if (left.solvedCount === null || right.solvedCount === null) {
          comparison = left.solvedCount === right.solvedCount ? 0 : left.solvedCount === null ? 1 : -1;
        } else if (left.solvedCount !== right.solvedCount) {
          comparison = sort === "solved-desc"
            ? right.solvedCount - left.solvedCount
            : left.solvedCount - right.solvedCount;
        }
      } else {
        comparison = left.title.localeCompare(right.title, undefined, { sensitivity: "base" });
        if (sort === "title-desc") comparison *= -1;
      }

      return comparison || (recommendedOrder.get(left.key) ?? 0) - (recommendedOrder.get(right.key) ?? 0);
    });
  }, [filteredProblems, problems, sort]);

  const visibleProblems = sortedProblems.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProblems.length;

  function resetVisibleBatch() {
    visibleCountRef.current = batchSize;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setVisibleCount(batchSize);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    let appendTimer: number | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || loadingMoreRef.current
          || visibleCountRef.current >= sortedProblems.length) return;

        loadingMoreRef.current = true;
        setLoadingMore(true);
        appendTimer = window.setTimeout(() => {
          const nextCount = Math.min(visibleCountRef.current + batchSize, sortedProblems.length);
          visibleCountRef.current = nextCount;
          setVisibleCount(nextCount);
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }, 100);
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 }
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (appendTimer !== null) window.clearTimeout(appendTimer);
      loadingMoreRef.current = false;
    };
  }, [hasMore, sortedProblems]);

  function clearFilters() {
    setQuery("");
    setDifficulty("all");
    setSelectedTag("all");
    resetVisibleBatch();
  }

  function retry() {
    cachedProblems = null;
    cachedExternalUnavailable = false;
    setError(null);
    setLoading(true);
    loadProblems()
      .then((data) => {
        setProblems(data);
        setExternalUnavailable(cachedExternalUnavailable);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load problems."))
      .finally(() => setLoading(false));
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <header className="flex flex-col gap-3 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent">Practice studio</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Problems</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Find your next problem by title, topic, ID, or difficulty.</p>
        </div>
        <p className="shrink-0 text-sm text-muted" aria-live="polite">
          {loading ? "Loading problems…" : error ? "Problem set unavailable" : `${filteredProblems.length.toLocaleString()} problems`}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1.3fr)_11rem_minmax(12rem,1fr)_14rem]">
        <label className="flex flex-col gap-2 text-xs font-medium text-muted">
          Search problems
          <span className="flex h-11 items-center gap-2 border border-line bg-panel px-3 focus-within:border-accent">
            <svg aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted" onChange={(event) => { setQuery(event.target.value); resetVisibleBatch(); }} placeholder="Title, topic, or problem ID" value={query} />
          </span>
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-muted">
          Difficulty
          <select className="h-11 border border-line bg-panel px-3 text-sm text-foreground outline-none focus:border-accent" onChange={(event) => { setDifficulty(event.target.value as Difficulty); resetVisibleBatch(); }} value={difficulty}>
            {difficultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-muted sm:col-span-2 lg:col-span-1">
          Topic
          <select className="h-11 border border-line bg-panel px-3 text-sm text-foreground outline-none focus:border-accent" onChange={(event) => { setSelectedTag(event.target.value); resetVisibleBatch(); }} value={selectedTag}>
            <option value="all">All topics</option>
            {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-muted sm:col-span-2 lg:col-span-1">
          Sort by
          <select className="h-11 border border-line bg-panel px-3 text-sm text-foreground outline-none focus:border-accent" onChange={(event) => { setSort(event.target.value as SortOption); resetVisibleBatch(); }} value={sort}>
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="border border-line bg-panel px-5 py-14 text-center" role="status"><p className="text-sm font-medium text-foreground">Loading problems</p><p className="mt-2 text-sm text-muted">Preparing the problem list.</p></div>
      ) : error ? (
        <div className="border border-line bg-panel px-5 py-12 text-center" role="alert"><p className="text-sm font-medium text-foreground">We couldn’t load the problem set</p><p className="mt-2 text-sm text-muted">{error}</p><button className="mt-5 border border-line-strong px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={retry} type="button">Try again</button></div>
      ) : filteredProblems.length === 0 ? (
        <div className="border border-line bg-panel px-5 py-14 text-center"><p className="text-sm font-medium text-foreground">No matching problems</p><p className="mt-2 text-sm text-muted">Try another search or adjust the selected filters.</p><button className="mt-4 text-sm font-medium text-accent hover:underline" onClick={clearFilters} type="button">Clear filters</button></div>
      ) : (
        <>
          <div className="overflow-hidden border border-line bg-panel" aria-label="Problems">
            <div className="hidden grid-cols-[minmax(12rem,1fr)_8rem_minmax(12rem,1.2fr)_8rem] gap-4 border-b border-line bg-surface px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted sm:grid">
              <span>Problem</span><span>Difficulty</span><span>Topics</span><span className="text-right">Solved</span>
            </div>
            <div>
              {visibleProblems.map((problem) => (
                <Link
                  aria-label={`${problem.title}${problem.problemId ? `, problem ${problem.problemId}` : ""}. Open problem workspace in a new tab.`}
                  className="group grid gap-2 border-b border-line px-4 py-4 outline-none transition-colors last:border-0 hover:bg-hover/60 focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:grid-cols-[minmax(12rem,1fr)_8rem_minmax(12rem,1.2fr)_8rem] sm:items-center sm:gap-4 sm:px-5"
                  href={problem.href}
                  key={problem.key}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:text-accent">{problem.title}</span>
                    {problem.problemId && <span className="mt-1 block font-mono text-xs text-muted">{problem.problemId}</span>}
                  </span>
                  <span className="flex items-center gap-2 sm:block">
                    <span className="text-[11px] text-muted sm:hidden">Difficulty</span>
                    <span className="inline-flex border border-line-strong px-2 py-1 text-xs text-muted">{difficultyLabel(problem)}</span>
                    {problem.difficulty === null && isValidRating(problem.rating) && <span className="ml-2 text-[11px] text-muted" title="Original Codeforces problem rating">Rating {problem.rating}</span>}
                  </span>
                  <span className="flex min-w-0 flex-wrap gap-1.5">
                    <span className="w-full text-[11px] text-muted sm:hidden">Topics</span>
                    {problem.topics.length > 0 ? problem.topics.slice(0, 4).map((topic) => <span className="border border-line px-2 py-1 text-[11px] text-muted" key={topic}>{topic}</span>) : <span className="text-xs text-muted">—</span>}
                    {problem.topics.length > 4 && <span className="px-1 py-1 text-[11px] text-muted">+{problem.topics.length - 4}</span>}
                  </span>
                  <span className="flex items-center justify-between text-xs tabular-nums text-muted sm:justify-end">
                    <span className="sm:hidden">Solved</span>{formatCount(problem.solvedCount)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          {externalUnavailable && <p className="text-xs leading-5 text-muted" role="status">Some problems are temporarily unavailable. Your CodeTrail practice problems are still ready.</p>}
          {hasMore ? (
            <div className="flex min-h-12 items-center justify-center" ref={sentinelRef}>
              {loadingMore && <p className="text-xs text-muted" role="status">Loading more problems…</p>}
            </div>
          ) : (
            <p className="py-3 text-center text-xs text-muted" role="status">You’ve reached the end of the results.</p>
          )}
        </>
      )}
    </section>
  );
}
