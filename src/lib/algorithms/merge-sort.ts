import type { AlgorithmExecutionStep, MergeSortStep } from "./execution";

/** Produces a top-down recursive Merge Sort trace with snapshots for each split and placement. */
export function executeMergeSort(input: readonly number[]): AlgorithmExecutionStep[] {
  const array = [...input];
  const steps: AlgorithmExecutionStep[] = [];

  function record(step: Omit<MergeSortStep, "array" | "sortedIndices">) {
    steps.push({ ...step, array: [...array], sortedIndices: [] });
  }

  function sort(left: number, right: number): void {
    if (left >= right) {
      record({ type: "merge-base", lineId: "merge.base", left, mid: left, right, leftCursor: left, rightCursor: right + 1, outputIndex: left });
      return;
    }

    const mid = left + Math.floor((right - left) / 2);
    record({ type: "merge-split", lineId: "merge.split", left, mid, right, leftCursor: left, rightCursor: mid + 1, outputIndex: left });
    sort(left, mid);
    sort(mid + 1, right);

    const leftValues = array.slice(left, mid + 1);
    const rightValues = array.slice(mid + 1, right + 1);
    let leftCursor = 0;
    let rightCursor = 0;
    let outputIndex = left;

    record({ type: "merge-start", lineId: "merge.initialize", left, mid, right, leftCursor: left, rightCursor: mid + 1, outputIndex });

    while (leftCursor < leftValues.length && rightCursor < rightValues.length) {
      record({ type: "merge-compare", lineId: "merge.compare", left, mid, right, leftCursor: left + leftCursor, rightCursor: mid + 1 + rightCursor, outputIndex, leftValue: leftValues[leftCursor], rightValue: rightValues[rightCursor] });
      const fromLeft = leftValues[leftCursor] <= rightValues[rightCursor];
      const placedValue = fromLeft ? leftValues[leftCursor++] : rightValues[rightCursor++];
      array[outputIndex] = placedValue;
      record({ type: "merge-place", lineId: "merge.place", left, mid, right, leftCursor: left + leftCursor, rightCursor: mid + 1 + rightCursor, outputIndex, placedValue, placedFrom: fromLeft ? "left" : "right" });
      outputIndex += 1;
    }

    while (leftCursor < leftValues.length) {
      const placedValue = leftValues[leftCursor++];
      array[outputIndex] = placedValue;
      record({ type: "merge-place", lineId: "merge.place", left, mid, right, leftCursor: left + leftCursor, rightCursor: mid + 1 + rightCursor, outputIndex, placedValue, placedFrom: "left" });
      outputIndex += 1;
    }

    while (rightCursor < rightValues.length) {
      const placedValue = rightValues[rightCursor++];
      array[outputIndex] = placedValue;
      record({ type: "merge-place", lineId: "merge.place", left, mid, right, leftCursor: left + leftCursor, rightCursor: mid + 1 + rightCursor, outputIndex, placedValue, placedFrom: "right" });
      outputIndex += 1;
    }

    record({ type: "merge-complete", lineId: "merge.complete", left, mid, right, leftCursor: mid + 1, rightCursor: right + 1, outputIndex: right });
  }

  if (array.length > 0) sort(0, array.length - 1);
  steps.push({ type: "complete", lineId: "merge.return", array: [...array], sortedIndices: Array.from({ length: array.length }, (_, index) => index) });
  return steps;
}
