import "server-only";

import type { FunctionTestCase } from "@/lib/problems";
import { expandedArraySampleCases, expandedArraySubmissionCases } from "@/lib/expanded-array-problems";
import { expandedGraphSampleCases, expandedGraphSubmissionCases } from "@/lib/expanded-graph-execution";
import { expandedStructuralSampleCases, expandedStructuralSubmissionCases } from "@/lib/expanded-structural-execution";

const twoSumCases: FunctionTestCase[] = [
  {
    name: "Example 1",
    input: { kind: "two-sum", nums: [2, 7, 11, 15], target: 9 },
    expectedOutput: [0, 1],
    publicExampleIndex: 0,
  },
  {
    name: "Example 2",
    input: { kind: "two-sum", nums: [3, 2, 4, 1, 6], target: 10 },
    expectedOutput: [2, 4],
    publicExampleIndex: 1,
  },
  {
    name: "Additional case 1",
    input: { kind: "two-sum", nums: [3, 3], target: 6 },
    expectedOutput: [0, 1],
  },
  {
    name: "Additional case 2",
    input: { kind: "two-sum", nums: [-3, 4, 3, 90], target: 0 },
    expectedOutput: [0, 2],
  },
];

const maxSubarrayCases: FunctionTestCase[] = [
  { name: "Example 1", input: { kind: "number-array", nums: [-2, 1, -3, 4, -1, 2, 1, -5] }, expectedOutput: 6, publicExampleIndex: 0 },
  { name: "Example 2", input: { kind: "number-array", nums: [-7, -2, -5, -3] }, expectedOutput: -2, publicExampleIndex: 1 },
  { name: "Additional case 1", input: { kind: "number-array", nums: [5, 4, -1, 7, 8] }, expectedOutput: 23 },
  { name: "Additional case 2", input: { kind: "number-array", nums: [-2, -1] }, expectedOutput: -1 },
];

const missingNumberCases: FunctionTestCase[] = [
  { name: "Example 1", input: { kind: "number-array", nums: [3, 0, 1] }, expectedOutput: 2, publicExampleIndex: 0 },
  { name: "Example 2", input: { kind: "number-array", nums: [0, 1, 2, 3, 5] }, expectedOutput: 4, publicExampleIndex: 1 },
  { name: "Additional case 1", input: { kind: "number-array", nums: [1] }, expectedOutput: 0 },
  { name: "Additional case 2", input: { kind: "number-array", nums: [0, 1] }, expectedOutput: 2 },
];

const reverseWordsCases: FunctionTestCase[] = [
  { name: "Example 1", input: { kind: "string", value: "learn data structures" }, expectedOutput: "structures data learn", publicExampleIndex: 0 },
  { name: "Example 2", input: { kind: "string", value: "  code   every day  " }, expectedOutput: "day every code", publicExampleIndex: 1 },
  { name: "Additional case 1", input: { kind: "string", value: "single" }, expectedOutput: "single" },
  { name: "Additional case 2", input: { kind: "string", value: "  one   two three " }, expectedOutput: "three two one" },
];

const palindromeCases: FunctionTestCase[] = [
  { name: "Example 1", input: { kind: "string", value: "A man, a plan, a canal: Panama!" }, expectedOutput: true, publicExampleIndex: 0 },
  { name: "Example 2", input: { kind: "string", value: "CodeTrail" }, expectedOutput: false, publicExampleIndex: 1 },
  { name: "Additional case 1", input: { kind: "string", value: "race a car" }, expectedOutput: false },
  { name: "Additional case 2", input: { kind: "string", value: "No 'x' in Nixon" }, expectedOutput: true },
];

const maximumSingleTradeProfitCases: FunctionTestCase[] = [
  { name: "Prices rise after a low", input: { kind: "number-array", nums: [8, 2, 6, 1, 7] }, expectedOutput: 6, publicExampleIndex: 0 },
  { name: "No profitable trade", input: { kind: "number-array", nums: [9, 6, 4, 2] }, expectedOutput: 0, publicExampleIndex: 1 },
];
const maximumProductRangeCases: FunctionTestCase[] = [
  { name: "Negative values make a positive product", input: { kind: "number-array", nums: [2, -3, -4, 1] }, expectedOutput: 24, publicExampleIndex: 0 },
  { name: "Zero splits ranges", input: { kind: "number-array", nums: [-2, 0, -1] }, expectedOutput: 0, publicExampleIndex: 1 },
];
const longestConsecutiveRunCases: FunctionTestCase[] = [
  { name: "Unordered values", input: { kind: "number-array", nums: [14, 3, 8, 4, 2, 10] }, expectedOutput: 3, publicExampleIndex: 0 },
  { name: "Duplicates do not extend a run", input: { kind: "number-array", nums: [5, 5, 6, 9] }, expectedOutput: 2, publicExampleIndex: 1 },
];
const nonadjacentMaximumScoreCases: FunctionTestCase[] = [
  { name: "Alternating choices", input: { kind: "number-array", nums: [4, 1, 7, 3, 8] }, expectedOutput: 19, publicExampleIndex: 0 },
  { name: "Empty row", input: { kind: "number-array", nums: [] }, expectedOutput: 0, publicExampleIndex: 1 },
];
const strictMajorityValueCases: FunctionTestCase[] = [
  { name: "One value dominates", input: { kind: "number-array", nums: [4, 2, 4, 4, 1, 4, 4] }, expectedOutput: 4, publicExampleIndex: 0 },
  { name: "Negative majority", input: { kind: "number-array", nums: [-3, 2, -3] }, expectedOutput: -3, publicExampleIndex: 1 },
];

