
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { executeBubbleSort } from "@/lib/algorithms/bubble-sort";
import { executeSelectionSort } from "@/lib/algorithms/selection-sort";
import { executeInsertionSort } from "@/lib/algorithms/insertion-sort";
import { executeLinearSearch } from "@/lib/algorithms/linear-search";
import { executeBinarySearch } from "@/lib/algorithms/binary-search";
import { executeMergeSort } from "@/lib/algorithms/merge-sort";
import { executeQuickSort, quickSortPartitionKey } from "@/lib/algorithms/quick-sort";
import type { QuickSortCustomPivots, QuickSortPivotStrategy } from "@/lib/algorithms/quick-sort";
import { executeHeapSort } from "@/lib/algorithms/heap-sort";
import { executeCountingSort } from "@/lib/algorithms/counting-sort";
import { executeRadixSort } from "@/lib/algorithms/radix-sort";
import type { AlgorithmExecutionStep } from "@/lib/algorithms/execution";
import type { QuickSortStep } from "@/lib/algorithms/execution";
import type { HeapSortStep } from "@/lib/algorithms/execution";
import type { CountingSortStep } from "@/lib/algorithms/execution";
import type { RadixSortStep } from "@/lib/algorithms/execution";
import type { PseudocodeLine } from "@/lib/algorithms/execution";
import { algorithmSourceCode, quickSortSourceCode, codeLanguages, type CodeLanguage } from "@/lib/algorithms/source-code";

const STARTING_ARRAY = [42, 17, 68, 9, 31, 54, 23];
const STEP_INTERVAL_MS = 650;
const MIN_ARRAY_SIZE = 5;
const MAX_ARRAY_SIZE = 10;
const PIVOT_STRATEGY_LABELS: Record<QuickSortPivotStrategy, string> = {
  last: "Last element",
  middle: "Middle element",
  first: "First element",
  random: "Random element",
  custom: "Custom element",
};

