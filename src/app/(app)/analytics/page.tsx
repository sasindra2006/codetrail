import Link from "next/link";
import type { LearningAnalyticsSnapshot } from "@/lib/analytics";

// Progress data is not persisted yet. Keep the page ready for a real snapshot
// and show honest empty states until an account/activity source is connected.
const snapshot: LearningAnalyticsSnapshot | null = null;

function formatActivityDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className="border border-line bg-panel p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-5 grid min-h-36 place-items-center border border-dashed border-line-strong px-5 py-8 text-center">
        <p className="max-w-sm text-sm leading-6 text-muted">{description}</p>
      </div>
    </section>
  );
}

function AnalyticsPanels({ data }: { data: LearningAnalyticsSnapshot }) {
  const maxDaily = Math.max(1, ...data.activity.map((day) => day.solvedCount));
  const metrics = [
    ["Problems solved", data.totalSolved],
    ["Problems attempted", data.totalAttempted],
    ["Current streak", `${data.currentStreak} days`],
    ["Topics practiced", data.topics.filter((topic) => topic.attempted > 0).length],
  ] as const;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => <article className="border border-line bg-panel p-5" key={label}><h2 className="text-xs font-medium uppercase tracking-wide text-muted">{label}</h2><p className="mt-5 font-mono text-3xl text-foreground">{value}</p></article>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-line bg-panel p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Activity over time</h2>
          {data.activity.length ? (
            <div aria-label="Daily problems solved" className="mt-6 flex h-40 items-end gap-1 border-b border-line px-1" role="img">
              {data.activity.slice(-30).map((day) => <div className="min-w-1 flex-1 bg-accent/70" key={day.date} style={{ height: `${Math.max(4, (day.solvedCount / maxDaily) * 100)}%` }} title={`${day.date}: ${day.solvedCount} solved`} />)}
            </div>
          ) : <p className="mt-5 text-sm text-muted">No daily activity to chart yet.</p>}
        </section>
        <section className="border border-line bg-panel p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Difficulty distribution</h2>
          {data.difficulties.length ? <div className="mt-5 space-y-4">{data.difficulties.map((item) => <div key={item.difficulty}><div className="flex justify-between gap-3 text-sm"><span className="text-foreground">{item.difficulty}</span><span className="text-muted">{item.solved} solved / {item.attempted} attempted</span></div><div className="mt-2 h-1.5 bg-hover"><div className="h-full bg-accent" style={{ width: `${item.attempted ? Math.min(100, item.solved / item.attempted * 100) : 0}%` }} /></div></div>)}</div> : <p className="mt-5 text-sm text-muted">No difficulty data to show yet.</p>}
        </section>
        <section className="border border-line bg-panel p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Topic progress</h2>
          {data.topics.length ? <ul className="mt-5 space-y-3">{data.topics.map((topic) => <li className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0" key={topic.topic}><span className="text-sm text-foreground">{topic.topic}</span><span className="font-mono text-xs text-muted">{topic.solved} / {topic.attempted}</span></li>)}</ul> : <p className="mt-5 text-sm text-muted">No topic activity to show yet.</p>}
        </section>
        <section className="border border-line bg-panel p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Recent problem activity</h2>
          {data.recentActivity.length ? <ul className="mt-5 divide-y divide-line">{data.recentActivity.map((item) => <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" key={`${item.problemSlug}-${item.occurredAt}`}><Link className="text-sm font-medium text-foreground hover:text-accent" href={`/problems/${encodeURIComponent(item.problemSlug)}`}>{item.title}</Link><span className="text-xs text-muted">{item.outcome === "solved" ? "Solved" : "Attempted"} · {formatActivityDate(item.occurredAt)}</span></li>)}</ul> : <p className="mt-5 text-sm text-muted">No recent problem activity.</p>}
        </section>
      </div>
    </>
  );
}

export default function AnalyticsPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="border-b border-line pb-7">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent">Learning signals</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Analytics</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Review practice volume, consistency, and topic coverage when learning activity is connected.</p>
      </header>

      {snapshot ? (
        <AnalyticsPanels data={snapshot} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Problems solved", "Track completed practice."],
              ["Problems attempted", "See your practice volume."],
              ["Current streak", "Follow consistency over time."],
              ["Topics practiced", "Understand your coverage."],
            ].map(([title, description]) => (
              <article className="border border-line bg-panel p-5" key={title}>
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{title}</h2>
                <p className="mt-5 font-mono text-3xl text-foreground" aria-label={`${title}: no data`}>—</p>
                <p className="mt-3 text-xs leading-5 text-muted">{description}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <EmptyPanel title="Activity over time" description="Daily practice will appear here when activity tracking is available." />
            <EmptyPanel title="Difficulty distribution" description="Solved and attempted problems will be grouped by difficulty here." />
            <EmptyPanel title="Topic progress" description="Topic coverage will help reveal strengths and areas to revisit." />
            <EmptyPanel title="Recent problem activity" description="Recent attempts and accepted solutions will appear here." />
          </div>
          <div className="flex flex-col gap-4 border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Start building your learning trail</h2>
              <p className="mt-1 text-sm text-muted">Your activity is not being recorded yet. Explore a problem or algorithm to continue learning.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="border border-line-strong px-3 py-2 text-sm text-foreground hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href="/problems">Browse problems</Link>
              <Link className="border border-line-strong px-3 py-2 text-sm text-foreground hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href="/algorithms">Explore algorithms</Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
