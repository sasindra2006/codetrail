import type { BinarySearchStep } from "./execution";

/** Builds an iterative Binary Search trace for an ascending, sorted array. */
export function executeBinarySearch(input: readonly number[], target: number): BinarySearchStep[] {
  if (input.some((value, index) => index > 0 && input[index - 1] > value)) {
    throw new Error("Binary Search requires an array sorted in ascending order.");
  }

  const steps: BinarySearchStep[] = [];
  let low = 0;
  let high = input.length - 1;
  let mid = -1;

  while (low <= high) {
    mid = low + Math.floor((high - low) / 2);
    steps.push({ type: "binary-compare", lineId: "binary.compare", array: [...input], sortedIndices: [], target, low, mid, high });

    if (input[mid] === target) {
      steps.push({ type: "binary-found", lineId: "binary.found", array: [...input], sortedIndices: [], target, low, mid, high });
      return steps;
    }

    if (input[mid] > target) {
      high = mid - 1;
      steps.push({ type: "binary-left", lineId: "binary.left", array: [...input], sortedIndices: [], target, low, mid, high });
    } else {
      low = mid + 1;
      steps.push({ type: "binary-right", lineId: "binary.right", array: [...input], sortedIndices: [], target, low, mid, high });
    }
  }

  mid = -1;
  steps.push({ type: "binary-not-found", lineId: "binary.return-not-found", array: [...input], sortedIndices: [], target, low, mid, high });
  return steps;
}
