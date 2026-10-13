
import type { AlgorithmExecutionStep } from "./execution";

/**
 * Produces the execution trace for Selection Sort.
 * The input array is never modified.
 */
export function executeSelectionSort(
  input: readonly number[],
): AlgorithmExecutionStep[] {
  const array = [...input];
  const steps: AlgorithmExecutionStep[] = [];
  const sortedIndices: number[] = [];

  for (let start = 0; start < array.length - 1; start += 1) {
    let minIndex = start;

    for (let index = start + 1; index < array.length; index += 1) {
      steps.push({
        type: "comparison",
        lineId: "selection.compare",
        array: [...array],
        sortedIndices: [...sortedIndices],
        indices: [minIndex, index],
      });

      if (array[index] < array[minIndex]) {
        minIndex = index;
        steps.push({
          type: "minimum-update",
          lineId: "selection.minimum-update",
          array: [...array],
          sortedIndices: [...sortedIndices],
          index: minIndex,
        });
      }
    }

    steps.push({
      type: "decision",
      lineId: "selection.swap-condition",
      array: [...array],
      sortedIndices: [...sortedIndices],
      indices: [start, minIndex],
    });

    if (minIndex !== start) {
      [array[start], array[minIndex]] = [array[minIndex], array[start]];

      steps.push({
        type: "swap",
        lineId: "selection.swap",
        array: [...array],
        sortedIndices: [...sortedIndices],
        indices: [start, minIndex],
      });
    }

    sortedIndices.push(start);

    steps.push({
      type: "mark-sorted",
      lineId: "selection.mark-sorted",
      array: [...array],
      sortedIndices: [...sortedIndices],
      index: start,
    });
  }

  if (array.length > 0) {
    sortedIndices.push(array.length - 1);

    steps.push({
      type: "mark-sorted",
      lineId: "selection.mark-last",
      array: [...array],
      sortedIndices: [...sortedIndices],
      index: array.length - 1,
    });
  }

  steps.push({
    type: "complete",
    lineId: "selection.return",
    array: [...array],
    sortedIndices: [...sortedIndices],
  });

  return steps;
}
