import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

const capabilities = [
  {
    number: "01",
    title: "See algorithms unfold",
    description:
      "Build intuition by following each operation, state change, and trade-off in a focused visual workspace.",
  },
  {
    number: "02",
    title: "Practice with purpose",
    description:
      "Move from concepts to problems with a workflow designed to make consistent DSA practice feel deliberate.",
  },
  {
    number: "03",
    title: "Understand the cost",
    description:
      "Connect every solution to its time and space complexity, so performance reasoning becomes second nature.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface text-foreground">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between border-b border-line px-5 sm:px-8">
        <Link
          aria-label="CodeTrail home"
          className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          href="/"
        >
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight">CodeTrail</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            className="border border-line px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            href="/dashboard"
          >
            Open workspace
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:gap-20 lg:py-36">
        <div className="max-w-3xl">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-accent">
            The DSA learning workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl sm:leading-[1.04]">
            Learn the patterns behind better problem solving.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            CodeTrail brings algorithm visualization, guided problem practice,
            complexity analysis, and learning progress into one disciplined place
            for mastering Data Structures and Algorithms.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              className="border border-accent bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              href="/dashboard"
            >
              Start learning
            </Link>
            <a
              className="border border-line px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-line-strong hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              href="#workflow"
            >
              Explore the workflow
            </a>
          </div>
        </div>

        <div className="relative overflow-hidden border border-line bg-panel p-5 sm:p-6">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-accent opacity-[0.12]" preserveAspectRatio="none" viewBox="0 0 400 360">
            <path d="M0 62h82l51 55h84l47-64h136M0 250h68l58-63h95l53 71h126M73 0v360M202 0v360M328 0v360" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M53 63 132 117m0 0 71 70m61-134-61 134m-77 0 95 0m53 71-71-71" fill="none" stroke="currentColor" strokeWidth="1.25" />
            <circle cx="53" cy="63" fill="currentColor" r="4" /><circle cx="132" cy="117" fill="currentColor" r="4" /><circle cx="203" cy="187" fill="currentColor" r="4" /><circle cx="264" cy="53" fill="currentColor" r="4" /><circle cx="126" cy="187" fill="currentColor" r="4" /><circle cx="274" cy="258" fill="currentColor" r="4" />
          </svg>
          <p className="relative text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
            Built for deliberate practice
          </p>
          <div className="relative mt-7 space-y-5">
            {[
              ["Visualize", "Trace structures and algorithms step by step."],
              ["Practice", "Turn knowledge into reliable problem-solving habits."],
              ["Reflect", "Track progress and sharpen complexity intuition."],
            ].map(([label, description], index) => (
              <div className="flex gap-4" key={label}>
                <span className="font-mono text-xs text-accent">0{index + 1}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line" id="workflow">
        <div className="mx-auto grid max-w-7xl divide-y divide-line px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0">
          {capabilities.map((capability) => (
            <article className="py-8 md:px-8 md:first:pl-0 md:last:pr-0" key={capability.number}>
              <p className="font-mono text-xs text-accent">{capability.number}</p>
              <h2 className="mt-6 text-lg font-semibold tracking-tight">{capability.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{capability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-16 sm:px-8 sm:py-20 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Start your trail</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">A clearer path through DSA.</h2>
        </div>
        <Link className="w-fit border border-line-strong px-5 py-3 text-sm font-semibold transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70" href="/dashboard">
          Enter CodeTrail
        </Link>
      </section>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 text-xs text-muted sm:px-8">
          <span className="font-medium text-foreground">CodeTrail</span>
          <span>Learn deliberately.</span>
        </div>
      </footer>
    </main>
  );
}
