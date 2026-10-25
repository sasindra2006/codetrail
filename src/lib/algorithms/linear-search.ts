import type { SearchStep } from "./execution";

/** Builds a non-mutating trace that stops at the first matching index. */
export function executeLinearSearch(input: readonly number[], target: number): SearchStep[] {
  const steps: SearchStep[] = [];
  const checkedIndices: number[] = [];

  for (let index = 0; index < input.length; index += 1) {
    steps.push({ type: "search-compare", lineId: "linear.compare", array: [...input], sortedIndices: [], target, index, checkedIndices: [...checkedIndices] });
    checkedIndices.push(index);
    if (input[index] === target) {
      steps.push({ type: "search-found", lineId: "linear.found", array: [...input], sortedIndices: [], target, index, checkedIndices: [...checkedIndices] });
      return steps;
    }
  }

  steps.push({ type: "search-not-found", lineId: "linear.return-not-found", array: [...input], sortedIndices: [], target, index: -1, checkedIndices: [...checkedIndices] });
  return steps;
}