export type SortingAlgorithm = "bubble" | "selection" | "insertion" | "merge" | "quick" | "heap" | "counting" | "radix" | "linear" | "binary";

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
    if (algorithm === "heap") return "Ready to build a max heap from the array.";
    if (algorithm === "counting") return "Ready to count each value, then build the sorted output.";
    if (algorithm === "radix") return "Ready to split signed integers and sort each group by decimal digits.";
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
  if (step.type === "quick-pivot-select") return `Selected ${step.pivotValue} at index ${step.selectedPivotIndex} from the active range using the ${PIVOT_STRATEGY_LABELS[step.pivotStrategy].toLowerCase()} strategy.`;
  if (step.type === "quick-pivot-move") return `Move the selected pivot from index ${step.selectedPivotIndex} to the end of this active range at index ${step.high} for Lomuto partitioning.`;
  if (step.type === "quick-pivot") return `The selected pivot ${step.pivotValue} is ready at index ${step.pivotIndex}; boundary starts at ${step.boundary}.`;
  if (step.type === "quick-compare") return step.array[step.scanIndex] <= step.pivotValue
    ? `${step.array[step.scanIndex]} at index ${step.scanIndex} is less than or equal to pivot ${step.pivotValue}; it belongs in the left partition.`
    : `${step.array[step.scanIndex]} at index ${step.scanIndex} is greater than pivot ${step.pivotValue}; it stays in the right partition.`;
  if (step.type === "quick-swap") return `Value ${step.comparedValue} qualifies for the left partition; swap indices ${step.swapIndices?.[0]} and ${step.swapIndices?.[1]}.`;
  if (step.type === "quick-boundary") return `Advance the partition boundary to index ${step.boundary}.`;
  if (step.type === "quick-pivot-place") return `Pivot ${step.pivotValue} is now in its final position at index ${step.pivotIndex}.`;
  if (step.type === "heap-build-start") return `Build the max heap by sifting down parent index ${step.parentIndex}.`;
  if (step.type === "heapify-start") return `Sift down parent index ${step.parentIndex} within the active heap of ${step.activeHeapSize} values.`;
  if (step.type === "heapify-compare") return `Compare heap values ${step.array[step.indices![0]]} at index ${step.indices![0]} and ${step.array[step.indices![1]]} at index ${step.indices![1]}.`;
  if (step.type === "heapify-swap") return `Swap parent index ${step.parentIndex} with larger child index ${step.swapIndices![1]}, then continue sifting down.`;
  if (step.type === "heapify-done") return `Parent index ${step.parentIndex} is at least as large as its children; this sift is complete.`;
  if (step.type === "heap-built") return "The max heap is built. The root is the largest remaining value.";
  if (step.type === "heap-extract") return `Move the maximum at the root to index ${step.extractedIndex}, the end of the active heap.`;
  if (step.type === "heap-extract-swap") return `Placed ${step.array[step.extractedIndex!]} in the sorted suffix. The active heap now has ${step.activeHeapSize} values.`;
  if (step.type === "heap-sorted") return "Heap Sort is complete; the entire array is in ascending order.";
  if (step.type === "counting-range") return `The value range is ${step.minimum} to ${step.maximum}; offset each value by ${step.minimum}.`;
  if (step.type === "counting-initialize") return `Initialize ${step.counts.length} frequency buckets to zero.`;
  if (step.type === "counting-count") return `Count input value ${step.array[step.inputIndex!]} at index ${step.inputIndex}; its bucket is ${step.bucketIndex} (value ${step.minimum + step.bucketIndex!}).`;
  if (step.type === "counting-counted") return "Frequency counting is complete; each bucket records how often its value appears.";
  if (step.type === "counting-output-start") return "Write values in ascending bucket order, repeating each by its frequency.";
  if (step.type === "counting-output-place") return `Write ${step.outputValue} into output index ${step.outputIndex} using bucket ${step.bucketIndex}.`;
  if (step.type === "radix-split") return "Separate negative magnitudes from non-negative values before digit passes.";
  if (step.type === "radix-pass") return `Start the ${step.digitPlace === 1 ? "ones" : step.digitPlace === 10 ? "tens" : "hundreds"} place pass for ${step.sign} magnitudes.`;
  if (step.type === "radix-distribute") return `Value ${step.activeMagnitude! * (step.sign === "negative" ? -1 : 1)} has active digit ${step.activeDigit}; append its magnitude to bucket ${step.bucketIndex}.`;
  if (step.type === "radix-collect") return `Collect ${step.output[step.collectionIndex!]} from bucket ${step.bucketIndex} into the pass output.`;
  if (step.type === "radix-combine") return "Reverse the sorted negative magnitudes, then append sorted non-negative values.";

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
                : step?.type === "quick-swap" ? step.swapIndices ?? []
                  : step?.type === "heapify-compare" || step?.type === "heap-extract" ? step.indices ?? []
                    : step?.type === "heapify-swap" || step?.type === "heap-extract-swap" ? step.swapIndices ?? []
                      : step?.type === "counting-count" ? [step.inputIndex!] : [];
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
        const quick = step?.type === "quick-base" || step?.type === "quick-partition" || step?.type === "quick-pivot-select" || step?.type === "quick-pivot-move" || step?.type === "quick-pivot" || step?.type === "quick-compare" || step?.type === "quick-swap" || step?.type === "quick-boundary" || step?.type === "quick-pivot-place" || step?.type === "quick-recurse";
        const inQuickRange = quick && step && "low" in step && index >= step.low && index <= step.high;
        const quickPivot = quick && step && "pivotIndex" in step && index === step.pivotIndex;
        const quickSwap = (step?.type === "quick-swap" || step?.type === "quick-pivot-move" || step?.type === "quick-pivot-place") && step.swapIndices?.includes(index) === true;
        const quickFinalPivot = step?.type === "quick-pivot-place" && index === step.pivotIndex;
        const quickBase = step?.type === "quick-base" && index === step.low;
        const heapStep = step && "activeHeapSize" in step ? step : undefined;
        const heapCompared = heapStep?.type === "heapify-compare" && heapStep.indices?.includes(index) === true;
        const heapSwapped = (heapStep?.type === "heapify-swap" || heapStep?.type === "heap-extract-swap") && heapStep.swapIndices?.includes(index) === true;
        const heapParent = heapStep && heapStep.parentIndex === index;
        const heapChild = heapStep && (heapStep.leftChildIndex === index || heapStep.rightChildIndex === index);
        const heapSorted = heapStep && heapStep.sortedIndices.includes(index);
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
          : heapSorted
            ? "border-emerald-500/70 bg-emerald-500/20 text-foreground"
          : heapSwapped
            ? "border-rose-500 bg-rose-500/25 text-foreground"
          : heapCompared
            ? "border-amber-400 bg-amber-400/25 text-foreground"
          : heapParent
            ? "border-violet-400 bg-violet-400/20 text-foreground"
          : heapChild
            ? "border-sky-500/70 bg-sky-500/15 text-foreground"
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
            {quick && step && "low" in step ? <span className="mb-1 flex h-4 justify-center gap-1 font-mono text-[9px] font-semibold uppercase text-accent sm:text-[10px]">{step.low === index ? "L" : ""}{step.high === index ? "H" : ""}{step.pivotIndex === index ? "P" : ""}{step.type === "quick-pivot-move" && step.selectedPivotIndex === index ? "from" : ""}{step.type === "quick-compare" && step.scanIndex === index ? "j" : ""}{step.type === "quick-boundary" && step.boundary === index ? "B" : ""}{step.type === "quick-swap" && step.boundary === index ? "B" : ""}</span> : null}
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

