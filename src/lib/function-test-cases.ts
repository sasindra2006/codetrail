import "server-only";

import type { FunctionTestCase } from "@/lib/problems";

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

export function getFunctionTestCases(slug: string): FunctionTestCase[] | null {
  switch (slug) {
    case "two-sum": return twoSumCases;
    case "maximum-subarray-sum": return maxSubarrayCases;
    case "missing-number": return missingNumberCases;
    case "reverse-words": return reverseWordsCases;
    case "valid-palindrome": return palindromeCases;
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

export function getSubmissionTestCases(slug: string): FunctionTestCase[] | null {
  switch (slug) {
    case "two-sum": return twoSumSubmissionCases;
    case "maximum-subarray-sum": return maxSubarraySubmissionCases;
    case "missing-number": return missingNumberSubmissionCases;
    case "reverse-words": return reverseWordsSubmissionCases;
    case "valid-palindrome": return palindromeSubmissionCases;
    default: return null;
  }
}