export function getFunctionTestCases(slug: string): FunctionTestCase[] | null {
  if (expandedArraySampleCases[slug]) return expandedArraySampleCases[slug];
  if (expandedGraphSampleCases[slug]) return expandedGraphSampleCases[slug];
  if (expandedStructuralSampleCases[slug]) return expandedStructuralSampleCases[slug];
  switch (slug) {
    case "two-sum": return twoSumCases;
    case "maximum-subarray-sum": return maxSubarrayCases;
    case "missing-number": return missingNumberCases;
    case "reverse-words": return reverseWordsCases;
    case "valid-palindrome": return palindromeCases;
    case "maximum-single-trade-profit": return maximumSingleTradeProfitCases;
    case "maximum-product-range": return maximumProductRangeCases;
    case "longest-consecutive-run": return longestConsecutiveRunCases;
    case "nonadjacent-maximum-score": return nonadjacentMaximumScoreCases;
    case "strict-majority-value": return strictMajorityValueCases;
    default: return null;
  }
}

const twoSumSubmissionCases: FunctionTestCase[] = [
  ...twoSumCases,
  { name: "Middle pair", input: { kind: "two-sum", nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] },
  { name: "Zero pair", input: { kind: "two-sum", nums: [0, 4, 3, 0], target: 0 }, expectedOutput: [0, 3] },
  { name: "Negative pair", input: { kind: "two-sum", nums: [-1, -2, -3, -4, -5], target: -8 }, expectedOutput: [2, 4] },
  { name: "Large array", input: { kind: "two-sum", nums: Array.from({ length: 5_000 }, (_, index) => index - 2_500), target: 4_997 }, expectedOutput: [4_998, 4_999] },
];

const maxSubarraySubmissionCases: FunctionTestCase[] = [
  ...maxSubarrayCases,
  { name: "Entire array", input: { kind: "number-array", nums: [1, 2, 3, 4] }, expectedOutput: 10 },
  { name: "Zero bridge", input: { kind: "number-array", nums: [0, -1, 0, 5, 0] }, expectedOutput: 5 },
  { name: "Single value", input: { kind: "number-array", nums: [7] }, expectedOutput: 7 },
  { name: "Large positive array", input: { kind: "number-array", nums: Array.from({ length: 10_000 }, () => 1) }, expectedOutput: 10_000 },
];

const missingNumberSubmissionCases: FunctionTestCase[] = [
  ...missingNumberCases,
  { name: "Missing zero", input: { kind: "number-array", nums: [1, 2, 3, 4] }, expectedOutput: 0 },
  { name: "Missing maximum", input: { kind: "number-array", nums: [0, 1, 2, 3] }, expectedOutput: 4 },
  { name: "Large range", input: { kind: "number-array", nums: Array.from({ length: 10_000 }, (_, index) => index) }, expectedOutput: 10_000 },
];

const largeReverseWordsInput = Array.from({ length: 900 }, (_, index) => `w${index}`).join(" ");
const reverseWordsSubmissionCases: FunctionTestCase[] = [
  ...reverseWordsCases,
  { name: "Repeated spaces", input: { kind: "string", value: "a  b   c" }, expectedOutput: "c b a" },
  { name: "Large line", input: { kind: "string", value: largeReverseWordsInput }, expectedOutput: largeReverseWordsInput.split(" ").reverse().join(" ") },
];

const palindromeSubmissionCases: FunctionTestCase[] = [
  ...palindromeCases,
  { name: "Empty string", input: { kind: "string", value: "" }, expectedOutput: true },
  { name: "Digits are significant", input: { kind: "string", value: "1a2" }, expectedOutput: false },
  { name: "Punctuation only", input: { kind: "string", value: "...!!!" }, expectedOutput: true },
  { name: "Large palindrome", input: { kind: "string", value: "a".repeat(100_000) }, expectedOutput: true },
];