function HeapTree({ values, step }: { values: readonly number[]; step: AlgorithmExecutionStep | undefined }) {
  const heapStep: HeapSortStep | undefined = step && "activeHeapSize" in step ? step : undefined;
  const activeHeapSize = step?.type === "complete" ? 0 : heapStep?.activeHeapSize ?? values.length;
  const width = 640;
  const depth = Math.floor(Math.log2(Math.max(values.length, 1))) + 1;
  const height = 48 + depth * 66;
  const position = (index: number) => {
    const level = Math.floor(Math.log2(index + 1));
    const firstIndex = 2 ** level - 1;
    const slot = index - firstIndex;
    return { x: (width * (slot + 0.5)) / (2 ** level), y: 30 + level * 66 };
  };
  const nodeTone = (index: number) => {
    if (index >= activeHeapSize) return "fill-emerald-500/20 stroke-emerald-500/80";
    if (heapStep?.swapIndices?.includes(index)) return "fill-rose-500/25 stroke-rose-500";
    if (heapStep?.indices?.includes(index)) return "fill-amber-400/25 stroke-amber-400";
    if (heapStep?.parentIndex === index) return "fill-violet-400/20 stroke-violet-400";
    if (heapStep && (heapStep.leftChildIndex === index || heapStep.rightChildIndex === index)) return "fill-sky-500/15 stroke-sky-500/80";
    return "fill-hover stroke-line-strong";
  };

  return (
    <div className="mt-6 border border-line bg-surface/40 p-3 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-foreground">Binary heap</h3>
        <p className="text-xs text-muted">Node index matches the array index · active heap: {activeHeapSize}</p>
      </div>
      <div className="overflow-x-auto">
        <svg aria-label={`Heap tree: ${values.map((value, index) => `index ${index}, value ${value}`).join("; ")}`} className="mx-auto h-auto w-full min-w-[480px] max-w-3xl" role="img" viewBox={`0 0 ${width} ${height}`}>
          {values.map((_, index) => {
            if (index === 0) return null;
            const parent = Math.floor((index - 1) / 2);
            const from = position(parent);
            const to = position(index);
            return <line key={`edge-${index}`} x1={from.x} y1={from.y + 19} x2={to.x} y2={to.y - 19} className={index >= activeHeapSize ? "stroke-emerald-500/50" : "stroke-line-strong"} strokeWidth="1.5" />;
          })}
          {values.map((value, index) => {
            const { x, y } = position(index);
            return <g key={`node-${index}`}>
              <circle cx={x} cy={y} r="19" className={nodeTone(index)} strokeWidth="1.5" />
              <text x={x} y={y + 4} textAnchor="middle" className="fill-foreground font-mono text-xs">{value}</text>
              <text x={x} y={y + 31} textAnchor="middle" className="fill-muted font-mono text-[10px]">{index}</text>
            </g>;
          })}
        </svg>
      </div>
    </div>
  );
}

