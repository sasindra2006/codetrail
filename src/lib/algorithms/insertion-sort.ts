import type { AlgorithmExecutionStep } from "./execution";

/** Produces a deterministic, non-mutating trace of standard in-place Insertion Sort. */
export function executeInsertionSort(input: readonly number[]): AlgorithmExecutionStep[] {
  const array = [...input];
  const steps: AlgorithmExecutionStep[] = [];
  let sortedIndices: number[] = array.length ? [0] : [];

  for (let index = 1; index < array.length; index += 1) {
    const key = array[index];
    let cursor = index - 1;
    steps.push({ type: "key", array: [...array], sortedIndices: [...sortedIndices], key, index });

    while (cursor >= 0) {
      steps.push({ type: "comparison", array: [...array], sortedIndices: [...sortedIndices], indices: [cursor, index] });
      if (array[cursor] <= key) break;

      array[cursor + 1] = array[cursor];
      steps.push({ type: "shift", array: [...array], sortedIndices: [...sortedIndices], key, keyIndex: index, from: cursor, to: cursor + 1 });
      cursor -= 1;
    }

    const destination = cursor + 1;
    array[destination] = key;
    sortedIndices = Array.from({ length: index + 1 }, (_, sortedIndex) => sortedIndex);
    steps.push({ type: "insert", array: [...array], sortedIndices: [...sortedIndices], key, index: destination });
  }

  steps.push({ type: "complete", array: [...array], sortedIndices: [...sortedIndices] });
  return steps;
}
