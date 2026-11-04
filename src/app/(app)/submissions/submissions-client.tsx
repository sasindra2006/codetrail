"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { internalProblems } from "@/lib/problems";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false, loading: () => <div className="grid h-80 place-items-center text-sm text-muted" role="status">Loading code viewer…</div> });
type Row = { id: string; problemSlug: string; problemTitle: string; language: string; status: string; passedCount: number; totalCount: number; createdAt: string };
type Detail = Row & { sourceCode: string };
const verdicts = ["accepted", "wrong_answer", "time_limit_exceeded", "runtime_error", "compilation_error", "internal_judge_error"];
const label = (s: string) => ({ accepted: "Accepted", wrong_answer: "Wrong Answer", time_limit_exceeded: "Time Limit Exceeded", runtime_error: "Runtime Error", compilation_error: "Compilation Error", internal_judge_error: "Internal Judge Error" }[s] ?? s);
const date = (value: string) => new Date(value).toLocaleString();

export function MySubmissions() {
  const [rows, setRows] = useState<Row[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verdict, setVerdict] = useState("");
  const [language, setLanguage] = useState("");
  const [problem, setProblem] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const load = useCallback(async (nextOffset: number, append: boolean) => {
    setLoading(true); setError("");
    try {
      const query = new URLSearchParams({ limit: "20", offset: String(nextOffset) });
      if (verdict) query.set("verdict", verdict);
      if (language) query.set("language", language);
      if (problem) query.set("problem", problem);
      const response = await fetch(`/api/submissions?${query}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not load submissions.");
      setRows((current) => append ? [...current, ...body.submissions] : body.submissions);
      setHasMore(body.hasMore); setOffset(nextOffset);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load submissions."); }
    finally { setLoading(false); }
  }, [verdict, language, problem]);
  useEffect(() => { const timer = window.setTimeout(() => void load(0, false), 0); return () => window.clearTimeout(timer); }, [load]);
  const open = async (id: string) => {
    setDetail(null); setDetailError(""); setDetailLoading(true);
    try {
      const response = await fetch(`/api/submissions/${encodeURIComponent(id)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not load submission.");
      setDetail(body.submission);
    } catch (e) { setDetailError(e instanceof Error ? e.message : "Could not load submission."); }
    finally { setDetailLoading(false); }
  };
  const clearDetail = () => { setDetail(null); setDetailError(""); };

  return <section className="mx-auto w-full max-w-6xl">
    <div className="mb-8"><p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Practice history</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">My Submissions</h1><p className="mt-2 text-sm text-muted">Review verdicts and inspect the exact code you submitted.</p></div>
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <label className="text-xs text-muted">Verdict<select aria-label="Filter by verdict" className="mt-1 block h-10 w-full border border-line bg-panel px-3 text-sm text-foreground" value={verdict} onChange={(e) => setVerdict(e.target.value)}><option value="">All verdicts</option>{verdicts.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
      <label className="text-xs text-muted">Language<select aria-label="Filter by language" className="mt-1 block h-10 w-full border border-line bg-panel px-3 text-sm text-foreground" value={language} onChange={(e) => setLanguage(e.target.value)}><option value="">All languages</option><option value="cpp17">C++17</option><option value="python3">Python 3</option></select></label>
      <label className="text-xs text-muted">Problem<select aria-label="Filter by problem" className="mt-1 block h-10 w-full border border-line bg-panel px-3 text-sm text-foreground" value={problem} onChange={(e) => setProblem(e.target.value)}><option value="">All problems</option>{internalProblems.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}</select></label>
    </div>
    {error ? <div className="border border-amber-500/30 p-5 text-sm text-amber-500" role="alert">{error}<button className="ml-3 underline" onClick={() => void load(0, false)} type="button">Retry</button></div> : loading && rows.length === 0 ? <div className="border border-line p-8 text-center text-sm text-muted" role="status">Loading submissions…</div> : rows.length === 0 ? <div className="border border-line bg-panel px-6 py-12 text-center"><h2 className="text-lg font-medium">No submissions yet</h2><p className="mt-2 text-sm text-muted">Full submissions you make on CodeTrail will appear here.</p><Link className="mt-4 inline-block text-sm text-accent hover:underline" href="/problems">Browse problems</Link></div> : <>
      <div className="overflow-x-auto border border-line"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-panel text-xs uppercase tracking-wide text-muted"><tr>{["Problem", "Verdict", "Language", "Tests", "Submitted", ""].map((h, i) => <th className="px-4 py-3 font-medium" key={`${h}-${i}`}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-line" key={row.id}><td className="px-4 py-3 font-medium">{row.problemTitle}</td><td className={`px-4 py-3 ${row.status === "accepted" ? "text-emerald-500" : "text-amber-500"}`}>{label(row.status)}</td><td className="px-4 py-3">{row.language === "cpp17" ? "C++17" : "Python 3"}</td><td className="px-4 py-3 tabular-nums">{row.passedCount} / {row.totalCount}</td><td className="px-4 py-3 text-muted">{date(row.createdAt)}</td><td className="px-4 py-3"><button className="text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent" onClick={() => void open(row.id)} type="button">View code</button></td></tr>)}</tbody></table></div>
      <div className="mt-4 flex items-center justify-between text-sm text-muted"><span>{loading ? "Loading…" : `${rows.length} submissions shown`}</span>{hasMore && <button className="border border-line px-4 py-2 text-foreground hover:bg-hover disabled:opacity-50" disabled={loading} onClick={() => void load(offset + 20, true)} type="button">Load more</button>}</div>
    </>}
    {(detail || detailLoading || detailError) && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 sm:p-8" onMouseDown={(e) => { if (e.target === e.currentTarget) clearDetail(); }}><section aria-labelledby="submission-detail-title" aria-modal="true" className="flex max-h-[92vh] w-full max-w-5xl flex-col border border-line bg-panel shadow-2xl" role="dialog"><header className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5"><div><p className="text-xs uppercase tracking-wide text-muted">Historical submission</p><h2 className="mt-1 text-lg font-semibold" id="submission-detail-title">{detail?.problemTitle ?? (detailLoading ? "Loading submission…" : "Submission unavailable")}</h2>{detail && <p className="mt-1 text-xs text-muted">{label(detail.status)} · {detail.passedCount}/{detail.totalCount} tests · {detail.language === "cpp17" ? "C++17" : "Python 3"} · {date(detail.createdAt)}</p>}</div><button aria-label="Close submission details" className="border border-line px-3 py-2 text-sm hover:bg-hover" onClick={clearDetail} type="button">Close</button></header>{detailError ? <div className="p-6 text-sm text-amber-500" role="alert">{detailError}</div> : detail ? <div className="min-h-0 flex-1 p-2"><p className="px-3 py-2 text-xs font-medium text-muted">Read-only copy of submitted code</p><Editor height="min(68vh, 720px)" language={detail.language === "python3" ? "python" : "cpp"} options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on", lineNumbers: "on" }} theme="vs-dark" value={detail.sourceCode} /></div> : <div className="grid h-72 place-items-center text-sm text-muted" role="status">Loading submission…</div>}</section></div>}
  </section>;
}
