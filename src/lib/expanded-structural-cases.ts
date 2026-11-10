import type { FunctionTestCase } from "@/lib/problems";
import { expandedBacktrackingSeeds, expandedListSeeds, expandedTreeSeeds } from "@/lib/expanded-structural-public";

type Seed = (typeof expandedTreeSeeds)[number];
type Hidden = { values?: Array<number | null>; secondValues?: number[]; cycleAt?: number; k?: number; target?: number; expected?: number | boolean | number[] | number[][] };
const trees = new Set(expandedTreeSeeds.map((seed) => seed.slug));
const lists = new Set(expandedListSeeds.map((seed) => seed.slug));
const allSeeds = [...expandedTreeSeeds, ...expandedListSeeds, ...expandedBacktrackingSeeds] as Seed[];

const hidden: Record<string, Hidden[]> = {
  "tree-inorder-values": [{ values: [], expected: [] }, { values: [1, null, 2, 3], expected: [1, 3, 2] }],
  "tree-preorder-values": [{ values: [], expected: [] }, { values: [1, null, 2, 3], expected: [1, 2, 3] }],
  "tree-postorder-values": [{ values: [], expected: [] }, { values: [1, null, 2, 3], expected: [3, 2, 1] }],
  "binary-tree-maximum-depth": [{ values: [], expected: 0 }, { values: [1, 2, null, 3, null, 4], expected: 4 }],
  "binary-tree-minimum-depth": [{ values: [], expected: 0 }, { values: [1, 2, null, 3], expected: 3 }],
  "binary-tree-leaf-count": [{ values: [], expected: 0 }, { values: [7], expected: 1 }],
  "binary-tree-value-sum": [{ values: [], expected: 0 }, { values: [-4, -2, -7], expected: -13 }],
  "binary-tree-balanced-check": [{ values: [], expected: true }, { values: [1, 2, null, 3, null, 4], expected: false }],
  "validate-binary-search-tree": [{ values: [2, 1, 3], expected: true }, { values: [2, 2, 3], expected: false }],
  "bst-kth-smallest": [{ values: [2, 1, 3], k: 1, expected: 1 }, { values: [2, 1, 3], k: 3, expected: 3 }],
  "bst-search-value": [{ values: [8, 3, 10], target: 10, expected: true }, { values: [8, 3, 10], target: 9, expected: false }],
  "reverse-linked-list": [{ values: [], expected: [] }, { values: [1, 2], expected: [2, 1] }],
  "merge-sorted-linked-lists": [{ values: [], secondValues: [], expected: [] }, { values: [1, 2, 4], secondValues: [1, 3, 4], expected: [1, 1, 2, 3, 4, 4] }],
  "linked-list-middle-value": [{ values: [], expected: -1 }, { values: [1, 2, 3, 4], expected: 3 }],
  "linked-list-length": [{ values: [], expected: 0 }, { values: [1], expected: 1 }],
  "linked-list-cycle-check": [{ values: [], expected: false }, { values: [1], cycleAt: 0, expected: true }],
  "linked-list-cycle-entry": [{ values: [], expected: -1 }, { values: [1], cycleAt: 0, expected: 1 }],
  "linked-list-palindrome-check": [{ values: [], expected: true }, { values: [1, 2, 3], expected: false }],
  "remove-linked-list-value": [{ values: [2, 2, 2], target: 2, expected: [] }, { values: [1, 2, 3], target: 2, expected: [1, 3] }],
  "remove-nth-from-list-end": [{ values: [1], k: 1, expected: [] }, { values: [1, 2, 3], k: 1, expected: [1, 2] }],
  "rotate-linked-list": [{ values: [], k: 8, expected: [] }, { values: [1, 2, 3], k: 4, expected: [3, 1, 2] }],
  "array-subsets": [{ values: [], expected: [[]] }, { values: [-1, 2], expected: [[], [-1], [2], [-1, 2]] }],
  "unique-array-subsets": [{ values: [0, 0], expected: [[], [0], [0, 0]] }, { values: [-1, -1, 2], expected: [[], [-1], [-1, -1], [2], [-1, 2], [-1, -1, 2]] }],
  "choose-k-from-n": [{ values: [1, 1], expected: [[1]] }, { values: [3, 0], expected: [[]] }],
  "array-permutations": [{ values: [], expected: [[]] }, { values: [1, 2], expected: [[1, 2], [2, 1]] }],
  "unique-array-permutations": [{ values: [2, 2], expected: [[2, 2]] }, { values: [1, 1, 2], expected: [[1, 1, 2], [1, 2, 1], [2, 1, 1]] }],
  "combination-sum-reuse": [{ values: [], target: 0, expected: [[]] }, { values: [2, 3], target: 6, expected: [[2, 2, 2], [3, 3]] }],
  "combination-sum-single-use": [{ values: [], target: 0, expected: [[]] }, { values: [1, 2, 2], target: 4, expected: [[2, 2]] }],
  "balanced-parentheses-generation": [{ values: [0], target: 0, expected: [[]] }, { values: [2], target: 2, expected: [[1, 1, 2, 2], [1, 2, 1, 2]] }],
  "target-sum-sign-assignments": [{ values: [], target: 0, expected: [[]] }, { values: [1, 2], target: 1, expected: [[-1, 1]] }],
};

