
"use client";

import { useEffect, useMemo, useState } from "react";
import { executeBubbleSort } from "@/lib/algorithms/bubble-sort";
import { executeSelectionSort } from "@/lib/algorithms/selection-sort";
import { executeInsertionSort } from "@/lib/algorithms/insertion-sort";
import type { AlgorithmExecutionStep } from "@/lib/algorithms/execution";
import type { PseudocodeLine } from "@/lib/algorithms/execution";

const STARTING_ARRAY = [42, 17, 68, 9, 31, 54, 23];
const STEP_INTERVAL_MS = 650;
const MAX_ARRAY_SIZE = 20;

export type SortingAlgorithm = "bubble" | "selection" | "insertion";

function describeStep(
  step: AlgorithmExecutionStep | undefined,
  count: number,
  algorithm: SortingAlgorithm,
) {
  if (!step) {
    if (algorithm === "bubble") return "Ready to compare adjacent values.";
    if (algorithm === "selection") return "Ready to find the minimum value.";
    return "Ready to insert each value into the sorted prefix.";
  }

  if (step.type === "comparison") {
    return `Comparing ${step.array[step.indices[0]]} and ${step.array[step.indices[1]]}.`;
  }

  if (step.type === "decision") return `Checking whether the minimum at index ${step.indices[1]} needs to move to index ${step.indices[0]}.`;
  if (step.type === "minimum-update") return `${step.array[step.index]} is the new minimum.`;

  if (step.type === "swap") {
    return `Swapped ${step.array[step.indices[0]]} and ${step.array[step.indices[1]]}.`;
  }

  if (step.type === "mark-sorted") {
    return `${step.array[step.index]} is in its sorted position.`;
  }

  if (step.type === "key") return `Selected ${step.key} as the key to insert.`;
  if (step.type === "shift") return `Shifted ${step.array[step.to]} from index ${step.from} to ${step.to}. The key ${step.key} is waiting to be inserted.`;
  if (step.type === "insert") return `Inserted ${step.key} at index ${step.index}.`;

  return `Sorting complete. All ${count} values are in order. Reset to run it again.`;
}

