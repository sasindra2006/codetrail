export type AlgorithmCategory = "Sorting" | "Searching" | "Linked Lists" | "Trees" | "Graphs";

export type AlgorithmInfo = {
  slug: string;
  name: string;
  category: AlgorithmCategory;
  description: string;
  keywords: string[];
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  properties: string;
  visualizer: "bubble" | "selection";
};

export const algorithms: AlgorithmInfo[] = [
  {
    slug: "bubble-sort",
    name: "Bubble Sort",
    category: "Sorting",
    description: "Repeatedly compare neighboring values and swap them when they are out of order.",
    keywords: ["adjacent", "comparison", "stable", "in-place", "array", "sorting"],
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    explanation: "Bubble Sort makes repeated passes through the array. On each pass, adjacent values are compared and swapped when they are out of order, so the largest unsorted value moves to the end. This implementation stops after a fixed number of passes.",
    properties: "Stable · In-place",
    visualizer: "bubble",
  },
  {
    slug: "selection-sort",
    name: "Selection Sort",
    category: "Sorting",
    description: "Find the smallest remaining value and place it at the start of the unsorted region.",
    keywords: ["minimum", "comparison", "in-place", "array", "sorting"],
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    explanation: "Selection Sort divides the array into a sorted prefix and an unsorted suffix. For each position, it scans the remaining values for the minimum, swaps that value into place, and extends the sorted prefix. It performs quadratic comparisons and at most one swap per pass.",
    properties: "In-place · Usually unstable",
    visualizer: "selection",
  },
];

export function findAlgorithm(slug: string) {
  return algorithms.find((algorithm) => algorithm.slug === slug);
}
