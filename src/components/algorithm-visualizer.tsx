
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { executeBubbleSort } from "@/lib/algorithms/bubble-sort";
import { executeSelectionSort } from "@/lib/algorithms/selection-sort";
import { executeInsertionSort } from "@/lib/algorithms/insertion-sort";
import { executeLinearSearch } from "@/lib/algorithms/linear-search";
import { executeBinarySearch } from "@/lib/algorithms/binary-search";
import { executeMergeSort } from "@/lib/algorithms/merge-sort";
import { executeQuickSort } from "@/lib/algorithms/quick-sort";
import type { AlgorithmExecutionStep } from "@/lib/algorithms/execution";
import type { PseudocodeLine } from "@/lib/algorithms/execution";
import { algorithmSourceCode, codeLanguages, type CodeLanguage } from "@/lib/algorithms/source-code";

const STARTING_ARRAY = [42, 17, 68, 9, 31, 54, 23];
const STEP_INTERVAL_MS = 650;
const MIN_ARRAY_SIZE = 5;
const MAX_ARRAY_SIZE = 10;

export type SortingAlgorithm = "bubble" | "selection" | "insertion" | "merge" | "quick" | "linear" | "binary";

function describeStep(
  step: AlgorithmExecutionStep | undefined,
  count: number,
  algorithm: SortingAlgorithm,
) {
  if (!step) {
    if (algorithm === "linear") return "Ready to search the array from left to right.";
    if (algorithm === "binary") return "Ready to search the ascending array by halving the interval.";
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
  if (step.type === "search-compare") return `Checking index ${step.index}: ${step.array[step.index]} ${step.array[step.index] === step.target ? "matches" : "does not match"} target ${step.target}.`;
  if (step.type === "search-found") return `Found ${step.target} at index ${step.index}. This is the first matching index.`;
  if (step.type === "search-not-found") return `Target ${step.target} was not found after checking all ${count} values.`;
  if (step.type === "binary-compare") return `Comparing middle value ${step.array[step.mid]} at index ${step.mid} with target ${step.target}.`;
  if (step.type === "binary-left") return `Target is smaller than ${step.array[step.mid]}; continue in the left half (indices ${step.low} to ${step.high}).`;
  if (step.type === "binary-right") return `Target is larger than ${step.array[step.mid]}; continue in the right half (indices ${step.low} to ${step.high}).`;
  if (step.type === "binary-found") return `Found ${step.target} at index ${step.mid}.`;
  if (step.type === "binary-not-found") return `Target ${step.target} was not found; the search interval is empty.`;
  if (step.type === "merge-base") return `Range ${step.left}–${step.right} contains one value, so it is already sorted.`;
  if (step.type === "merge-split") return `Split range ${step.left}–${step.right} at index ${step.mid} into ${step.left}–${step.mid} and ${step.mid + 1}–${step.right}.`;
  if (step.type === "merge-start") return `Merge sorted ranges ${step.left}–${step.mid} and ${step.mid + 1}–${step.right}.`;
  if (step.type === "merge-compare") return `Compare ${step.leftValue} from the left half (index ${step.leftCursor}) with ${step.rightValue} from the right half (index ${step.rightCursor}).`;
  if (step.type === "merge-place") return `Place ${step.placedValue} from the ${step.placedFrom} half at index ${step.outputIndex}.`;
  if (step.type === "merge-complete") return `Merged range ${step.left}–${step.right} is now in ascending order.`;
  if (step.type === "quick-base") return `Range ${step.low}–${step.high} has one value and is already sorted.`;
  if (step.type === "quick-recurse") return `Recursively sort the nonempty ${step.side} range ${step.low}–${step.high}.`;
  if (step.type === "quick-partition") return `Partition active range ${step.low}–${step.high} using its final value as the pivot.`;
  if (step.type === "quick-pivot") return `Selected ${step.pivotValue} at index ${step.pivotIndex} as the pivot; boundary starts at ${step.boundary}.`;
  if (step.type === "quick-compare") return step.array[step.scanIndex] <= step.pivotValue
    ? `${step.array[step.scanIndex]} at index ${step.scanIndex} is less than or equal to pivot ${step.pivotValue}; it belongs in the left partition.`
    : `${step.array[step.scanIndex]} at index ${step.scanIndex} is greater than pivot ${step.pivotValue}; it stays in the right partition.`;
  if (step.type === "quick-swap") return `Value ${step.comparedValue} qualifies for the left partition; swap indices ${step.swapIndices?.[0]} and ${step.swapIndices?.[1]}.`;
  if (step.type === "quick-boundary") return `Advance the partition boundary to index ${step.boundary}.`;
  if (step.type === "quick-pivot-place") return `Pivot ${step.pivotValue} is now in its final position at index ${step.pivotIndex}.`;

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

function createRandomArray() {
  const size = Math.floor(Math.random() * (MAX_ARRAY_SIZE - MIN_ARRAY_SIZE + 1)) + MIN_ARRAY_SIZE;

  return Array.from({ length: size }, () =>
    Math.floor(Math.random() * 201) - 100,
  );
}

function sortAscending(values: readonly number[]) {
  return [...values].sort((left, right) => left - right);
}

function parseArrayInput(value: string, enforceRange = false): number[] {
  const tokens = value.split(",").map((token) => token.trim());

  if (tokens.some((token) => token === "")) {
    throw new Error(`Enter ${MIN_ARRAY_SIZE} to ${MAX_ARRAY_SIZE} integers separated by commas.`);
  }

  if (tokens.length < MIN_ARRAY_SIZE || tokens.length > MAX_ARRAY_SIZE) {
    throw new Error(`Enter between ${MIN_ARRAY_SIZE} and ${MAX_ARRAY_SIZE} integers.`);
  }

  return tokens.map((token) => {
    if (!/^-?\d+$/.test(token)) {
      throw new Error("Use whole numbers separated by commas.");
    }

    const number = Number(token);

    if (!Number.isSafeInteger(number)) {
      throw new Error("Each number must be a safe integer.");
    }
    if (enforceRange && (number < -100 || number > 100)) {
      throw new Error("Each number must be between -100 and 100.");
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
      : step?.type === "key" || step?.type === "insert" ? [step.index]
        : step?.type === "search-compare" || step?.type === "search-found" ? [step.index]
          : step?.type === "binary-compare" || step?.type === "binary-left" || step?.type === "binary-right" || step?.type === "binary-found" ? [step.mid]
            : step?.type === "merge-compare" ? [step.leftCursor, step.rightCursor]
            : step?.type === "merge-place" ? [step.outputIndex]
              : step?.type === "quick-compare" ? [step.scanIndex]
                : step?.type === "quick-swap" ? step.swapIndices ?? [] : [];
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
        const searching = step?.type === "search-compare" || step?.type === "search-found" || step?.type === "search-not-found";
        const binary = step?.type === "binary-compare" || step?.type === "binary-left" || step?.type === "binary-right" || step?.type === "binary-found" || step?.type === "binary-not-found";
        const inRange = binary && step && "low" in step && index >= step.low && index <= step.high;
        const merging = step?.type === "merge-base" || step?.type === "merge-split" || step?.type === "merge-start" || step?.type === "merge-compare" || step?.type === "merge-place" || step?.type === "merge-complete";
        const inMergeRange = merging && step && "left" in step && index >= step.left && index <= step.right;
        const mergeCompareIndex = step?.type === "merge-compare" && (index === step.leftCursor || index === step.rightCursor);
        const mergeOutputIndex = step?.type === "merge-place" && index === step.outputIndex;
        const mergeCompleteIndex = step?.type === "merge-complete" && index >= step.left && index <= step.right;
        const quick = step?.type === "quick-base" || step?.type === "quick-partition" || step?.type === "quick-pivot" || step?.type === "quick-compare" || step?.type === "quick-swap" || step?.type === "quick-boundary" || step?.type === "quick-pivot-place" || step?.type === "quick-recurse";
        const inQuickRange = quick && step && "low" in step && index >= step.low && index <= step.high;
        const quickPivot = quick && step && "pivotIndex" in step && index === step.pivotIndex;
        const quickSwap = (step?.type === "quick-swap" || step?.type === "quick-pivot-place") && step.swapIndices?.includes(index) === true;
        const quickFinalPivot = step?.type === "quick-pivot-place" && index === step.pivotIndex;
        const quickBase = step?.type === "quick-base" && index === step.low;
        const checked = searching && "checkedIndices" in step && step.checkedIndices.includes(index);
        const found = (step?.type === "search-found") && step.index === index;
        const binaryFound = step?.type === "binary-found" && step.mid === index;
        const sorted = !searching && (step?.sortedIndices.includes(index) ?? false);
        const active = activeIndices.includes(index);

        const height =
          valueRange === 0
            ? MIN_BAR_HEIGHT
            : MIN_BAR_HEIGHT +
              ((value - minValue) / valueRange) *
                (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);

        const isKey = keyValue !== undefined && step?.type === "key" && index === step.index;
        const shifting = step?.type === "shift" && activeIndices.includes(index);
        const tone = found || binaryFound
          ? "border-emerald-400 bg-emerald-400/25 text-foreground"
          : binary && !inRange
            ? "border-line bg-surface/50 text-muted opacity-50"
          : mergeCompleteIndex
            ? "border-emerald-500/70 bg-emerald-500/20 text-foreground"
          : merging && !inMergeRange
            ? "border-line bg-surface/50 text-muted opacity-40"
          : mergeOutputIndex
            ? "border-rose-400 bg-rose-400/25 text-foreground"
          : mergeCompareIndex
            ? "border-amber-400 bg-amber-400/20 text-foreground"
          : merging && inMergeRange
            ? "border-sky-500/70 bg-sky-500/10 text-foreground"
          : quickFinalPivot || quickBase
            ? "border-emerald-400 bg-emerald-400/25 text-foreground"
          : quickSwap
            ? "border-rose-500 bg-rose-500/25 text-foreground"
          : quick && !inQuickRange
            ? "border-line bg-surface/50 text-muted opacity-40"
          : quick && step?.type === "quick-compare" && step.scanIndex === index
            ? "border-amber-400 bg-amber-400/20 text-foreground"
          : quickPivot
            ? "border-violet-400 bg-violet-400/20 text-foreground"
          : quick && inQuickRange
            ? "border-sky-500/70 bg-sky-500/10 text-foreground"
          : searching && checked && !active
            ? "border-line-strong bg-slate-500/20 text-muted"
          : isKey
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
            {binary && step && "low" in step ? <span className="mb-1 flex h-4 justify-center gap-1 font-mono text-[9px] font-semibold uppercase text-accent sm:text-[10px]">{step.low === index ? "L" : ""}{step.mid === index ? "M" : ""}{step.high === index ? "H" : ""}</span> : null}
            {merging && step && "left" in step ? <span className="mb-1 flex h-4 justify-center gap-1 font-mono text-[9px] font-semibold uppercase text-accent sm:text-[10px]">{step.left === index ? "L" : ""}{step.mid === index ? "M" : ""}{step.right === index ? "R" : ""}{step.type === "merge-compare" && step.leftCursor === index ? "i" : ""}{step.type === "merge-compare" && step.rightCursor === index ? "j" : ""}{step.type === "merge-place" && step.outputIndex === index ? "k" : ""}</span> : null}
            {quick && step && "low" in step ? <span className="mb-1 flex h-4 justify-center gap-1 font-mono text-[9px] font-semibold uppercase text-accent sm:text-[10px]">{step.low === index ? "L" : ""}{step.high === index ? "H" : ""}{step.pivotIndex === index ? "P" : ""}{step.type === "quick-compare" && step.scanIndex === index ? "j" : ""}{step.type === "quick-boundary" && step.boundary === index ? "B" : ""}{step.type === "quick-swap" && step.boundary === index ? "B" : ""}</span> : null}
            <span
              className={`mb-2 font-mono text-xs ${
                active || sorted ? "text-foreground" : "text-muted"
              }`}
            >
              {step?.type === "merge-compare" && step.leftCursor === index ? step.leftValue : step?.type === "merge-compare" && step.rightCursor === index ? step.rightValue : value}
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
  const startingArray = algorithm === "binary" ? sortAscending(STARTING_ARRAY) : STARTING_ARRAY;
  const [input, setInput] = useState<readonly number[]>(startingArray);
  const [inputText, setInputText] = useState(startingArray.join(", "));
  const [inputError, setInputError] = useState<string | null>(null);
  const [arrayNotice, setArrayNotice] = useState<string | null>(null);
  const [target, setTarget] = useState(31);
  const [targetText, setTargetText] = useState("31");
  const [targetError, setTargetError] = useState<string | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [language, setLanguage] = useState<CodeLanguage>("C++");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingLanguageFocusIndex = useRef<number | null>(null);
  const selectedLanguageIndex = codeLanguages.indexOf(language);
  const sourceCode = algorithmSourceCode[algorithm][language];

  useEffect(() => {
    if (!languageMenuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!languageMenuRef.current?.contains(event.target as Node) && !languageButtonRef.current?.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [languageMenuOpen]);

  useEffect(() => {
    if (!languageMenuOpen) return;
    const index = pendingLanguageFocusIndex.current ?? selectedLanguageIndex;
    pendingLanguageFocusIndex.current = null;
    languageOptionRefs.current[index]?.focus();
  }, [languageMenuOpen, selectedLanguageIndex]);

  async function copySourceCode() {
    try {
      await navigator.clipboard.writeText(sourceCode);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
    window.setTimeout(() => setCopyStatus("idle"), 2000);
  }

  const steps = useMemo(
    () =>
      algorithm === "binary"
        ? executeBinarySearch(input, target)
        : algorithm === "linear"
        ? executeLinearSearch(input, target)
        : algorithm === "quick"
          ? executeQuickSort(input)
        : algorithm === "merge"
          ? executeMergeSort(input)
        : algorithm === "bubble"
        ? executeBubbleSort(input)
        : algorithm === "selection"
          ? executeSelectionSort(input)
          : executeInsertionSort(input),
    [algorithm, input, target],
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

  function reset(nextInput: readonly number[] = input, announceSorted = false) {
    const normalizedInput = algorithm === "binary" ? sortAscending(nextInput) : [...nextInput];
    setPlaying(false);
    setInput(normalizedInput);
    setInputText(normalizedInput.join(", "));
    setInputError(null);
    setArrayNotice(announceSorted && algorithm === "binary" ? "The custom array was sorted in ascending order before searching." : null);
    setStepCount(0);
  }

  function applyInput() {
    try {
      reset(parseArrayInput(inputText, algorithm === "merge" || algorithm === "quick"), true);
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
      <ol aria-label={`${algorithm === "linear" || algorithm === "binary" ? `${algorithm === "linear" ? "Linear" : "Binary"} search` : `${algorithm} sort`} pseudocode`} className="max-w-full overflow-x-auto p-3 font-mono text-sm leading-6 sm:p-4">
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
      aria-label={`${algorithm === "linear" || algorithm === "binary" ? `${algorithm === "linear" ? "Linear" : "Binary"} search` : `${algorithm === "bubble" ? "Bubble" : algorithm === "selection" ? "Selection" : algorithm === "insertion" ? "Insertion" : algorithm === "merge" ? "Merge" : "Quick"} sort`} visualizer`}
      className="border border-line bg-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Array visualization
          </h2>
          <p className="mt-1 text-xs text-muted">
            {algorithm === "binary"
              ? "Search the sorted array by narrowing the active range."
              : algorithm === "linear"
              ? "Inspect one value at a time from left to right."
              : algorithm === "bubble"
              ? "Compare neighbors, then follow each pass."
              : algorithm === "merge"
                ? "Follow recursive splits and merge sorted halves one value at a time."
                : algorithm === "quick"
                  ? "Follow the pivot, partition boundary, comparisons, and recursive ranges."
              : algorithm === "selection"
                ? "Find the minimum remaining value on each pass."
                : "Hold each key, shift larger values, then insert it into the sorted prefix."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label="Shuffle current values and restart visualization"
            title={algorithm === "binary" ? "Rearrange the current values, then sort them" : "Rearrange the current values without changing them"}
            className="min-h-10 border border-line-strong px-3 text-sm text-foreground outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => reset(shuffleArray(input))}
            type="button"
          >
            {algorithm === "binary" ? "Rearrange and sort" : "Shuffle array"}
          </button>
          <button
            aria-label="Generate a new random array and restart visualization"
            title="Generate a new array with random integers"
            className="min-h-10 border border-accent bg-accent px-3 text-sm font-medium text-accent-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
            onClick={() => reset(algorithm === "binary" ? sortAscending(createRandomArray()) : createRandomArray())}
            type="button"
          >
            Randomize
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
            {algorithm === "binary" ? "Customize the array (sorted before searching)" : "Customize your array"}
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
            Enter {MIN_ARRAY_SIZE}–{MAX_ARRAY_SIZE} integers separated by commas. Negative
            numbers and duplicates are allowed.
          </p>

          {inputError && (
            <p className="mt-2 text-sm text-rose-500" role="alert">
              {inputError}
            </p>
          )}
        </form>

        {arrayNotice ? <p aria-live="polite" className="-mt-4 mb-5 text-sm text-accent" role="status">{arrayNotice}</p> : null}

        {algorithm === "linear" || algorithm === "binary" ? (
          <form className="mb-6" onSubmit={(event) => { event.preventDefault(); const trimmed = targetText.trim(); if (!/^-?\d+$/.test(trimmed) || Number(trimmed) < -100 || Number(trimmed) > 100) { setTargetError("Enter a whole-number target from -100 to 100."); return; } setTargetError(null); setTarget(Number(trimmed)); setStepCount(0); setPlaying(false); }}>
            <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={`${algorithm}-target-input`}>Search target</label>
            <div className="flex flex-col gap-2 sm:flex-row"><input className="min-h-10 border border-line-strong bg-surface px-3 py-2 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-40" id={`${algorithm}-target-input`} inputMode="numeric" max="100" min="-100" onChange={(event) => { setTargetText(event.target.value); setTargetError(null); }} value={targetText} aria-invalid={targetError !== null} aria-describedby={`${algorithm}-target-help`} /><button className="min-h-10 border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground" type="submit">Apply target</button></div>
            <p className="mt-2 text-xs text-muted" id={`${algorithm}-target-help`}>Enter an integer from -100 to 100.{algorithm === "linear" ? " The search returns the first match." : ""}</p>
            {targetError ? <p className="mt-2 text-sm text-rose-500" role="alert">{targetError}</p> : null}
          </form>
        ) : null}

        <div
          className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted"
          aria-label="Visualization legend"
        >
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 bg-amber-500" /> Comparing
          </span>
          {algorithm === "linear" ? (
            <><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-slate-500" /> Checked</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-emerald-400" /> Match</span></>
          ) : algorithm === "binary" ? (
            <><span className="flex items-center gap-2"><i className="font-mono text-[10px] font-semibold text-accent">L</i> Low</span><span className="flex items-center gap-2"><i className="font-mono text-[10px] font-semibold text-accent">M</i> Mid</span><span className="flex items-center gap-2"><i className="font-mono text-[10px] font-semibold text-accent">H</i> High</span></>
          ) : algorithm === "merge" ? (
            <><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-sky-500" /> Active range</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-amber-400" /> Compare halves</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-rose-400" /> Place value</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-emerald-500" /> Merged</span></>
          ) : algorithm === "quick" ? (
            <><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-sky-500" /> Active range</span><span className="flex items-center gap-2"><i className="font-mono text-[10px] font-semibold text-accent">B</i> Boundary</span><span className="flex items-center gap-2"><i className="font-mono text-[10px] font-semibold text-accent">j</i> Scan</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-violet-400" /> Pivot</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-amber-400" /> Comparing</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-rose-500" /> Swap</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-emerald-400" /> Pivot fixed</span></>
          ) : (
            <>
              {algorithm === "insertion" ? <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-sky-400" /> Active key</span> : null}
              <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-rose-500" /> {algorithm === "insertion" ? "Shifting" : "Swapping"}</span>
              <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-emerald-500" /> Sorted</span>
            </>
          )}
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
    <section aria-labelledby="algorithm-code-heading" className="min-w-0 border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-foreground" id="algorithm-code-heading">Implementation</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              aria-controls="algorithm-language-menu"
              aria-expanded={languageMenuOpen}
              aria-haspopup="listbox"
              className="inline-flex min-h-9 items-center gap-2 border border-line-strong bg-surface px-3 text-sm font-medium text-foreground outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setLanguageMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const offset = event.key === "ArrowDown" ? 1 : -1;
                  pendingLanguageFocusIndex.current = (selectedLanguageIndex + offset + codeLanguages.length) % codeLanguages.length;
                  setLanguageMenuOpen(true);
                }
              }}
              ref={languageButtonRef}
              type="button"
            >
              {language}<svg aria-hidden="true" className={`size-3.5 transition-transform ${languageMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 16 16"><path d="m3 6 5 5 5-5" /></svg>
            </button>
            {languageMenuOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-36 border border-line-strong bg-panel p-1 shadow-xl" id="algorithm-language-menu" ref={languageMenuRef}>
                <div aria-label="Choose programming language" className="max-h-60 overflow-y-auto" role="listbox">
                  {codeLanguages.map((option, index) => (
                    <button
                      aria-selected={option === language}
                      className={`flex min-h-9 w-full items-center justify-between gap-4 px-3 text-left text-sm outline-none hover:bg-hover focus-visible:bg-hover ${option === language ? "text-accent" : "text-foreground"}`}
                      key={option}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setLanguage(option);
                        setLanguageMenuOpen(false);
                        languageButtonRef.current?.focus();
                      }}
                      onClick={() => {
                        setLanguage(option);
                        setLanguageMenuOpen(false);
                        languageButtonRef.current?.focus();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setLanguageMenuOpen(false);
                          languageButtonRef.current?.focus();
                        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                          event.preventDefault();
                          const direction = event.key === "ArrowDown" ? 1 : -1;
                          languageOptionRefs.current[(index + direction + codeLanguages.length) % codeLanguages.length]?.focus();
                        } else if (event.key === "Home" || event.key === "End") {
                          event.preventDefault();
                          languageOptionRefs.current[event.key === "Home" ? 0 : codeLanguages.length - 1]?.focus();
                        }
                      }}
                      ref={(element) => { languageOptionRefs.current[index] = element; }}
                      role="option"
                      type="button"
                    >
                      {option}{option === language ? <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" /></svg> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <button aria-label="Copy implementation code" className="inline-flex min-h-9 items-center gap-2 border border-line-strong px-3 text-sm text-foreground outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent" onClick={copySourceCode} type="button">
            {copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : <><svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 16 16"><rect height="10" rx="1" width="8" x="5" y="4" /><path d="M3 11V3h7" /></svg>Copy code</>}
          </button>
        </div>
      </div>
      <pre className="max-h-[32rem] min-h-64 overflow-auto p-4 font-mono text-xs leading-6 text-foreground sm:p-5 sm:text-sm"><code>{sourceCode}</code></pre>
      <p aria-live="polite" className="sr-only">{copyStatus === "copied" ? "Code copied to clipboard." : copyStatus === "error" ? "Could not copy code to clipboard." : ""}</p>
    </section>
    </div>
  );
}
