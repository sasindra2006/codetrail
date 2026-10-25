import type { AlgorithmExecutionStep, CountingSortStep } from "./execution";

/** Builds an immutable trace of frequency counting and output construction. */
export function executeCountingSort(input: readonly number[]): AlgorithmExecutionStep[] {
  if (input.length === 0) {
    return [{ type: "complete", lineId: "counting.return", array: [], sortedIndices: [] }];
  }

  const minimum = Math.min(...input);
  const maximum = Math.max(...input);
  const counts = Array(maximum - minimum + 1).fill(0) as number[];
  const output: (number | null)[] = Array(input.length).fill(null);
  const steps: AlgorithmExecutionStep[] = [];
  const inputFrequencies: number[] = [];

  function record(step: Omit<CountingSortStep, "array" | "sortedIndices" | "counts" | "frequencies" | "output">) {
    steps.push({
      ...step,
      array: [...input],
      sortedIndices: [],
      counts: [...counts],
      frequencies: [...(step.phase === "output" ? inputFrequencies : counts)],
      output: [...output],
    });
  }

  record({ type: "counting-range", lineId: "counting.range", phase: "count", minimum, maximum });
  record({ type: "counting-initialize", lineId: "counting.initialize", phase: "count", minimum, maximum });

  for (let inputIndex = 0; inputIndex < input.length; inputIndex += 1) {
    const bucketIndex = input[inputIndex] - minimum;
    counts[bucketIndex] += 1;
    record({ type: "counting-count", lineId: "counting.increment", phase: "count", minimum, maximum, inputIndex, bucketIndex });
  }

  inputFrequencies.push(...counts);
  record({ type: "counting-counted", lineId: "counting.scan", phase: "count", minimum, maximum });
  record({ type: "counting-output-start", lineId: "counting.output-start", phase: "output", minimum, maximum });

  let outputIndex = 0;
  for (let bucketIndex = 0; bucketIndex < counts.length; bucketIndex += 1) {
    while (counts[bucketIndex] > 0) {
      const outputValue = minimum + bucketIndex;
      output[outputIndex] = outputValue;
      counts[bucketIndex] -= 1;
      record({ type: "counting-output-place", lineId: "counting.emit", phase: "output", minimum, maximum, bucketIndex, outputIndex, outputValue });
      outputIndex += 1;
    }
  }

  const sorted = output as number[];
  steps.push({
    type: "complete",
    lineId: "counting.return",
    array: [...sorted],
    sortedIndices: Array.from({ length: sorted.length }, (_, index) => index),
  });
  return steps;
}
