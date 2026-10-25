export type PseudocodeLineId =
  | "bubble.header" | "bubble.length" | "bubble.outer-loop" | "bubble.inner-loop" | "bubble.compare" | "bubble.swap" | "bubble.mark-sorted" | "bubble.mark-first" | "bubble.return"
  | "selection.header" | "selection.length" | "selection.outer-loop" | "selection.minimum-start" | "selection.inner-loop" | "selection.compare" | "selection.minimum-update" | "selection.swap-condition" | "selection.swap" | "selection.mark-sorted" | "selection.mark-last" | "selection.return"
  | "insertion.header" | "insertion.length" | "insertion.outer-loop" | "insertion.key" | "insertion.position" | "insertion.while" | "insertion.shift" | "insertion.decrement" | "insertion.insert" | "insertion.return"
  | "linear.header" | "linear.length" | "linear.loop" | "linear.compare" | "linear.found" | "linear.return-not-found"
  | "binary.header" | "binary.initialize" | "binary.loop" | "binary.middle" | "binary.compare" | "binary.left" | "binary.right" | "binary.found" | "binary.return-not-found"
  | "merge.header" | "merge.base" | "merge.split" | "merge.initialize" | "merge.compare" | "merge.place" | "merge.complete" | "merge.return";

export type PseudocodeLine = { id: PseudocodeLineId; text: string };

type StepSnapshot = {
  /** Complete visual state at this point in the execution. */
  array: readonly number[];
  sortedIndices: readonly number[];
  /** Stable identifier for the corresponding pseudocode line. */
  lineId: PseudocodeLineId;
};

export type AlgorithmExecutionStep =
  | ComparisonStep
  | DecisionStep
  | SwapStep
  | MarkSortedStep
  | MinimumUpdateStep
  | KeyStep
  | ShiftStep
  | InsertStep
  | SearchStep
  | BinarySearchStep
  | MergeSortStep
  | CompleteStep;

export type ComparisonStep = StepSnapshot & {
  type: "comparison";
  indices: readonly [number, number];
};

export type DecisionStep = StepSnapshot & {
  type: "decision";
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

export type MinimumUpdateStep = StepSnapshot & { type: "minimum-update"; index: number };
export type KeyStep = StepSnapshot & { type: "key"; key: number; index: number };
export type ShiftStep = StepSnapshot & { type: "shift"; key: number; keyIndex: number; from: number; to: number };
export type InsertStep = StepSnapshot & { type: "insert"; key: number; index: number };

export type SearchStep = StepSnapshot & {
  type: "search-compare" | "search-found" | "search-not-found";
  target: number;
  index: number;
  checkedIndices: readonly number[];
};

export type BinarySearchStep = StepSnapshot & {
  type: "binary-compare" | "binary-left" | "binary-right" | "binary-found" | "binary-not-found";
  target: number;
  low: number;
  mid: number;
  high: number;
};

export type MergeSortStep = StepSnapshot & {
  type: "merge-base" | "merge-split" | "merge-start" | "merge-compare" | "merge-place" | "merge-complete";
  left: number;
  mid: number;
  right: number;
  leftCursor: number;
  rightCursor: number;
  outputIndex: number;
  leftValue?: number;
  rightValue?: number;
  placedValue?: number;
  placedFrom?: "left" | "right";
};

export type CompleteStep = StepSnapshot & { type: "complete" };
