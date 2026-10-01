import type { AlgorithmExecutionStep } from "./execution";

/**
 * Produces the deterministic execution trace for Bubble Sort.
 *
 * Every emitted step includes a full array snapshot so consumers can render an
 * individual step without replaying the prior ones. The input array is never
 * modified.
 */
export function executeBubbleSort(input: readonly number[]): AlgorithmExecutionStep[] {
  const array = [...input];
  const steps: AlgorithmExecutionStep[] = [];
  const sortedIndices: number[] = [];

  for (let end = array.length - 1; end > 0; end -= 1) {
    for (let index = 0; index < end; index += 1) {
      const nextIndex = index + 1;

      steps.push({
        type: "comparison",
        array: [...array],
        sortedIndices: [...sortedIndices],
        indices: [index, nextIndex],
      });

      if (array[index] > array[nextIndex]) {
        [array[index], array[nextIndex]] = [array[nextIndex], array[index]];
        steps.push({
          type: "swap",
          array: [...array],
          sortedIndices: [...sortedIndices],
          indices: [index, nextIndex],
        });
      }
    }

    sortedIndices.unshift(end);
    steps.push({
      type: "mark-sorted",
      array: [...array],
      sortedIndices: [...sortedIndices],
      index: end,
    });
  }

  if (array.length > 0) {
    sortedIndices.unshift(0);
    steps.push({
      type: "mark-sorted",
      array: [...array],
      sortedIndices: [...sortedIndices],
      index: 0,
    });
  }

  steps.push({
    type: "complete",
    array: [...array],
    sortedIndices: [...sortedIndices],
  });

  return steps;
}