function RadixSortPanel({ input, step }: { input: readonly number[]; step?: RadixSortStep }) {
  const buckets = step?.buckets ?? Array.from({ length: 10 }, () => [] as number[]);
  const activeValue = step?.activeMagnitude === undefined ? undefined : step.sign === "negative" ? -step.activeMagnitude : step.activeMagnitude;
  const placeName = step?.digitPlace === 1 ? "Ones" : step?.digitPlace === 10 ? "Tens" : step?.digitPlace === 100 ? "Hundreds" : `${step?.digitPlace ?? 1}s`;
  return (
    <section aria-label="Radix sort digit buckets" className="mt-5 border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Original input: <span className="font-mono text-foreground">{(step?.originalInput ?? input).join(", ")}</span></span>
        {step ? <span className="font-medium text-accent">{placeName} place · {step.sign} magnitudes · {step.phase}</span> : <span>10 stable digit buckets</span>}
      </div>
      {step?.activeDigit !== undefined ? <p className="mb-3 text-xs text-muted">Active value <b className="font-mono text-amber-300">{activeValue}</b> · digit <b className="font-mono text-amber-300">{step.activeDigit}</b> · bucket <b className="font-mono text-accent">{step.bucketIndex}</b></p> : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {buckets.map((bucket, index) => <div className={`min-h-16 border p-2 ${step?.bucketIndex === index ? step.phase === "collect" ? "border-emerald-400 bg-emerald-400/10" : "border-accent bg-accent/10" : "border-line"}`} key={index}>
          <div className="mb-1 font-mono text-[10px] text-muted">Bucket {index}</div>
          <div className="flex min-h-6 flex-wrap gap-1">{bucket.map((value, itemIndex) => <span className={`border px-1.5 py-0.5 font-mono text-xs ${step?.phase === "collect" && step.bucketIndex === index ? "border-emerald-400/60 text-emerald-200" : "border-line-strong text-foreground"}`} key={`${itemIndex}-${value}`}>{value}</span>)}</div>
        </div>)}
      </div>
      {step?.phase === "collect" ? <p className="mt-3 text-xs text-muted">Pass output: <span className="font-mono text-foreground">{step.output.join(", ")}</span></p> : null}
      {step?.type === "radix-combine" ? <p className="mt-3 text-xs text-emerald-300">Sorted output: <span className="font-mono">{step.array.join(", ")}</span></p> : null}
    </section>
  );
}

function CountingSortPanel({ values, step }: { values: readonly number[]; step: CountingSortStep | undefined }) {
  const minimum = step?.minimum ?? Math.min(...values);
  const distinctValues = [...new Set(values)].sort((left, right) => left - right);
  const frequencies = distinctValues.map((value) => step?.frequencies[value - minimum] ?? 0);
  const maxVisibleFrequency = Math.max(1, ...frequencies);
  const output = step?.output ?? Array(values.length).fill(null) as (number | null)[];
  const currentBucket = step?.bucketIndex;
  return (
    <div className="mt-6 grid gap-5 border border-line bg-surface/40 p-3 sm:p-4">
      <section aria-labelledby="counting-frequency-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold text-foreground" id="counting-frequency-heading">Distinct input values</h3>
          <p className="text-xs text-muted">{step?.phase === "output" ? "Input frequencies are complete; output values are built below." : "Frequency counts update as each input value is scanned."}</p>
        </div>
        <ul aria-label="Value frequencies" className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="list">
            {distinctValues.map((value, index) => {
              const bucketIndex = value - minimum;
              const frequency = frequencies[index];
              const current = currentBucket === bucketIndex;
              const barWidth = (frequency / maxVisibleFrequency) * 100;
              return <li aria-label={`Value ${value}, frequency ${frequency}${current ? ", active value" : ""}`} className={`min-w-0 border p-3 ${current ? "border-accent/80 bg-accent/10" : "border-line bg-panel/70"}`} key={value}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{value}</span>
                  <span className={`font-mono text-xs tabular-nums ${current ? "text-accent" : "text-muted"}`}>Count: {frequency}</span>
                </div>
                <div aria-label={`${frequency} occurrences of ${value}`} aria-valuemax={maxVisibleFrequency} aria-valuemin={0} aria-valuenow={frequency} className="h-1.5 overflow-hidden bg-hover" role="meter">
                  <div className={`h-full transition-[width] duration-300 ${current ? "bg-accent" : "bg-sky-500/80"}`} style={{ width: `${barWidth}%` }} />
                </div>
              </li>;
            })}
        </ul>
      </section>
      <section aria-labelledby="counting-output-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold text-foreground" id="counting-output-heading">Sorted output</h3>
          <p className="text-xs text-muted">Each emitted value fills the next output position.</p>
        </div>
        <ol aria-label="Sorted output positions" className="flex flex-wrap gap-2">
          {output.map((value, index) => {
            const current = step?.type === "counting-output-place" && step.outputIndex === index;
            return <li aria-label={`Output index ${index}: ${value ?? "empty"}${current ? ", just written" : ""}`} className={`flex h-12 min-w-12 flex-col items-center justify-center border px-2 font-mono text-xs ${current ? "border-rose-400 bg-rose-400/15 text-foreground" : value === null ? "border-dashed border-line-strong text-muted" : "border-emerald-500/60 bg-emerald-500/10 text-foreground"}`} key={index}><span>{value ?? "—"}</span><span className="mt-0.5 text-[9px] text-muted">{index}</span></li>;
          })}
        </ol>
      </section>
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
  const [pivotStrategy, setPivotStrategy] = useState<QuickSortPivotStrategy>("last");
  const [customPivots, setCustomPivots] = useState<QuickSortCustomPivots>({});
  const [quickSteps, setQuickSteps] = useState<AlgorithmExecutionStep[]>(() => algorithm === "quick" ? executeQuickSort(startingArray, "last") : []);
  const [language, setLanguage] = useState<CodeLanguage>("C++");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingLanguageFocusIndex = useRef<number | null>(null);
  const selectedLanguageIndex = codeLanguages.indexOf(language);
  const sourceCode = algorithm === "quick"
    ? quickSortSourceCode[pivotStrategy][language]
    : algorithmSourceCode[algorithm][language];

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
          ? quickSteps
        : algorithm === "heap"
          ? executeHeapSort(input)
        : algorithm === "counting"
          ? executeCountingSort(input)
        : algorithm === "radix"
          ? executeRadixSort(input)
        : algorithm === "merge"
          ? executeMergeSort(input)
        : algorithm === "bubble"
        ? executeBubbleSort(input)
        : algorithm === "selection"
          ? executeSelectionSort(input)
          : executeInsertionSort(input),
    [algorithm, input, target, quickSteps],
  );

  const displayedPseudocode = algorithm === "quick"
    ? pseudocode.map((line) => line.id === "quick.pivot-select"
      ? { ...line, text: pivotStrategy === "custom"
        ? "    pivotIndex = use this range's manual choice, or low if none is set"
        : `    pivotIndex = choose the ${PIVOT_STRATEGY_LABELS[pivotStrategy].toLowerCase()} from A[low .. high]` }
      : line)
    : pseudocode;

  const currentStep = stepCount > 0 ? steps[stepCount - 1] : undefined;
  const currentQuickStep = currentStep && "pivotStrategy" in currentStep ? currentStep : undefined;
  const upcomingQuickPivot = steps.slice(stepCount).find((step) => step.type === "quick-pivot-select") as QuickSortStep | undefined;
  const customPartition = algorithm === "quick" && pivotStrategy === "custom"
    ? currentQuickStep?.type === "quick-recurse" && currentQuickStep.low < currentQuickStep.high
      ? { low: currentQuickStep.low, high: currentQuickStep.high, array: currentQuickStep.array }
      : currentQuickStep && currentQuickStep.type !== "quick-pivot-place" && currentQuickStep.low < currentQuickStep.high
        ? { low: currentQuickStep.low, high: currentQuickStep.high, array: currentQuickStep.array }
        : upcomingQuickPivot
          ? { low: upcomingQuickPivot.low, high: upcomingQuickPivot.high, array: upcomingQuickPivot.array }
          : undefined
    : undefined;
  const customPartitionKey = customPartition ? quickSortPartitionKey(customPartition.low, customPartition.high) : undefined;
  const customSelectedIndex = customPartition && customPartitionKey
    ? customPivots[customPartitionKey]
      ?? (currentQuickStep?.low === customPartition.low && currentQuickStep.high === customPartition.high ? currentQuickStep.selectedPivotIndex : undefined)
      ?? customPartition.low
    : undefined;
  const complete = stepCount >= steps.length;
  const countingSnapshot = currentStep && "counts" in currentStep
    ? currentStep
    : complete && steps.length > 1 && "counts" in steps[steps.length - 2]
      ? steps[steps.length - 2] as CountingSortStep
      : undefined;
  const radixSnapshot = currentStep && "buckets" in currentStep ? currentStep as RadixSortStep : undefined;
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
    if (algorithm === "quick") {
      setCustomPivots({});
      setQuickSteps(executeQuickSort(normalizedInput, pivotStrategy));
    }
    setPlaying(false);
    setInput(normalizedInput);
    setInputText(normalizedInput.join(", "));
    setInputError(null);
    setArrayNotice(announceSorted && algorithm === "binary" ? "The custom array was sorted in ascending order before searching." : null);
    setStepCount(0);
  }

  function applyInput() {
    try {
      reset(parseArrayInput(inputText, algorithm === "merge" || algorithm === "quick" || algorithm === "heap" || algorithm === "counting" || algorithm === "radix"), true);
    } catch (error) {
      setInputError(
        error instanceof Error ? error.message : "Invalid array input.",
      );
    }
  }

  function changePivotStrategy(nextStrategy: QuickSortPivotStrategy) {
    setPlaying(false);
    setPivotStrategy(nextStrategy);
    setCustomPivots({});
    setQuickSteps(executeQuickSort(input, nextStrategy));
    setStepCount(0);
  }

  function changeCustomPivot(partitionKey: string, pivotIndex: number) {
    const targetStepIndex = quickSteps.findIndex((step) => step.type === "quick-pivot-select" && quickSortPartitionKey(step.low, step.high) === partitionKey);
    const visitedPartitions = new Set(quickSteps.slice(0, Math.max(0, targetStepIndex)).flatMap((step) =>
      step.type === "quick-pivot-select" ? [quickSortPartitionKey(step.low, step.high)] : [],
    ));
    const nextPivots = Object.fromEntries(Object.entries(customPivots).filter(([key]) => visitedPartitions.has(key)));
    nextPivots[partitionKey] = pivotIndex;
    setCustomPivots(nextPivots);
    setPlaying(false);
    setQuickSteps(executeQuickSort(input, "custom", nextPivots));
    setStepCount(0);
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
    <section aria-labelledby="algorithm-pseudocode-heading" className="min-w-0 overflow-hidden border border-line bg-panel">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground" id="algorithm-pseudocode-heading">Pseudocode</h2>
        <p className="mt-1 text-xs text-muted">Language-independent outline. The highlighted line matches the current step.</p>
      </div>
      <ol aria-label={`${algorithm === "linear" || algorithm === "binary" ? `${algorithm === "linear" ? "Linear" : "Binary"} search` : `${algorithm} sort`} pseudocode`} className="max-w-full overflow-x-auto p-3 font-mono text-sm leading-6 sm:p-4">
        {displayedPseudocode.map((line, index) => {
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
      aria-label={`${algorithm === "linear" || algorithm === "binary" ? `${algorithm === "linear" ? "Linear" : "Binary"} search` : `${algorithm === "bubble" ? "Bubble" : algorithm === "selection" ? "Selection" : algorithm === "insertion" ? "Insertion" : algorithm === "merge" ? "Merge" : algorithm === "heap" ? "Heap" : algorithm === "counting" ? "Counting" : "Quick"} sort`} visualizer`}
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
                : algorithm === "heap"
                  ? "Build a max heap, extract its root, and restore the active heap."
                : algorithm === "counting"
                  ? "Count each value in the input, then emit values from the frequency table in order."
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
        {algorithm === "quick" ? (
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="quick-pivot-strategy">Pivot Strategy</label>
            <select
              className="min-h-10 border border-line-strong bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
              id="quick-pivot-strategy"
              onChange={(event) => changePivotStrategy(event.target.value as QuickSortPivotStrategy)}
              value={pivotStrategy}
            >
              <option value="last">Last element</option>
              <option value="middle">Middle element</option>
              <option value="first">First element</option>
              <option value="random">Random element</option>
              <option value="custom">Custom element</option>
            </select>
            <span className="text-xs text-muted">Applied separately to each active partition.</span>
            {pivotStrategy === "custom" && customPartition && customPartitionKey ? (
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 basis-full pt-1">
                <label className="text-sm font-medium text-foreground" htmlFor="quick-custom-pivot">
                  Pivot for indices {customPartition.low}–{customPartition.high}
                </label>
                <select
                  className="min-h-10 max-w-full border border-line-strong bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  id="quick-custom-pivot"
                  onChange={(event) => changeCustomPivot(customPartitionKey, Number(event.target.value))}
                  value={customSelectedIndex}
                >
                  {Array.from({ length: customPartition.high - customPartition.low + 1 }, (_, offset) => customPartition.low + offset).map((index) => (
                    <option key={index} value={index}>{customPartition.array[index]} (index {index})</option>
                  ))}
                </select>
                <span className="text-xs text-muted">Each range has its own choice; ranges without a choice use the first element. Changing a choice rebuilds playback from the start.</span>
              </div>
            ) : pivotStrategy === "custom" ? (
              <span className="basis-full text-xs text-muted">No unprocessed partition remains.</span>
            ) : null}
          </div>
        ) : null}

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
            <i className="h-2.5 w-2.5 bg-amber-500" /> {algorithm === "counting" ? "Scanning input" : "Comparing"}
          </span>
          {algorithm === "linear" ? (
            <><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-slate-500" /> Checked</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-emerald-400" /> Match</span></>
          ) : algorithm === "binary" ? (
            <><span className="flex items-center gap-2"><i className="font-mono text-[10px] font-semibold text-accent">L</i> Low</span><span className="flex items-center gap-2"><i className="font-mono text-[10px] font-semibold text-accent">M</i> Mid</span><span className="flex items-center gap-2"><i className="font-mono text-[10px] font-semibold text-accent">H</i> High</span></>
          ) : algorithm === "merge" ? (
            <><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-sky-500" /> Active range</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-amber-400" /> Compare halves</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-rose-400" /> Place value</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-emerald-500" /> Merged</span></>
          ) : algorithm === "counting" ? (
            <><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-amber-400" /> Current input value</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 border border-accent bg-accent/15" /> Active frequency bucket</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-emerald-500/30" /> Written output</span></>
          ) : algorithm === "heap" ? (
            <><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-violet-400" /> Parent</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-sky-500" /> Children</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-amber-400" /> Comparing</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-rose-500" /> Swapping</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-emerald-500" /> Sorted suffix</span></>
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
        <ArrayBars
          values={algorithm === "counting" ? input : values}
          step={algorithm === "counting" && currentStep && !("counts" in currentStep) ? undefined : currentStep}
        />
        {algorithm === "heap" ? <HeapTree values={values} step={currentStep} /> : null}
        {algorithm === "counting" ? <CountingSortPanel values={input} step={countingSnapshot} /> : null}
        {algorithm === "radix" ? <RadixSortPanel step={radixSnapshot} input={input} /> : null}

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
