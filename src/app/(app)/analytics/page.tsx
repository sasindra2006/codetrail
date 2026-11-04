import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import { getProgressSnapshot } from "@/lib/progress";

const verdictNames: Record<string, string> = { accepted: "Accepted", wrong_answer: "Wrong Answer", compilation_error: "Compilation Error", runtime_error: "Runtime Error", time_limit_exceeded: "Time Limit Exceeded", internal_judge_error: "Internal Judge Error" };
const languageNames: Record<string, string> = { cpp17: "C++17", python3: "Python 3" };
const verdictColors: Record<string, string> = { accepted: "bg-emerald-500", wrong_answer: "bg-amber-500", compilation_error: "bg-rose-500", runtime_error: "bg-orange-500", time_limit_exceeded: "bg-violet-500", internal_judge_error: "bg-muted" };

function ActivityCalendar({ activity }: { activity: Array<{ date: string; count: number }> }) {
  const maxCount = Math.max(1, ...activity.map((day) => day.count));
  const first = new Date(`${activity[0]?.date ?? "2025-01-01"}T00:00:00Z`);
  const sunday = new Date(first);
  sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
  const colorFor = (count: number) => count === 0 ? "bg-hover" : count / maxCount < 0.25 ? "bg-accent/30" : count / maxCount < 0.5 ? "bg-accent/50" : count / maxCount < 0.75 ? "bg-accent/75" : "bg-accent";
  return <div className="mt-5 overflow-x-auto pb-2">
    <p className="mb-3 text-xs text-muted">Daily full submissions · UTC · previous 365 days</p>
    <div aria-label="Submission activity calendar for the previous 365 days" className="grid min-w-[620px] grid-rows-7 grid-flow-col gap-1" role="group" style={{ gridTemplateColumns: "repeat(53, minmax(0, 1fr))" }}>
      {activity.map((day) => {
        const date = new Date(`${day.date}T00:00:00Z`);
        const column = Math.floor((date.getTime() - sunday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        return <span aria-label={`${day.date}: ${day.count} submissions`} className={`size-3 rounded-[2px] ${colorFor(day.count)}`} key={day.date} role="img" style={{ gridColumn: column, gridRow: date.getUTCDay() + 1 }} title={`${day.date}: ${day.count} submissions`} />;
      })}
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted"><span>{activity[0]?.date} — {activity.at(-1)?.date}</span><span>{activity.reduce((n, day) => n + day.count, 0)} submissions · {activity.filter((day) => day.count > 0).length} active days</span><span className="flex items-center gap-1.5" aria-label="Activity intensity legend"><span>Less</span>{["bg-hover", "bg-accent/30", "bg-accent/50", "bg-accent/75", "bg-accent"].map((color) => <i className={`size-3 rounded-[2px] ${color}`} key={color} />)}<span>More</span></span></div>
  </div>;
}

export default async function AnalyticsPage() {
  const session = await requireSession();
  const data = await getProgressSnapshot(session.user.id);
  const metrics = [
    ["Problems solved", data.totalSolved], ["Problems attempted", data.totalAttempted],
    ["Current streak", `${data.currentStreak} days`], ["Longest streak", `${data.longestStreak} days`],
    ["Active days", data.activeDays], ["Full submissions", data.totalSubmissions],
    ["Accepted submissions", data.acceptedSubmissions], ["Acceptance rate", `${data.acceptanceRate}%`],
  ] as const;
  return <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
    <header className="border-b border-line pb-7"><p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent">Learning signals</p><h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Analytics</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Progress is based on full submissions. Sample runs are excluded.</p></header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value]) => <article className="border border-line bg-panel p-5" key={label}><h2 className="text-xs font-medium uppercase tracking-wide text-muted">{label}</h2><p className="mt-5 font-mono text-3xl text-foreground">{value}</p></article>)}</div>
    <section className="border border-line bg-panel p-5 sm:p-6"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-sm font-semibold text-foreground">Activity calendar</h2><p className="text-xs text-muted">Current streak: {data.currentStreak} · Longest: {data.longestStreak}</p></div><ActivityCalendar activity={data.activity} /></section>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="border border-line bg-panel p-5 sm:p-6"><h2 className="text-sm font-semibold text-foreground">Difficulty distribution</h2><p className="mt-1 text-xs text-muted">A problem counts solved after any accepted full submission.</p><div className="mt-5 space-y-4">{data.difficulties.map((item) => <div key={item.difficulty}><div className="flex justify-between gap-3 text-sm"><span>{item.difficulty}</span><span className="text-muted">{item.solved} solved / {item.attempted} attempted</span></div><div className="mt-2 h-1.5 bg-hover"><div className="h-full bg-accent" style={{ width: `${item.attempted ? Math.min(100, (item.solved / item.attempted) * 100) : 0}%` }} /></div></div>)}</div></section>
      <section className="border border-line bg-panel p-5 sm:p-6"><h2 className="text-sm font-semibold text-foreground">Submission verdicts</h2><div className="mt-5 space-y-3">{data.verdicts.map((item) => <div className="flex items-center gap-3" key={item.verdict}><span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${verdictColors[item.verdict] ?? "bg-muted"}`} /><span className="flex-1 text-sm">{verdictNames[item.verdict] ?? item.verdict}</span><span className="font-mono text-sm text-muted">{item.count}</span><div aria-hidden="true" className="h-1.5 w-24 bg-hover sm:w-32"><div className={`h-full ${verdictColors[item.verdict] ?? "bg-muted"}`} style={{ width: `${data.totalSubmissions ? item.count / data.totalSubmissions * 100 : 0}%` }} /></div></div>)}</div></section>
      <section className="border border-line bg-panel p-5 sm:p-6"><h2 className="text-sm font-semibold text-foreground">Language usage</h2>{data.languages.length ? <ul className="mt-5 space-y-3">{data.languages.map((item) => <li className="flex items-center justify-between border-b border-line pb-3 last:border-0 last:pb-0" key={item.language}><span className="text-sm">{languageNames[item.language] ?? item.language}</span><span className="font-mono text-sm text-muted">{item.count} submissions · {data.totalSubmissions ? Math.round(item.count / data.totalSubmissions * 100) : 0}%</span></li>)}</ul> : <p className="mt-5 text-sm text-muted">No language usage yet.</p>}</section>
      <section className="border border-line bg-panel p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">Recent submissions</h2><Link className="text-xs text-accent hover:underline" href="/submissions">View all</Link></div>{data.recentSubmissions.length ? <ul className="mt-4 divide-y divide-line">{data.recentSubmissions.map((item) => <li className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0" key={item.id}><div><Link className="text-sm font-medium hover:text-accent" href={`/problems/${encodeURIComponent(item.problemSlug)}`}>{item.problemTitle}</Link><p className="mt-1 text-xs text-muted">{languageNames[item.language] ?? item.language} · {new Date(item.createdAt).toLocaleString()}</p></div><span className={`text-xs ${item.status === "accepted" ? "text-emerald-500" : "text-amber-500"}`}>{verdictNames[item.status] ?? item.status} · {item.passedCount}/{item.totalCount}</span></li>)}</ul> : <p className="mt-5 text-sm text-muted">No full submissions yet. <Link className="text-accent hover:underline" href="/problems">Try a problem</Link>.</p>}</section>
    </div>
  </section>;
}
