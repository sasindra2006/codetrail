import type { AlgorithmExecutionStep, QuickSortStep } from "./execution";

export type QuickSortPivotStrategy = "last" | "middle" | "first" | "random" | "custom";

export type QuickSortCustomPivots = Readonly<Record<string, number>>;

export function quickSortPartitionKey(low: number, high: number) {
  return `${low}-${high}`;
}

/** Produces a recursive Lomuto Quick Sort trace without mutating the input. */
export function executeQuickSort(input: readonly number[], pivotStrategy: QuickSortPivotStrategy = "last", customPivots: QuickSortCustomPivots = {}): AlgorithmExecutionStep[] {
  const array = [...input];
  const steps: AlgorithmExecutionStep[] = [];

  function record(step: Omit<QuickSortStep, "array" | "sortedIndices" | "pivotStrategy">) {
    steps.push({ ...step, pivotStrategy, array: [...array], sortedIndices: [] });
  }

  function sort(low: number, high: number): void {
    if (low >= high) {
      if (low === high) {
        record({ type: "quick-base", lineId: "quick.base", low, high, pivotIndex: high, pivotValue: array[high], scanIndex: -1, boundary: low });
      }
      return;
    }

    const customIndex = customPivots[quickSortPartitionKey(low, high)];
    const selectedPivotIndex = pivotStrategy === "custom" && Number.isInteger(customIndex) && customIndex >= low && customIndex <= high
      ? customIndex
      : pivotStrategy === "first" || pivotStrategy === "custom"
        ? low
        : pivotStrategy === "middle"
          ? low + Math.floor((high - low) / 2)
          : pivotStrategy === "random"
            ? low + Math.floor(Math.random() * (high - low + 1))
            : high;
    const pivotValue = array[selectedPivotIndex];
    record({ type: "quick-pivot-select", lineId: "quick.pivot-select", low, high, pivotIndex: selectedPivotIndex, selectedPivotIndex, pivotValue, scanIndex: low, boundary: low });

    if (selectedPivotIndex !== high) {
      [array[selectedPivotIndex], array[high]] = [array[high], array[selectedPivotIndex]];
      record({ type: "quick-pivot-move", lineId: "quick.pivot-move", low, high, pivotIndex: high, selectedPivotIndex, pivotValue, scanIndex: low, boundary: low, swapIndices: [selectedPivotIndex, high] });
    }

    const pivotIndex = high;
    let boundary = low;
    record({ type: "quick-pivot", lineId: "quick.pivot", low, high, pivotIndex, selectedPivotIndex, pivotValue, scanIndex: low, boundary });
    record({ type: "quick-partition", lineId: "quick.partition", low, high, pivotIndex, selectedPivotIndex, pivotValue, scanIndex: low, boundary });

    for (let scanIndex = low; scanIndex < high; scanIndex += 1) {
      const comparedValue = array[scanIndex];
      record({ type: "quick-compare", lineId: "quick.compare", low, high, pivotIndex, selectedPivotIndex, pivotValue, scanIndex, boundary });
      if (array[scanIndex] <= pivotValue) {
        if (boundary !== scanIndex) {
          [array[boundary], array[scanIndex]] = [array[scanIndex], array[boundary]];
          record({ type: "quick-swap", lineId: "quick.swap", low, high, pivotIndex, selectedPivotIndex, pivotValue, scanIndex, boundary, comparedValue, swapIndices: [boundary, scanIndex] });
        }
        boundary += 1;
        record({ type: "quick-boundary", lineId: "quick.boundary", low, high, pivotIndex, selectedPivotIndex, pivotValue, scanIndex, boundary });
      }
    }

    [array[boundary], array[pivotIndex]] = [array[pivotIndex], array[boundary]];
    record({ type: "quick-pivot-place", lineId: "quick.pivot-place", low, high, pivotIndex: boundary, selectedPivotIndex, pivotValue, scanIndex: high, boundary, swapIndices: boundary === pivotIndex ? undefined : [boundary, pivotIndex] });

    if (low < boundary) {
      record({ type: "quick-recurse", lineId: "quick.recurse-left", low, high: boundary - 1, pivotIndex: -1, selectedPivotIndex, pivotValue, scanIndex: -1, boundary, side: "left" });
      sort(low, boundary - 1);
    }
    if (boundary < high) {
      record({ type: "quick-recurse", lineId: "quick.recurse-right", low: boundary + 1, high, pivotIndex: -1, selectedPivotIndex, pivotValue, scanIndex: -1, boundary, side: "right" });
      sort(boundary + 1, high);
    }
  }

  if (array.length > 0) sort(0, array.length - 1);
  steps.push({ type: "complete", lineId: "quick.return", array: [...array], sortedIndices: Array.from({ length: array.length }, (_, index) => index) });
  return steps;
}
