import { AlgorithmVisualizer } from "@/components/algorithm-visualizer";

export default function AlgorithmsPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Algorithm lab <span className="px-1 text-muted">/</span> Sorting
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Bubble sort
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Watch neighboring values move into order. Each pass carries the
              largest remaining value to the end of the array.
            </p>
          </div>
          <span className="border border-line px-3 py-1.5 font-mono text-xs text-muted">
            Stable · In-place
          </span>
        </div>
      </header>

      <AlgorithmVisualizer />

      <section aria-label="Bubble sort complexity" className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-panel p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Description</p>
          <p className="mt-2 text-sm leading-6 text-foreground">
            Repeatedly compare adjacent values and swap them when they are out of order.
          </p>
        </div>
        <div className="bg-panel p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Time complexity</p>
          <p className="mt-2 font-mono text-lg text-foreground">O(n²)</p>
          <p className="mt-1 text-xs text-muted">Average and worst case</p>
        </div>
        <div className="bg-panel p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Space complexity</p>
          <p className="mt-2 font-mono text-lg text-foreground">O(1)</p>
          <p className="mt-1 text-xs text-muted">Sorts in place</p>
        </div>
      </section>
    </section>
  );
}
