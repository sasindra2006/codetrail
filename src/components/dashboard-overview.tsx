import Link from "next/link";

const metrics = [
  { label: "Problems solved", detail: "Your completed practice will appear here." },
  { label: "Algorithms learned", detail: "Concepts you explore will build this view." },
  { label: "Current streak", detail: "A learning rhythm will appear over time." },
];

const exploreItems = [
  {
    title: "Algorithms",
    description: "Visualize concepts and understand how they work.",
    href: "/algorithms",
    action: "Explore algorithms",
  },
  {
    title: "Problems",
    description: "Practice DSA problem-solving patterns.",
    href: "/problems",
    action: "Browse problems",
  },
];

export function DashboardOverview() {
  return (
    <div className="w-full max-w-6xl">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Learning workspace</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">Welcome back.</h1>
        <p className="mt-3 text-base leading-7 text-muted">Build your DSA intuition.</p>
      </header>

      <section aria-labelledby="progress-heading" className="mt-12">
        <div className="flex items-end justify-between gap-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight" id="progress-heading">Progress snapshot</h2>
            <p className="mt-1 text-sm text-muted">Your learning activity will take shape here.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
          {metrics.map((metric) => (
            <article className="bg-panel px-5 py-5 sm:px-6" key={metric.label}>
              <p className="text-sm font-medium text-muted">{metric.label}</p>
              <p className="mt-5 font-mono text-3xl text-foreground">—</p>
              <p className="mt-4 text-sm leading-6 text-muted">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="continue-heading" className="mt-12">
        <div className="flex items-end justify-between gap-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight" id="continue-heading">Continue learning</h2>
            <p className="mt-1 text-sm text-muted">A suggested starting point while your trail is still new.</p>
          </div>
        </div>
        <article className="mt-5 border border-line bg-panel p-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-7">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Starter path</p>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">Arrays</h3>
            <p className="mt-2 text-sm text-muted">Fundamentals <span aria-hidden="true">→</span> Searching</p>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted">Begin with a core structure, then use it to reason about simple search strategies.</p>
          </div>
          <Link className="mt-6 inline-flex border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel sm:mt-0 sm:shrink-0" href="/algorithms">
            Continue
          </Link>
        </article>
      </section>

      <section aria-labelledby="explore-heading" className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight" id="explore-heading">Explore</h2>
        <p className="mt-1 text-sm text-muted">Choose a direction for your next focused session.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {exploreItems.map((item) => (
            <Link className="group border border-line bg-panel p-5 outline-none transition-colors hover:border-line-strong hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent/70" href={item.href} key={item.title}>
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
              <span className="mt-6 inline-block text-sm font-medium text-accent">{item.action} <span aria-hidden="true">→</span></span>
            </Link>
          ))}
          <article className="border border-line bg-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Complexity</h3>
              <span className="border border-line px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">Soon</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">Understand time and space trade-offs.</p>
            <p className="mt-6 text-sm text-muted">A dedicated complexity workspace is on the way.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