function buildInput(seed: Seed, values: readonly (number | null)[], overrides: Hidden): FunctionTestCase["input"] {
  const numbers = values.filter((value): value is number => value !== null);
  if (trees.has(seed.slug)) return { kind: "tree", levelOrder: [...values], ...(seed.k !== undefined || overrides.k !== undefined ? { k: overrides.k ?? seed.k } : {}), ...(seed.target !== undefined || overrides.target !== undefined ? { target: overrides.target ?? seed.target } : {}) };
  if (lists.has(seed.slug)) return { kind: "linked-list", values: numbers, ...(seed.secondValues || overrides.secondValues ? { secondValues: [...(overrides.secondValues ?? seed.secondValues ?? [])] } : {}), ...(seed.cycleAt !== undefined || overrides.cycleAt !== undefined ? { cycleAt: overrides.cycleAt ?? seed.cycleAt } : {}), ...(seed.k !== undefined || overrides.k !== undefined ? { k: overrides.k ?? seed.k } : {}), ...(seed.target !== undefined || overrides.target !== undefined ? { target: overrides.target ?? seed.target } : {}) };
  const target = seed.slug === "choose-k-from-n" ? overrides.target ?? numbers[1] : overrides.target ?? seed.target;
  return { kind: "backtracking", values: numbers, ...(target !== undefined ? { target } : {}), normalization: seed.normalization ?? "set-of-value-sets" };
}

function makeCase(seed: Seed, values: readonly (number | null)[], expected: unknown, name: string, overrides: Hidden = {}, publicExampleIndex?: number): FunctionTestCase {
  let normalizedExpected = expected;
  if (seed.normalization && Array.isArray(expected)) {
    const rows = (expected as number[][]).map((row) => seed.normalization === "set-of-value-sets" ? [...row].sort((a, b) => a - b) : [...row]);
    rows.sort((a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i += 1) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; });
    normalizedExpected = rows;
  }
  return { name, input: buildInput(seed, values, overrides), expectedOutput: normalizedExpected as FunctionTestCase["expectedOutput"], ...(publicExampleIndex === undefined ? {} : { publicExampleIndex }) };
}

export const expandedStructuralSampleCases: Record<string, FunctionTestCase[]> = Object.fromEntries(allSeeds.map((seed) => [seed.slug, [makeCase(seed, seed.values, seed.expected, "Example 1", {}, 0)]]));
export const expandedStructuralSubmissionCases: Record<string, FunctionTestCase[]> = Object.fromEntries(allSeeds.map((seed) => [seed.slug, [
  makeCase(seed, seed.values, seed.expected, "Example 1", {}, 0),
  ...hidden[seed.slug].map((test, index) => makeCase(seed, test.values ?? seed.values, test.expected, `Hidden case ${index + 1}`, test)),
]]));
