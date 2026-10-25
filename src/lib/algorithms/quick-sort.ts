import type { AlgorithmExecutionStep, QuickSortStep } from "./execution";

/** Produces a recursive Lomuto Quick Sort trace without mutating the input. */
export function executeQuickSort(input: readonly number[]): AlgorithmExecutionStep[] {
  const array = [...input];
  const steps: AlgorithmExecutionStep[] = [];

  function record(step: Omit<QuickSortStep, "array" | "sortedIndices">) {
    steps.push({ ...step, array: [...array], sortedIndices: [] });
  }

  function sort(low: number, high: number): void {
    if (low >= high) {
      if (low === high) {
        record({ type: "quick-base", lineId: "quick.base", low, high, pivotIndex: high, pivotValue: array[high], scanIndex: -1, boundary: low });
      }
      return;
    }

    const pivotIndex = high;
    const pivotValue = array[pivotIndex];
    let boundary = low;
    record({ type: "quick-pivot", lineId: "quick.pivot", low, high, pivotIndex, pivotValue, scanIndex: low, boundary });
    record({ type: "quick-partition", lineId: "quick.partition", low, high, pivotIndex, pivotValue, scanIndex: low, boundary });

    for (let scanIndex = low; scanIndex < high; scanIndex += 1) {
      const comparedValue = array[scanIndex];
      record({ type: "quick-compare", lineId: "quick.compare", low, high, pivotIndex, pivotValue, scanIndex, boundary });
      if (array[scanIndex] <= pivotValue) {
        if (boundary !== scanIndex) {
          [array[boundary], array[scanIndex]] = [array[scanIndex], array[boundary]];
          record({ type: "quick-swap", lineId: "quick.swap", low, high, pivotIndex, pivotValue, scanIndex, boundary, comparedValue, swapIndices: [boundary, scanIndex] });
        }
        boundary += 1;
        record({ type: "quick-boundary", lineId: "quick.boundary", low, high, pivotIndex, pivotValue, scanIndex, boundary });
      }
    }

    [array[boundary], array[pivotIndex]] = [array[pivotIndex], array[boundary]];
    record({ type: "quick-pivot-place", lineId: "quick.pivot-place", low, high, pivotIndex: boundary, pivotValue, scanIndex: high, boundary, swapIndices: boundary === pivotIndex ? undefined : [boundary, pivotIndex] });

    if (low < boundary) {
      record({ type: "quick-recurse", lineId: "quick.recurse-left", low, high: boundary - 1, pivotIndex: -1, pivotValue, scanIndex: -1, boundary, side: "left" });
      sort(low, boundary - 1);
    }
    if (boundary < high) {
      record({ type: "quick-recurse", lineId: "quick.recurse-right", low: boundary + 1, high, pivotIndex: -1, pivotValue, scanIndex: -1, boundary, side: "right" });
      sort(boundary + 1, high);
    }
  }

  if (array.length > 0) sort(0, array.length - 1);
  steps.push({ type: "complete", lineId: "quick.return", array: [...array], sortedIndices: Array.from({ length: array.length }, (_, index) => index) });
  return steps;
}
