import type { AlgorithmExecutionStep, RadixSortStep } from "./execution";

/** Stable LSD passes on magnitudes, with negatives reversed by magnitude at the end. */
export function executeRadixSort(input: readonly number[]): AlgorithmExecutionStep[] {
  const steps: AlgorithmExecutionStep[] = [];
  const originalInput = [...input];
  const array = [...input];
  const negatives = input.filter((value) => value < 0).map((value) => -value);
  const nonNegatives = input.filter((value) => value >= 0);
  const emptyBuckets = () => Array.from({ length: 10 }, () => [] as number[]);

  function record(step: Omit<RadixSortStep, "array" | "sortedIndices" | "buckets" | "output" | "originalInput">, state: {
    values: readonly number[]; buckets: readonly (readonly number[])[]; output: readonly number[];
  }) {
    steps.push({ ...step, array: [...state.values], sortedIndices: [], buckets: state.buckets.map((bucket) => [...bucket]), output: [...state.output], originalInput: [...originalInput] });
  }

  record({ type: "radix-split", lineId: "radix.split", phase: "split", sign: "negative", digitPlace: 1 }, { values: array, buckets: emptyBuckets(), output: [] });
  for (const group of [{ sign: "negative" as const, values: negatives }, { sign: "non-negative" as const, values: nonNegatives }]) {
    if (group.values.length === 0) continue;
    const maxMagnitude = Math.max(...group.values);
    for (let digitPlace = 1; digitPlace <= maxMagnitude || digitPlace === 1; digitPlace *= 10) {
      const buckets = emptyBuckets();
      const output: number[] = [];
      record({ type: "radix-pass", lineId: "radix.pass", phase: "distribute", sign: group.sign, digitPlace }, { values: array, buckets, output });
      for (let activeIndex = 0; activeIndex < group.values.length; activeIndex += 1) {
        const magnitude = group.values[activeIndex];
        const activeDigit = Math.floor(magnitude / digitPlace) % 10;
        buckets[activeDigit].push(magnitude);
        record({ type: "radix-distribute", lineId: "radix.distribute", phase: "distribute", sign: group.sign, digitPlace, activeIndex, activeDigit, activeMagnitude: magnitude, bucketIndex: activeDigit }, { values: array, buckets, output });
      }
      let collectionIndex = 0;
      for (let bucketIndex = 0; bucketIndex < 10; bucketIndex += 1) {
        for (const magnitude of buckets[bucketIndex]) {
          output.push(magnitude);
          collectionIndex += 1;
          record({ type: "radix-collect", lineId: "radix.collect", phase: "collect", sign: group.sign, digitPlace, bucketIndex, collectionIndex: collectionIndex - 1 }, { values: array, buckets, output });
        }
      }
      group.values.splice(0, group.values.length, ...output);
      if (digitPlace > Math.floor(maxMagnitude / 10)) break;
    }
  }

  const result = [...negatives].reverse().map((value) => -value).concat(nonNegatives);
  array.splice(0, array.length, ...result);
  record({ type: "radix-combine", lineId: "radix.combine", phase: "combine", sign: "negative", digitPlace: 1 }, { values: array, buckets: emptyBuckets(), output: result });
  steps.push({ type: "complete", lineId: "radix.return", array: [...array], sortedIndices: Array.from({ length: array.length }, (_, index) => index) });
  return steps;
}
