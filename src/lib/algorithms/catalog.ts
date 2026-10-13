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
  visualizer: "bubble" | "selection" | "insertion";
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
];

export function findAlgorithm(slug: string) {
  return algorithms.find((algorithm) => algorithm.slug === slug);
}
