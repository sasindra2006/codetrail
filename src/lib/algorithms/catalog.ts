import type { PseudocodeLine } from "./execution";

export type AlgorithmCategory = "Sorting" | "Searching" | "Linked Lists" | "Trees" | "Graphs";

export type AlgorithmInfo = {
  slug: string;
  name: string;
  category: AlgorithmCategory;
  description: string;
  keywords: string[];
  timeComplexity: string;
  bestCase: string;
  averageCase: string;
  worstCase: string;
  spaceComplexity: string;
  explanation: string;
  pseudocode: readonly PseudocodeLine[];
  properties: string;
  visualizer: "bubble" | "selection" | "insertion" | "merge" | "quick" | "heap" | "linear" | "binary";
};

export const algorithms: AlgorithmInfo[] = [
  {
    slug: "bubble-sort", name: "Bubble Sort", category: "Sorting",
    description: "Repeatedly compare neighboring values and swap them when they are out of order.",
    keywords: ["adjacent", "comparison", "stable", "in-place", "array", "sorting"],
    timeComplexity: "O(n\u00b2)", bestCase: "O(n\u00b2)", averageCase: "O(n\u00b2)", worstCase: "O(n\u00b2)", spaceComplexity: "O(1)",
    explanation: "Bubble Sort makes repeated passes through the array. On each pass, adjacent values are compared and swapped when they are out of order, so the largest unsorted value moves to the end. This implementation stops after a fixed number of passes.",
    pseudocode: [
      { id: "bubble.header", text: "BUBBLE-SORT(A):" },
      { id: "bubble.length", text: "    n = length(A)" },
      { id: "bubble.outer-loop", text: "    for end = n - 1 down to 1:" },
      { id: "bubble.inner-loop", text: "        for i = 0 to end - 1:" },
      { id: "bubble.compare", text: "            if A[i] > A[i + 1]:" },
      { id: "bubble.swap", text: "                swap A[i] and A[i + 1]" },
      { id: "bubble.mark-sorted", text: "        mark A[end] as sorted" },
      { id: "bubble.mark-first", text: "    if n > 0: mark A[0] as sorted" },
      { id: "bubble.return", text: "    return A" },
    ],
    properties: "Stable · In-place", visualizer: "bubble",
  },
  {
    slug: "selection-sort", name: "Selection Sort", category: "Sorting",
    description: "Find the smallest remaining value and place it at the start of the unsorted region.",
    keywords: ["minimum", "comparison", "in-place", "array", "sorting"],
    timeComplexity: "O(n\u00b2)", bestCase: "O(n\u00b2)", averageCase: "O(n\u00b2)", worstCase: "O(n\u00b2)", spaceComplexity: "O(1)",
    explanation: "Selection Sort divides the array into a sorted prefix and an unsorted suffix. For each position, it scans the remaining values for the minimum, swaps that value into place, and extends the sorted prefix. It performs quadratic comparisons and at most one swap per pass.",
    pseudocode: [
      { id: "selection.header", text: "SELECTION-SORT(A):" },
      { id: "selection.length", text: "    n = length(A)" },
      { id: "selection.outer-loop", text: "    for start = 0 to n - 2:" },
      { id: "selection.minimum-start", text: "        minIndex = start" },
      { id: "selection.inner-loop", text: "        for i = start + 1 to n - 1:" },
      { id: "selection.compare", text: "            if A[i] < A[minIndex]:" },
      { id: "selection.minimum-update", text: "                minIndex = i" },
      { id: "selection.swap-condition", text: "        if minIndex != start:" },
      { id: "selection.swap", text: "            swap A[start] and A[minIndex]" },
      { id: "selection.mark-sorted", text: "        mark A[start] as sorted" },
      { id: "selection.mark-last", text: "    if n > 0: mark A[n - 1] as sorted" },
      { id: "selection.return", text: "    return A" },
    ],
    properties: "In-place · Usually unstable", visualizer: "selection",
  },
  {
    slug: "insertion-sort", name: "Insertion Sort", category: "Sorting",
    description: "Build a sorted prefix by inserting each value into its correct position.",
    keywords: ["key", "shift", "stable", "in-place", "array", "sorting"],
    timeComplexity: "O(n\u00b2)", bestCase: "O(n)", averageCase: "O(n\u00b2)", worstCase: "O(n\u00b2)", spaceComplexity: "O(1)",
    explanation: "Insertion Sort grows a sorted prefix from left to right. It holds the next value as a key, shifts larger prefix values one position right, and inserts the key into the open position. It is stable and uses constant auxiliary space.",
    pseudocode: [
      { id: "insertion.header", text: "INSERTION-SORT(A):" },
      { id: "insertion.length", text: "    n = length(A)" },
      { id: "insertion.outer-loop", text: "    for i = 1 to n - 1:" },
      { id: "insertion.key", text: "        key = A[i]" },
      { id: "insertion.position", text: "        position = i - 1" },
      { id: "insertion.while", text: "        while position >= 0 and A[position] > key:" },
      { id: "insertion.shift", text: "            shift A[position] to A[position + 1]; decrement position" },
      { id: "insertion.insert", text: "        A[position + 1] = key" },
      { id: "insertion.return", text: "    return A" },
    ],
    properties: "Stable · In-place", visualizer: "insertion",
  },
  {
    slug: "heap-sort", name: "Heap Sort", category: "Sorting",
    description: "Build a max heap, then repeatedly extract its maximum into the sorted suffix.",
    keywords: ["max heap", "heapify", "sift down", "in-place", "array", "sorting"],
    timeComplexity: "O(n log n)", bestCase: "O(n log n)", averageCase: "O(n log n)", worstCase: "O(n log n)", spaceComplexity: "O(1)",
    explanation: "Heap Sort first builds a max heap, where each parent is at least as large as its children. It then swaps the root with the final value in the active heap, shrinks the heap, and sifts the new root down to restore the max-heap property. Repeating this places values in ascending order in the growing suffix. This iterative implementation sorts in place using constant auxiliary space.",
    pseudocode: [
      { id: "heap.header", text: "HEAP-SORT(A):" },
      { id: "heap.build", text: "    for parent = floor(n / 2) - 1 down to 0: siftDown(A, parent, n)" },
      { id: "heap.build-done", text: "    heapSize = n" },
      { id: "heap.extract", text: "    for end = n - 1 down to 1:" },
      { id: "heap.extract-swap", text: "        swap A[0] with A[end]; decrease heapSize" },
      { id: "heap.sift", text: "        siftDown(A, 0, heapSize)" },
      { id: "heap.left", text: "            compare parent with its left child" },
      { id: "heap.right", text: "            compare the larger candidate with its right child" },
      { id: "heap.swap", text: "            swap parent with the larger child and continue" },
      { id: "heap.sift-done", text: "        stop when the parent is at least as large as its children" },
      { id: "heap.complete", text: "    all values are in ascending order" },
      { id: "heap.return", text: "    return A" },
    ],
    properties: "In-place | Max heap", visualizer: "heap",
  },
  {
    slug: "quick-sort", name: "Quick Sort", category: "Sorting",
    description: "Partition around each range's last value, then recursively sort both sides.",
    keywords: ["pivot", "Lomuto", "partition", "recursive", "in-place", "sorting"],
    timeComplexity: "O(n log n) avg", bestCase: "O(n log n)", averageCase: "O(n log n)", worstCase: "O(n²)", spaceComplexity: "O(log n) avg; O(n) worst",
    explanation: "Quick Sort selects the last value in the active range as its pivot. Lomuto partitioning scans the rest of the range, moving values less than or equal to the pivot to the left side while tracking a boundary. It then swaps the pivot into that boundary, where it reaches its final sorted position, and recursively sorts the nonempty ranges on either side. The partition is in-place; recursion uses O(log n) stack space on balanced inputs and O(n) in the worst case.",
    pseudocode: [
      { id: "quick.header", text: "QUICK-SORT(A, low, high):" },
      { id: "quick.base", text: "    if low >= high: return" },
      { id: "quick.pivot", text: "    pivot = A[high]; boundary = low" },
      { id: "quick.partition", text: "    partition range low to high using Lomuto's method" },
      { id: "quick.compare", text: "        for j = low to high - 1: if A[j] <= pivot" },
      { id: "quick.swap", text: "            swap A[boundary] and A[j]" },
      { id: "quick.boundary", text: "            boundary = boundary + 1" },
      { id: "quick.pivot-place", text: "    swap A[boundary] and A[high]; pivot is final" },
      { id: "quick.recurse-left", text: "    if low < boundary: QUICK-SORT(A, low, boundary - 1)" },
      { id: "quick.recurse-right", text: "    if boundary < high: QUICK-SORT(A, boundary + 1, high)" },
      { id: "quick.return", text: "    return A" },
    ],
    properties: "In-place partition · Recursive", visualizer: "quick",
  },
  {
    slug: "merge-sort", name: "Merge Sort", category: "Sorting",
    description: "Recursively split the array, then merge sorted halves into ascending order.",
    keywords: ["divide and conquer", "recursive", "merge", "stable", "array", "sorting"],
    timeComplexity: "O(n log n)", bestCase: "O(n log n)", averageCase: "O(n log n)", worstCase: "O(n log n)", spaceComplexity: "O(n)",
    explanation: "Merge Sort recursively divides the array into smaller ranges until each range contains one value. It then merges neighboring sorted ranges by comparing their front values and placing the smaller value into the output range. This top-down implementation is stable and uses O(n) auxiliary space.",
    pseudocode: [
      { id: "merge.header", text: "MERGE-SORT(A, left, right):" },
      { id: "merge.base", text: "    if left >= right: return" },
      { id: "merge.split", text: "    mid = floor((left + right) / 2); recursively sort both halves" },
      { id: "merge.initialize", text: "    copy the left and right sorted halves" },
      { id: "merge.compare", text: "    while both halves have values: compare their next values" },
      { id: "merge.place", text: "        place the smaller value at the next output index" },
      { id: "merge.complete", text: "    finish the merge after copying any remaining values" },
      { id: "merge.return", text: "    return A" },
    ],
    properties: "Stable | Divide and conquer", visualizer: "merge",
  },
  {
  slug: "linear-search", name: "Linear Search", category: "Searching",
  description: "Check each value from left to right until the target is found or the array ends.",
  keywords: ["sequential", "target", "array", "search", "first match"],
  timeComplexity: "O(n)", bestCase: "O(1)", averageCase: "O(n)", worstCase: "O(n)", spaceComplexity: "O(1)",
  explanation: "Linear Search examines values from left to right, comparing each one with the target. It stops at the first match, so duplicate values return the first matching index. If every value has been checked, the target is not present. The search uses constant auxiliary space.",
  pseudocode: [
    { id: "linear.header", text: "LINEAR-SEARCH(A, target):" },
    { id: "linear.length", text: "    n = length(A)" },
    { id: "linear.loop", text: "    for i = 0 to n - 1:" },
    { id: "linear.compare", text: "        if A[i] == target:" },
    { id: "linear.found", text: "            return i" },
    { id: "linear.return-not-found", text: "    return -1" },
  ],
  properties: "Sequential · First match", visualizer: "linear",
  },
  {
    slug: "binary-search", name: "Binary Search", category: "Searching",
    description: "Search a sorted array by repeatedly narrowing the interval around its middle value.",
    keywords: ["sorted", "divide and conquer", "target", "array", "search"],
    timeComplexity: "O(log n)", bestCase: "O(1)", averageCase: "O(log n)", worstCase: "O(log n)", spaceComplexity: "O(1)",
    explanation: "Binary Search operates on an ascending sorted array. It compares the target with the middle value, then discards the half that cannot contain the target. Repeating this process takes logarithmic time and constant auxiliary space. When duplicates are present, this implementation returns any matching occurrence.",
    pseudocode: [
      { id: "binary.header", text: "BINARY-SEARCH(A, target):" },
      { id: "binary.initialize", text: "    low = 0; high = length(A) - 1" },
      { id: "binary.loop", text: "    while low <= high:" },
      { id: "binary.middle", text: "        mid = low + floor((high - low) / 2)" },
      { id: "binary.compare", text: "        if A[mid] == target:" },
      { id: "binary.found", text: "            return mid" },
      { id: "binary.left", text: "        if A[mid] > target: high = mid - 1" },
      { id: "binary.right", text: "        else: low = mid + 1" },
      { id: "binary.return-not-found", text: "    return -1" },
    ],
    properties: "Sorted input · Iterative", visualizer: "binary",
  },
];

export function findAlgorithm(slug: string) {
  return algorithms.find((algorithm) => algorithm.slug === slug);
}