const maximumSingleTradeProfitSubmissionCases: FunctionTestCase[] = [
  ...maximumSingleTradeProfitCases,
  { name: "One day", input: { kind: "number-array", nums: [5] }, expectedOutput: 0 },
  { name: "Repeated low then rise", input: { kind: "number-array", nums: [3, 3, 2, 2, 9] }, expectedOutput: 7 },
  { name: "Long sequence", input: { kind: "number-array", nums: Array.from({ length: 1_000 }, (_, i) => i < 999 ? 20_000 - i : 30_000) }, expectedOutput: 10_998 },
];
const maximumProductRangeSubmissionCases: FunctionTestCase[] = [
  ...maximumProductRangeCases,
  { name: "Single negative", input: { kind: "number-array", nums: [-7] }, expectedOutput: -7 },
  { name: "Two negatives", input: { kind: "number-array", nums: [-2, -5] }, expectedOutput: 10 },
  { name: "Negative sign flips maximum", input: { kind: "number-array", nums: [-2, 3, -4] }, expectedOutput: 24 },
  { name: "Zeros and negative tail", input: { kind: "number-array", nums: [0, -2, -3, 0, -4] }, expectedOutput: 6 },
];
const longestConsecutiveRunSubmissionCases: FunctionTestCase[] = [
  ...longestConsecutiveRunCases,
  { name: "Empty input", input: { kind: "number-array", nums: [] }, expectedOutput: 0 },
  { name: "Duplicate sequence", input: { kind: "number-array", nums: [1, 2, 0, 1] }, expectedOutput: 3 },
  { name: "Separated extremes", input: { kind: "number-array", nums: [-1_000_000_000, 1_000_000_000] }, expectedOutput: 1 },
  { name: "Long sequence", input: { kind: "number-array", nums: Array.from({ length: 2_000 }, (_, i) => 5_000 - i) }, expectedOutput: 2_000 },
];
const nonadjacentMaximumScoreSubmissionCases: FunctionTestCase[] = [
  ...nonadjacentMaximumScoreCases,
  { name: "One position", input: { kind: "number-array", nums: [6] }, expectedOutput: 6 },
  { name: "Take separated values", input: { kind: "number-array", nums: [2, 9, 3, 8] }, expectedOutput: 17 },
  { name: "All zero", input: { kind: "number-array", nums: [0, 0, 0] }, expectedOutput: 0 },
  { name: "Long row", input: { kind: "number-array", nums: Array.from({ length: 5_000 }, () => 1) }, expectedOutput: 2_500 },
];
const strictMajorityValueSubmissionCases: FunctionTestCase[] = [
  ...strictMajorityValueCases,
  { name: "All equal", input: { kind: "number-array", nums: [0, 0, 0, 0] }, expectedOutput: 0 },
  { name: "Majority at end", input: { kind: "number-array", nums: [1, 2, 3, 3, 3] }, expectedOutput: 3 },
  { name: "Negative majority", input: { kind: "number-array", nums: [-8, -8, 2, -8, 4] }, expectedOutput: -8 },
  { name: "Large majority", input: { kind: "number-array", nums: [...Array.from({ length: 4_000 }, (_, i) => i), ...Array.from({ length: 4_001 }, () => -1)] }, expectedOutput: -1 },
];

export function getSubmissionTestCases(slug: string): FunctionTestCase[] | null {
  if (expandedArraySubmissionCases[slug]) return expandedArraySubmissionCases[slug];
  if (expandedGraphSubmissionCases[slug]) return expandedGraphSubmissionCases[slug];
  if (expandedStructuralSubmissionCases[slug]) return expandedStructuralSubmissionCases[slug];
  switch (slug) {
    case "two-sum": return twoSumSubmissionCases;
    case "maximum-subarray-sum": return maxSubarraySubmissionCases;
    case "missing-number": return missingNumberSubmissionCases;
    case "reverse-words": return reverseWordsSubmissionCases;
    case "valid-palindrome": return palindromeSubmissionCases;
    case "maximum-single-trade-profit": return maximumSingleTradeProfitSubmissionCases;
    case "maximum-product-range": return maximumProductRangeSubmissionCases;
    case "longest-consecutive-run": return longestConsecutiveRunSubmissionCases;
    case "nonadjacent-maximum-score": return nonadjacentMaximumScoreSubmissionCases;
    case "strict-majority-value": return strictMajorityValueSubmissionCases;
    default: return null;
  }
}