function shuffleArray(values: readonly number[]) {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function parseArrayInput(value: string): number[] {
  const tokens = value.split(",").map((token) => token.trim());

  if (tokens.some((token) => token === "")) {
    throw new Error("Enter integers separated by commas.");
  }

  if (tokens.length > MAX_ARRAY_SIZE) {
    throw new Error(`Enter no more than ${MAX_ARRAY_SIZE} numbers.`);
  }

  return tokens.map((token) => {
    if (!/^-?\d+$/.test(token)) {
      throw new Error("Use whole numbers separated by commas.");
    }

    const number = Number(token);

    if (!Number.isSafeInteger(number)) {
      throw new Error("Each number must be a safe integer.");
    }

    return number;
  });
}

function ArrayBars({
  values,
  step,
}: {
  values: readonly number[];
  step: AlgorithmExecutionStep | undefined;
}) {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;

  const activeIndices: readonly number[] = step && (step.type === "comparison" || step.type === "decision" || step.type === "swap")
    ? step.indices
    : step?.type === "minimum-update" ? [step.index]
    : step?.type === "shift" ? [step.from, step.to]
      : step?.type === "key" || step?.type === "insert" ? [step.index] : [];
  const keyValue = step && (step.type === "key" || step.type === "shift" || step.type === "insert") ? step.key : undefined;

  const swap = step?.type === "swap";
  const MIN_BAR_HEIGHT = 12;
  const MAX_BAR_HEIGHT = 90;

  return (
    <div
      aria-label={`Array values: ${values.join(", ")}`}
      className="flex h-64 justify-center gap-2 border-b border-line px-1 pb-0 sm:h-80 sm:gap-3"
      role="img"
    >
      {values.map((value, index) => {
        const sorted = step?.sortedIndices.includes(index) ?? false;
        const active = activeIndices.includes(index);

        const height =
          valueRange === 0
            ? MIN_BAR_HEIGHT
            : MIN_BAR_HEIGHT +
              ((value - minValue) / valueRange) *
                (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);

        const isKey = keyValue !== undefined && step?.type === "key" && index === step.index;
        const shifting = step?.type === "shift" && activeIndices.includes(index);
        const tone = isKey
          ? "border-sky-400 bg-sky-400/20 text-foreground"
          : shifting
            ? "border-rose-500 bg-rose-500/20 text-foreground"
          : sorted
          ? "border-emerald-500/70 bg-emerald-500/20 text-foreground"
          : swap && active
            ? "border-rose-500 bg-rose-500/20 text-foreground"
            : active
              ? "border-amber-500 bg-amber-500/20 text-foreground"
              : "border-line-strong bg-hover text-foreground";

        return (
          <div
            className="flex h-full max-w-16 flex-1 flex-col items-center justify-end"
            key={index}
          >
            <span
              className={`mb-2 font-mono text-xs ${
                active || sorted ? "text-foreground" : "text-muted"
              }`}
            >
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
      className={`min-h-10 border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "border-accent bg-accent text-accent-foreground hover:opacity-90"
          : "border-line-strong bg-panel text-foreground hover:bg-hover"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function AlgorithmVisualizer({ algorithm = "bubble", pseudocode }: { algorithm?: SortingAlgorithm; pseudocode: readonly PseudocodeLine[] }) {
  const [input, setInput] = useState<readonly number[]>(STARTING_ARRAY);
  const [inputText, setInputText] = useState(STARTING_ARRAY.join(", "));
  const [inputError, setInputError] = useState<string | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps = useMemo(
    () =>
      algorithm === "bubble"
        ? executeBubbleSort(input)
        : algorithm === "selection"
          ? executeSelectionSort(input)
          : executeInsertionSort(input),
    [algorithm, input],
  );

  const currentStep = stepCount > 0 ? steps[stepCount - 1] : undefined;
  const complete = stepCount >= steps.length;
  const values = currentStep?.array ?? input;
  const progress = steps.length === 0 ? 0 : (stepCount / steps.length) * 100;

  useEffect(() => {
    if (!playing) return;

    const timer = window.setTimeout(() => {
      const nextCount = Math.min(stepCount + 1, steps.length);

      setStepCount(nextCount);

      if (nextCount >= steps.length) {
        setPlaying(false);
      }
    }, STEP_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [playing, stepCount, steps.length]);

  function reset(nextInput: readonly number[] = input) {
    setPlaying(false);
    setInput(nextInput);
    setInputText(nextInput.join(", "));
    setInputError(null);
    setStepCount(0);
  }

  function applyInput() {
    try {
      reset(parseArrayInput(inputText));
    } catch (error) {
      setInputError(
        error instanceof Error ? error.message : "Invalid array input.",
      );
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
    <section aria-labelledby="algorithm-pseudocode-heading" className="min-w-0 overflow-hidden border border-line bg-panel">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground" id="algorithm-pseudocode-heading">Pseudocode</h2>
        <p className="mt-1 text-xs text-muted">Language-independent outline. The highlighted line matches the current step.</p>
      </div>
      <ol aria-label={`${algorithm} sort pseudocode`} className="max-w-full overflow-x-auto p-3 font-mono text-sm leading-6 sm:p-4">
        {pseudocode.map((line, index) => {
          const active = currentStep?.lineId === line.id;
          return (
            <li
              aria-current={active ? "step" : undefined}
              className={`flex min-w-max items-baseline gap-4 border-l-2 px-3 py-0.5 ${active ? "border-accent bg-accent/15 text-foreground" : "border-transparent text-muted"}`}
              key={line.id}
            >
              <span aria-hidden="true" className="w-5 shrink-0 select-none text-right text-xs text-muted">{index + 1}</span>
              <span className="whitespace-pre">{line.text}</span>
            </li>
          );
        })}
      </ol>
    </section>
    <section
      aria-label={`${algorithm === "bubble" ? "Bubble" : algorithm === "selection" ? "Selection" : "Insertion"} sort visualizer`}
      className="border border-line bg-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Array visualization
          </h2>
          <p className="mt-1 text-xs text-muted">
            {algorithm === "bubble"
              ? "Compare neighbors, then follow each pass."
              : algorithm === "selection"
                ? "Find the minimum remaining value on each pass."
                : "Hold each key, shift larger values, then insert it into the sorted prefix."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label="Shuffle array and restart visualization"
            className="min-h-10 border border-line-strong px-3 text-sm text-foreground outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => reset(shuffleArray(input))}
            type="button"
          >
            Shuffle array
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <form
          className="mb-6"
          onSubmit={(event) => {
            event.preventDefault();
            applyInput();
          }}
        >
          <label
            className="mb-2 block text-sm font-medium text-foreground"
            htmlFor="sorting-array-input"
          >
            Customize your array
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="min-h-10 min-w-0 flex-1 border border-line-strong bg-surface px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
              id="sorting-array-input"
              inputMode="text"
              maxLength={400}
              onChange={(event) => {
                setInputText(event.target.value);
                setInputError(null);
              }}
              placeholder="e.g. 42, 17, 68, 9, 31"
              value={inputText}
              aria-describedby="sorting-input-help"
              aria-invalid={inputError !== null}
            />

            <button
              className="min-h-10 border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              type="submit"
            >
              Apply array
            </button>
          </div>

          <p className="mt-2 text-xs text-muted" id="sorting-input-help">
            Enter 1–{MAX_ARRAY_SIZE} integers separated by commas. Negative
            numbers and duplicates are allowed.
          </p>

          {inputError && (
            <p className="mt-2 text-sm text-rose-500" role="alert">
              {inputError}
            </p>
          )}
        </form>

        <div
          className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted"
          aria-label="Visualization legend"
        >
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 bg-amber-500" /> Comparing
          </span>
          {algorithm === "insertion" ? <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-sky-400" /> Active key</span> : null}
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 bg-rose-500" /> {algorithm === "insertion" ? "Shifting" : "Swapping"}
          </span>
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 bg-emerald-500" /> Sorted
          </span>
        </div>

        <div aria-live="polite" className="mb-3 flex h-8 items-start">
          {currentStep && (currentStep.type === "key" || currentStep.type === "shift") ? (
            <p className="inline-flex border border-sky-400/60 bg-sky-400/10 px-3 py-1.5 font-mono text-xs text-foreground">
              Active key: {currentStep.key}
            </p>
          ) : null}
        </div>
        <ArrayBars values={values} step={currentStep} />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="min-h-5 text-sm text-muted">
            {describeStep(currentStep, values.length, algorithm)}
          </p>

          <p
            className="font-mono text-xs text-muted"
            aria-label={`Step ${stepCount} of ${steps.length}`}
          >
            {String(stepCount).padStart(3, "0")}{" "}
            <span className="text-line-strong">/</span>{" "}
            {String(steps.length).padStart(3, "0")}
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
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ControlButton
            label={playing ? "Pause animation" : "Play animation"}
            onClick={() => setPlaying((isPlaying) => !isPlaying)}
            primary
            disabled={complete}
          >
            {playing ? (
              <span className="inline-flex items-center gap-2"><svg aria-hidden="true" className="size-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M4 3h3v10H4zM9 3h3v10H9z" /></svg>Pause</span>
            ) : (
              <span className="inline-flex items-center gap-2"><svg aria-hidden="true" className="size-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2.8v10.4L13 8z" /></svg>Play</span>
            )}
          </ControlButton>

          <ControlButton
            label="Previous step"
            onClick={() => {
              setPlaying(false);
              setStepCount((count) => Math.max(count - 1, 0));
            }}
            disabled={stepCount === 0}
          >
            Previous
          </ControlButton>

          <ControlButton
            label="Next step"
            onClick={() => {
              setPlaying(false);
              setStepCount((count) => Math.min(count + 1, steps.length));
            }}
            disabled={complete}
          >
            Next
          </ControlButton>

          <ControlButton
            label="Reset to the current starting array"
            onClick={() => reset()}
          >
            Reset
          </ControlButton>
        </div>
      </div>
    </section>
    </div>
  );
}
