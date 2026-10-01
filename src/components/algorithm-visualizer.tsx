"use client";

import { useEffect, useMemo, useState } from "react";
import { executeBubbleSort } from "@/lib/algorithms/bubble-sort";
import type { AlgorithmExecutionStep } from "@/lib/algorithms/execution";

const STARTING_ARRAY = [42, 17, 68, 9, 31, 54, 23];
const STEP_INTERVAL_MS = 650;

function describeStep(step: AlgorithmExecutionStep | undefined, count: number) {
  if (!step) return "Ready to compare adjacent values.";
  if (step.type === "comparison") {
    return `Comparing ${step.array[step.indices[0]]} and ${step.array[step.indices[1]]}.`;
  }
  if (step.type === "swap") {
    return `Swapped ${step.array[step.indices[1]]} and ${step.array[step.indices[0]]}.`;
  }
  if (step.type === "mark-sorted") return `${step.array[step.index]} is in its sorted position.`;
  return `Sort complete. All ${count} values are in order.`;
}

function shuffleArray(values: readonly number[]) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function ArrayBars({
  values,
  step,
}: {
  values: readonly number[];
  step: AlgorithmExecutionStep | undefined;
}) {
  const max = Math.max(...values, 1);
  const activeIndices: readonly number[] = step && (step.type === "comparison" || step.type === "swap")
    ? step.indices
    : [];
  const swap = step?.type === "swap";

  return (
    <div
      aria-label={`Array values: ${values.join(", ")}`}
      className="flex h-64 justify-center gap-2 border-b border-line px-1 pb-0 sm:h-80 sm:gap-3"
      role="img"
    >
      {values.map((value, index) => {
        const sorted = step?.sortedIndices.includes(index) ?? false;
        const active = activeIndices.includes(index);
        const height = Math.max(12, (value / max) * 90);
        const tone = sorted
          ? "border-emerald-500/70 bg-emerald-500/20 text-foreground"
          : swap && active
            ? "border-rose-500 bg-rose-500/20 text-foreground"
            : active
              ? "border-amber-500 bg-amber-500/20 text-foreground"
              : "border-line-strong bg-hover text-foreground";

        return (
          <div className="flex h-full max-w-16 flex-1 flex-col items-center justify-end" key={index}>
            <span className={`mb-2 font-mono text-xs ${active || sorted ? "text-foreground" : "text-muted"}`}>
              {value}
            </span>
            <div
              className={`flex w-full items-start justify-center border-x border-t pt-2 font-mono text-[10px] transition-[height,background-color,border-color] duration-300 sm:text-xs ${tone}`}
              style={{ height: `${height}%` }}
            >
              {index}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  disabled = false,
  primary = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={`min-h-10 border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed disabled:opacity-40 ${primary ? "border-accent bg-accent text-accent-foreground hover:opacity-90" : "border-line-strong bg-panel text-foreground hover:bg-hover"}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function AlgorithmVisualizer() {
  const [input, setInput] = useState<readonly number[]>(STARTING_ARRAY);
  const steps = useMemo(() => executeBubbleSort(input), [input]);
  const [stepCount, setStepCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const currentStep = stepCount > 0 ? steps[stepCount - 1] : undefined;
  const complete = stepCount >= steps.length;
  const values = currentStep?.array ?? input;
  const progress = steps.length === 0 ? 0 : (stepCount / steps.length) * 100;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const nextCount = Math.min(stepCount + 1, steps.length);
      setStepCount(nextCount);
      if (nextCount >= steps.length) setPlaying(false);
    }, STEP_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, stepCount, steps.length]);

  function advance() {
    setStepCount((count) => Math.min(count + 1, steps.length));
  }

  function reset(nextInput: readonly number[] = input) {
    setPlaying(false);
    setInput(nextInput);
    setStepCount(0);
  }

  return (
    <section aria-label="Bubble sort visualizer" className="border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Array visualization</h2>
          <p className="mt-1 text-xs text-muted">Compare neighbors, then follow each pass.</p>
        </div>
        <button
          aria-label="Shuffle array and restart visualization"
          className="min-h-10 border border-line-strong px-3 text-sm text-foreground outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => reset(shuffleArray(input))}
          type="button"
        >
          Shuffle array
        </button>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted" aria-label="Visualization legend">
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-amber-500" /> Comparing</span>
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-rose-500" /> Swapping</span>
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-emerald-500" /> Sorted</span>
        </div>

        <ArrayBars values={values} step={currentStep} />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="min-h-5 text-sm text-muted">
            {describeStep(currentStep, values.length)}
          </p>
          <p className="font-mono text-xs text-muted" aria-label={`Step ${stepCount} of ${steps.length}`}>
            {String(stepCount).padStart(3, "0")} <span className="text-line-strong">/</span> {String(steps.length).padStart(3, "0")}
          </p>
        </div>
        <div
          aria-label="Execution progress"
          aria-valuemax={steps.length}
          aria-valuemin={0}
          aria-valuenow={stepCount}
          className="mt-3 h-1 w-full bg-hover"
          role="progressbar"
        >
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ControlButton label="Start or play animation" onClick={() => setPlaying(true)} primary disabled={playing || complete}>
            {stepCount === 0 ? "Start" : "Play"}
          </ControlButton>
          <ControlButton label="Pause animation" onClick={() => setPlaying(false)} disabled={!playing}>Pause</ControlButton>
          <ControlButton label="Advance one step" onClick={advance} disabled={playing || complete}>Step</ControlButton>
          <ControlButton label="Reset to the starting array" onClick={() => reset()}>Reset</ControlButton>
        </div>
      </div>
    </section>
  );
}
