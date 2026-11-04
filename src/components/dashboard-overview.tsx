import Link from "next/link";
import type { ProgressSnapshot } from "@/lib/progress";

const quickLinks = [
  { title: "Practice problems", description: "Filter by topic and difficulty, then work through examples in the coding workspace.", href: "/problems", action: "Browse problems" },
  { title: "Explore algorithms", description: "Compare complexity and trace each algorithm one step at a time.", href: "/algorithms", action: "Open algorithms" },
  { title: "Review analytics", description: "Explore submission trends, activity, and progress metrics.", href: "/analytics", action: "View analytics" },
];

const verdictLabel = (status: string) => ({ accepted: "Accepted", wrong_answer: "Wrong Answer", compilation_error: "Compilation Error", runtime_error: "Runtime Error", time_limit_exceeded: "Time Limit Exceeded", internal_judge_error: "Judge Error" }[status] ?? status);

export function DashboardOverview({ progress }: { progress: ProgressSnapshot }) {
  const metrics = [
    { label: "Problems solved", value: progress.totalSolved, description: "Unique problems with an accepted submission" },
    { label: "Current streak", value: `${progress.currentStreak} days`, description: `Longest streak: ${progress.longestStreak} days` },
    { label: "Acceptance rate", value: `${progress.acceptanceRate}%`, description: `${progress.acceptedSubmissions} accepted of ${progress.totalSubmissions} submissions` },
  ];
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl"><p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Learning workspace</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">Welcome to CodeTrail.</h1><p className="mt-3 text-base leading-7 text-muted">Choose a problem to practice or visualize an algorithm to build a clearer mental model.</p></div>
        <Link className="inline-flex h-11 items-center justify-center border border-accent bg-accent px-4 text-sm font-semibold text-accent-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent" href="/problems">Start practicing</Link>
      </header>
      <section aria-labelledby="progress-heading">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-tight text-foreground" id="progress-heading">Learning progress</h2><p className="mt-1 text-sm text-muted">Based on your full submissions.</p></div><Link className="text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href="/analytics">Open analytics</Link></div>
        <div className="mt-4 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">{metrics.map((metric) => <article className="bg-panel p-5 sm:p-6" key={metric.label}><p className="text-sm font-medium text-muted">{metric.label}</p><p className="mt-5 font-mono text-3xl text-foreground">{metric.value}</p><p className="mt-3 text-xs leading-5 text-muted">{metric.description}</p></article>)}</div>
        <p className="mt-3 text-xs text-muted">Sample runs do not count toward progress. Active days in the streak metrics use UTC calendar dates.</p>
      </section>
      <section aria-labelledby="continue-heading" className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]">
        <article className="border border-line bg-panel p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Continue learning</p><h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground" id="continue-heading">Start with a visual walkthrough</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted">Bubble Sort makes comparisons visible from the first step. Use the controls to pause, step through, or change the input array.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="border border-line-strong px-4 py-2.5 text-sm font-medium text-foreground outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent" href="/algorithms/bubble-sort">Open Bubble Sort</Link><Link className="px-4 py-2.5 text-sm font-medium text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent" href="/algorithms">All algorithms</Link></div></article>
        <aside className="border border-line bg-surface p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Recent submissions</p><Link className="text-xs text-accent hover:underline" href="/submissions">View all</Link></div>
          {progress.recentSubmissions.length ? <ul className="mt-3 divide-y divide-line">{progress.recentSubmissions.slice(0, 5).map((item) => <li className="flex items-center justify-between gap-3 py-3 first:pt-0" key={item.id}><div className="min-w-0"><Link className="block truncate text-sm font-medium text-foreground hover:text-accent" href={`/problems/${encodeURIComponent(item.problemSlug)}`}>{item.problemTitle}</Link><p className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p></div><span className={`shrink-0 text-xs ${item.status === "accepted" ? "text-emerald-500" : "text-amber-500"}`}>{verdictLabel(item.status)}</span></li>)}</ul> : <div className="py-5"><p className="text-sm font-medium text-foreground">No full submissions yet</p><p className="mt-2 text-sm leading-6 text-muted">Submit a solution to start building your progress history.</p></div>}
        </aside>
      </section>
      <section aria-labelledby="quick-access-heading"><div><h2 className="text-lg font-semibold tracking-tight text-foreground" id="quick-access-heading">Quick access</h2><p className="mt-1 text-sm text-muted">Jump into a focused learning area.</p></div><div className="mt-4 grid gap-3 md:grid-cols-3">{quickLinks.map((item) => <Link className="group border border-line bg-panel p-5 outline-none transition-colors hover:border-line-strong hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent" href={item.href} key={item.title}><h3 className="text-sm font-semibold text-foreground group-hover:text-accent">{item.title}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-muted">{item.description}</p><span className="mt-5 inline-block text-sm font-medium text-accent">{item.action} <span aria-hidden="true">→</span></span></Link>)}</div></section>
    </div>
  );
}
