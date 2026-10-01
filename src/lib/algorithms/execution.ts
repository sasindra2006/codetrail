export type AlgorithmExecutionStep =
  | ComparisonStep
  | SwapStep
  | MarkSortedStep
  | CompleteStep;

type StepSnapshot = {
  /** The complete visual state at this point in the execution. */
  array: readonly number[];
  sortedIndices: readonly number[];
};

export type ComparisonStep = StepSnapshot & {
  type: "comparison";
  indices: readonly [number, number];
};

export type SwapStep = StepSnapshot & {
  type: "swap";
  indices: readonly [number, number];
};

export type MarkSortedStep = StepSnapshot & {
  type: "mark-sorted";
  index: number;
};

export type CompleteStep = StepSnapshot & { type: "complete" };
