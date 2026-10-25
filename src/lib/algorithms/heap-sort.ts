import type { AlgorithmExecutionStep, HeapSortStep } from "./execution";

/** Produces an in-place max-heap sort trace without mutating the input array. */
export function executeHeapSort(input: readonly number[]): AlgorithmExecutionStep[] {
  const array = [...input];
  const steps: AlgorithmExecutionStep[] = [];

  function record(step: Omit<HeapSortStep, "array" | "sortedIndices">) {
    const sortedIndices = Array.from({ length: array.length - step.activeHeapSize }, (_, offset) => step.activeHeapSize + offset);
    steps.push({ ...step, array: [...array], sortedIndices });
  }

  function children(parentIndex: number, heapSize: number) {
    const leftChildIndex = parentIndex * 2 + 1;
    const rightChildIndex = leftChildIndex + 1;
    return {
      leftChildIndex: leftChildIndex < heapSize ? leftChildIndex : -1,
      rightChildIndex: rightChildIndex < heapSize ? rightChildIndex : -1,
    };
  }

  function siftDown(startIndex: number, heapSize: number, phase: "build" | "extract") {
    let parentIndex = startIndex;

    while (true) {
      const { leftChildIndex, rightChildIndex } = children(parentIndex, heapSize);
      record({ type: "heapify-start", lineId: "heap.sift", phase, activeHeapSize: heapSize, parentIndex, leftChildIndex, rightChildIndex });
      let largestIndex = parentIndex;

      if (leftChildIndex !== -1) {
        record({ type: "heapify-compare", lineId: "heap.left", phase, activeHeapSize: heapSize, parentIndex, leftChildIndex, rightChildIndex, indices: [parentIndex, leftChildIndex] });
        if (array[leftChildIndex] > array[largestIndex]) largestIndex = leftChildIndex;
      }

      if (rightChildIndex !== -1) {
        record({ type: "heapify-compare", lineId: "heap.right", phase, activeHeapSize: heapSize, parentIndex, leftChildIndex, rightChildIndex, indices: [largestIndex, rightChildIndex] });
        if (array[rightChildIndex] > array[largestIndex]) largestIndex = rightChildIndex;
      }

      if (largestIndex === parentIndex) {
        record({ type: "heapify-done", lineId: "heap.sift-done", phase, activeHeapSize: heapSize, parentIndex, leftChildIndex, rightChildIndex });
        return;
      }

      [array[parentIndex], array[largestIndex]] = [array[largestIndex], array[parentIndex]];
      record({ type: "heapify-swap", lineId: "heap.swap", phase, activeHeapSize: heapSize, parentIndex, leftChildIndex, rightChildIndex, swapIndices: [parentIndex, largestIndex] });
      parentIndex = largestIndex;
    }
  }

  for (let parentIndex = Math.floor(array.length / 2) - 1; parentIndex >= 0; parentIndex -= 1) {
    const { leftChildIndex, rightChildIndex } = children(parentIndex, array.length);
    record({ type: "heap-build-start", lineId: "heap.build", phase: "build", activeHeapSize: array.length, parentIndex, leftChildIndex, rightChildIndex });
    siftDown(parentIndex, array.length, "build");
  }

  const builtChildren = array.length > 0 ? children(0, array.length) : { leftChildIndex: -1, rightChildIndex: -1 };
  record({ type: "heap-built", lineId: "heap.build-done", phase: "build", activeHeapSize: array.length, parentIndex: array.length > 0 ? 0 : -1, ...builtChildren });

  for (let end = array.length - 1; end > 0; end -= 1) {
    const { leftChildIndex, rightChildIndex } = children(0, end + 1);
    record({ type: "heap-extract", lineId: "heap.extract", phase: "extract", activeHeapSize: end + 1, parentIndex: 0, leftChildIndex, rightChildIndex, indices: [0, end], extractedIndex: end });
    [array[0], array[end]] = [array[end], array[0]];
    const activeHeapSize = end;
    const nextChildren = children(0, activeHeapSize);
    record({ type: "heap-extract-swap", lineId: "heap.extract-swap", phase: "extract", activeHeapSize, parentIndex: 0, ...nextChildren, indices: [0, end], swapIndices: [0, end], extractedIndex: end });
    siftDown(0, activeHeapSize, "extract");
  }

  record({ type: "heap-sorted", lineId: "heap.complete", phase: "extract", activeHeapSize: 0, parentIndex: -1, leftChildIndex: -1, rightChildIndex: -1 });
  steps.push({ type: "complete", lineId: "heap.return", array: [...array], sortedIndices: Array.from({ length: array.length }, (_, index) => index) });
  return steps;
}
