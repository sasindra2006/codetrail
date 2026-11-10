import { expandedArrayProblems } from "@/lib/expanded-array-public";
import { expandedGraphProblems } from "@/lib/expanded-graph-public";
import { expandedStructuralProblems } from "@/lib/expanded-structural-public";

export type SampleCase = {
  name: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
};

export type SupportedLanguage = "cpp17" | "python3";
export type ExercismAdapterId = "binary-search-index" | "integer-to-prime-list" | "string-to-bracket-balance" | "two-int-lists-to-relation" | "integer-base-reencoding" | "string-grid-transform-flower" | "string-grid-transform-minesweeper" | "domino-chain-check";
export type ExercismAdapterContract = {
  strategy?: "integer-base-reencoding" | "string-grid-transform" | "pair-list-predicate";
  pythonFunction: string;
  cppNamespace: string;
  cppFunction: string;
  cppStarter?: string;
  pythonConstants?: Partial<Record<"equal" | "sublist" | "superlist" | "unequal", string>>;
  cppEnumType?: string;
  cppEnumValues?: Partial<Record<"equal" | "sublist" | "superlist" | "unequal", string>>;
  pythonException?: string;
  cppException?: string;
  inputParameter?: string;
  cppInputType?: string;
  cppResultType?: string;
};
export type ExecutionMode = "stdio" | "function";
export type FunctionSignature = {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  returns: string;
};
export type FunctionTestInput =
  | { kind: "two-sum"; nums: number[]; target: number }
  | { kind: "number-array"; nums: number[] }
  | { kind: "integer"; value: number }
  | { kind: "binary-search"; nums: number[]; target: number }
  | { kind: "number-array-pair"; first: number[]; second: number[] }
  | { kind: "graph"; nodeCount: number; edges: number[][]; start: number; target?: number; directed: boolean }
  | { kind: "tree"; levelOrder: Array<number | null>; target?: number; k?: number }
  | { kind: "linked-list"; values: number[]; secondValues?: number[]; cycleAt?: number; target?: number; k?: number }
  | { kind: "backtracking"; values: number[]; target?: number; normalization: "set-of-value-sets" | "set-of-sequences" }
  | { kind: "string"; value: string }
  | { kind: "integer-base-reencoding"; inputBase: number; digits: number[]; outputBase: number }
  | { kind: "string-grid-transform"; inputParameter: string; rows: string[] }
  | { kind: "domino-chain-check"; dominoes: number[][] };
export type FunctionExpectedOutput = number[] | string[] | number[][] | string[][] | number | string | boolean | null;
export type FunctionTestCase = {
  name: string;
  input: FunctionTestInput;
  expectedOutput: FunctionExpectedOutput;
  expectedException?: "value-not-found" | "invalid-argument";
  publicExampleIndex?: number;
};

export type ProblemContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "code"; code: string; language?: string }
  | { type: "math"; latex: string }
  | { type: "image"; src: string; alt: string; caption?: string };

export type ProblemSection = {
  title: "Description" | "Input" | "Output" | "Constraints" | "Notes" | "Explanation" | string;
  content: ProblemContentBlock[];
};

export type InternalProblem = {
  kind?: "internal";
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  complexity?: { time: string; space: string };
  topics: string[];
  statement: string;
  sections?: ProblemSection[];
  constraints: string[];
  samples: SampleCase[];
  explanation: string;
  starterCode: string;
  executionMode?: ExecutionMode;
  supportedLanguages?: SupportedLanguage[];
  languageStarters?: Partial<Record<SupportedLanguage, string>>;
  functionSignature?: FunctionSignature;
};

export type ExercismTrackMetadata = {
  track: "python" | "xcpp";
  exerciseUuid: string;
  difficulty: number | null;
  concepts: string[];
  authors: string[];
  contributors: string[];
  sourceUrl: string;
};

export type ExercismProblem = {
  kind: "exercism";
  adapterId: ExercismAdapterId;
  slug: string;
  exerciseSlug: string;
  title: string;
  statement: string;
  constraints: string[];
  samples: SampleCase[];
  explanation: string;
  topics: string[];
  difficulty: null;
  executionMode: "function";
  supportedLanguages: SupportedLanguage[];
  languageStarters: Partial<Record<SupportedLanguage, string>>;
  trackMetadata: Partial<Record<SupportedLanguage, ExercismTrackMetadata>>;
  sourceName: string;
  sourceUrl: string;
  statementLicense: "MIT" | "CC BY-SA 4.0";
  statementLicenseUrl: string;
  statementChanges: string;
  exerciseLicense: "MIT";
  exerciseLicenseUrls: string[];
  exerciseLicenseNotices: Partial<Record<SupportedLanguage, string>>;
  testDataLicense: "MIT";
  testDataLicenseUrl: string;
  testDataSourceUrl: string;
  testDataLicenseNotice: string;
};

export type WorkspaceProblem = InternalProblem | ExercismProblem;

export type ProblemListingItem = {
  key: string;
  source: "internal" | "exercism";
  title: string;
  href: string;
  difficulty: string | null;
  trackDifficulties?: Partial<Record<SupportedLanguage, number | null>>;
  languages: SupportedLanguage[];
  topics: string[];
  problemId: string | null;
};

export function toInternalProblemListing(problem: InternalProblem): ProblemListingItem {
  return {
    key: `internal:${problem.slug}`,
    source: "internal",
    title: problem.title,
    href: `/problems/${encodeURIComponent(problem.slug)}`,
    difficulty: problem.difficulty,
    languages: problem.supportedLanguages ?? ["cpp17"],
    topics: problem.topics,
    problemId: null,
  };
}

export function isExercismProblem(
  problem: WorkspaceProblem
): problem is ExercismProblem {
  return problem.kind === "exercism";
}

const twoSumCppStarter = `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
    }
};`;

const twoSumPythonStarter = `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Your code here
        pass`;

const maxSubarrayCppStarter = `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Your code here
    }
};`;

const maxSubarrayPythonStarter = `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        # Your code here
        pass`;

const missingNumberCppStarter = `class Solution {
public:
    int missingNumber(vector<int>& nums) {
        // Your code here
    }
};`;

const missingNumberPythonStarter = `class Solution:
    def missingNumber(self, nums: list[int]) -> int:
        # Your code here
        pass`;

const reverseWordsCppStarter = `class Solution {
public:
    string reverseWords(string s) {
        // Your code here
    }
};`;

const reverseWordsPythonStarter = `class Solution:
    def reverseWords(self, s: str) -> str:
        # Your code here
        pass`;

const palindromeCppStarter = `class Solution {
public:
    bool isPalindrome(string s) {
        // Your code here
    }
};`;

const palindromePythonStarter = `class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Your code here
        pass`;

const maxStockProfitCppStarter = `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Your code here
    }
};`;
const maxStockProfitPythonStarter = `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        # Your code here
        pass`;
const maxProductSubarrayCppStarter = `class Solution {
public:
    long long maxProduct(vector<int>& nums) {
        // Your code here
    }
};`;
const maxProductSubarrayPythonStarter = `class Solution:
    def maxProduct(self, nums: list[int]) -> int:
        # Your code here
        pass`;
const longestConsecutiveCppStarter = `class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        // Your code here
    }
};`;
const longestConsecutivePythonStarter = `class Solution:
    def longestConsecutive(self, nums: list[int]) -> int:
        # Your code here
        pass`;
const houseRobberCppStarter = `class Solution {
public:
    int rob(vector<int>& values) {
        // Your code here
    }
};`;
const houseRobberPythonStarter = `class Solution:
    def rob(self, values: list[int]) -> int:
        # Your code here
        pass`;
const majorityElementCppStarter = `class Solution {
public:
    int majorityElement(vector<int>& nums) {
        // Your code here
    }
};`;
const majorityElementPythonStarter = `class Solution:
    def majorityElement(self, nums: list[int]) -> int:
        # Your code here
        pass`;

export const internalProblems: InternalProblem[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    complexity: { time: "O(n)", space: "O(n)" },
    topics: ["Arrays", "Hashing"],
    statement: "Given an array of integers and a target, return the indices of two different values that add up to the target. Return zero-based indices. Exactly one pair exists.",
    constraints: ["2 ≤ n ≤ 100,000", "−1,000,000,000 ≤ values[i], target ≤ 1,000,000,000", "Exactly one valid pair exists."],
    samples: [
      { name: "Example 1", input: "nums = [2, 7, 11, 15], target = 9", expectedOutput: "[0, 1]" },
      { name: "Example 2", input: "nums = [3, 2, 4, 1, 6], target = 10", expectedOutput: "[2, 4]" },
    ],
    explanation: "In the first example, the values at indices 0 and 1 sum to 9. In the second, the values at indices 2 and 4 sum to 10.",
    starterCode: twoSumCppStarter,
    executionMode: "function",
    supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: twoSumCppStarter, python3: twoSumPythonStarter },
    functionSignature: {
      name: "twoSum",
      parameters: [{ name: "nums", type: "int[]" }, { name: "target", type: "int" }],
      returns: "int[]",
    },
  },
  {
    slug: "maximum-subarray-sum",
    title: "Maximum Subarray Sum",
    difficulty: "Easy",
    complexity: { time: "O(n)", space: "O(1)" },
    topics: ["Arrays", "Dynamic Programming"],
    statement: "Given a non-empty array of integers, find the largest possible sum of a contiguous, non-empty subarray. Print that sum.",
    constraints: ["1 ≤ n ≤ 200,000", "−10,000 ≤ values[i] ≤ 10,000"],
    samples: [
      { name: "Example 1", input: "8\n-2 1 -3 4 -1 2 1 -5\n", expectedOutput: "6\n" },
      { name: "Example 2", input: "4\n-7 -2 -5 -3\n", expectedOutput: "-2\n" },
    ],
    explanation: "The subarray [4, -1, 2, 1] has sum 6 in the first example. When all values are negative, the best non-empty subarray contains the largest value, -2.",
    starterCode: maxSubarrayCppStarter,
    executionMode: "function",
    supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: maxSubarrayCppStarter, python3: maxSubarrayPythonStarter },
    functionSignature: {
      name: "maxSubArray",
      parameters: [{ name: "nums", type: "int[]" }],
      returns: "int",
    },
  },
  {
    slug: "missing-number",
    title: "Missing Number",
    difficulty: "Easy",
    complexity: { time: "O(n)", space: "O(1)" },
    topics: ["Arrays", "Math"],
    statement: "An array contains n distinct integers chosen from 0 through n. One number in that range is absent. Print the missing number.",
    constraints: ["1 ≤ n ≤ 200,000", "0 ≤ values[i] ≤ n", "All input values are distinct."],
    samples: [
      { name: "Example 1", input: "3\n3 0 1\n", expectedOutput: "2\n" },
      { name: "Example 2", input: "5\n0 1 2 3 5\n", expectedOutput: "4\n" },
    ],
    explanation: "The complete range is 0 through n. The first input omits 2; the second omits 4.",
    starterCode: missingNumberCppStarter,
    executionMode: "function",
    supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: missingNumberCppStarter, python3: missingNumberPythonStarter },
    functionSignature: {
      name: "missingNumber",
      parameters: [{ name: "nums", type: "int[]" }],
      returns: "int",
    },
  },
  {
    slug: "reverse-words",
    title: "Reverse the Words",
    difficulty: "Easy",
    complexity: { time: "O(n)", space: "O(n)" },
    topics: ["Strings", "Arrays"],
    statement: "Read one line containing words separated by spaces. Print the words in reverse order, separated by one space. Ignore leading, trailing, and repeated spaces in the input.",
    constraints: ["The line contains at least one word.", "The line has at most 10,000 characters.", "Each word contains only English letters or digits."],
    samples: [
      { name: "Example 1", input: "learn data structures\n", expectedOutput: "structures data learn\n" },
      { name: "Example 2", input: "  code   every day  \n", expectedOutput: "day every code\n" },
    ],
    explanation: "Split the line into its words, then emit them from last to first with a single space between neighbors.",
    starterCode: reverseWordsCppStarter,
    executionMode: "function",
    supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: reverseWordsCppStarter, python3: reverseWordsPythonStarter },
    functionSignature: {
      name: "reverseWords",
      parameters: [{ name: "s", type: "string" }],
      returns: "string",
    },
  },
  {
    slug: "valid-palindrome",
    title: "Clean Palindrome",
    difficulty: "Easy",
    complexity: { time: "O(n)", space: "O(n)" },
    topics: ["Strings", "Two Pointers"],
    statement: "Determine whether a line is a palindrome after ignoring spaces and punctuation and treating uppercase and lowercase English letters as equal. Digits remain significant. Print YES or NO.",
    constraints: ["The line has at most 100,000 characters.", "Input contains printable ASCII characters."],
    samples: [
      { name: "Example 1", input: "A man, a plan, a canal: Panama!\n", expectedOutput: "YES\n" },
      { name: "Example 2", input: "CodeTrail\n", expectedOutput: "NO\n" },
    ],
    explanation: "After filtering and case folding, the first line reads the same from both directions. The second does not.",
    starterCode: palindromeCppStarter,
    executionMode: "function",
    supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: palindromeCppStarter, python3: palindromePythonStarter },
    functionSignature: {
      name: "isPalindrome",
      parameters: [{ name: "s", type: "string" }],
      returns: "bool",
    },
  },
  {
    slug: "maximum-single-trade-profit",
    title: "Maximum Single-Trade Profit",
    difficulty: "Easy",
    complexity: { time: "O(n)", space: "O(1)" },
    topics: ["Arrays", "Greedy"],
    statement: "A market record lists the price of one share at the end of each day. Choose one day to buy and a later day to sell, or make no trade. Return the greatest profit possible.",
    constraints: ["1 ≤ prices.length ≤ 100,000", "0 ≤ prices[i] ≤ 1,000,000"],
    samples: [
      { name: "Prices rise after a low", input: "prices = [8, 2, 6, 1, 7]", expectedOutput: "6", explanation: "Buy at 1 and sell later at 7." },
      { name: "No profitable trade", input: "prices = [9, 6, 4, 2]", expectedOutput: "0", explanation: "Prices only fall, so making no trade is best." },
    ],
    explanation: "Track the lowest price seen before each day and compare selling that day against the best profit so far.",
    starterCode: maxStockProfitCppStarter,
    executionMode: "function", supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: maxStockProfitCppStarter, python3: maxStockProfitPythonStarter },
    functionSignature: { name: "maxProfit", parameters: [{ name: "prices", type: "int[]" }], returns: "int" },
  },
  {
    slug: "maximum-product-range",
    title: "Maximum Product Range",
    difficulty: "Medium",
    complexity: { time: "O(n)", space: "O(1)" },
    topics: ["Arrays", "Dynamic Programming"],
    statement: "Given a non-empty integer sequence, return the largest product of any contiguous, non-empty range. Every such product fits within the stated exact-integer bound.",
    constraints: ["1 ≤ nums.length ≤ 20,000", "−10 ≤ nums[i] ≤ 10", "The product of every contiguous range has magnitude at most 9,007,199,254,740,991."],
    samples: [
      { name: "Negative values make a positive product", input: "nums = [2, -3, -4, 1]", expectedOutput: "24", explanation: "The range [2, -3, -4] has product 24." },
      { name: "Zero splits ranges", input: "nums = [-2, 0, -1]", expectedOutput: "0", explanation: "The best non-empty range is the single value 0." },
    ],
    explanation: "A negative value swaps which ending product is largest and smallest, so track both at every position.",
    starterCode: maxProductSubarrayCppStarter,
    executionMode: "function", supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: maxProductSubarrayCppStarter, python3: maxProductSubarrayPythonStarter },
    functionSignature: { name: "maxProduct", parameters: [{ name: "nums", type: "int[]" }], returns: "long long" },
  },
  {
    slug: "longest-consecutive-run",
    title: "Longest Consecutive Run",
    difficulty: "Medium",
    complexity: { time: "O(n) average", space: "O(n)" },
    topics: ["Arrays", "Hashing"],
    statement: "Return the length of the longest set of consecutive integer values present in the input. Values may appear more than once, and the run need not follow the input order.",
    constraints: ["0 ≤ nums.length ≤ 100,000", "−1,000,000,000 ≤ nums[i] ≤ 1,000,000,000"],
    samples: [
      { name: "Unordered values", input: "nums = [14, 3, 8, 4, 2, 10]", expectedOutput: "3", explanation: "The longest run is 2, 3, 4." },
      { name: "Duplicates do not extend a run", input: "nums = [5, 5, 6, 9]", expectedOutput: "2", explanation: "The distinct consecutive run 5, 6 has length 2." },
    ],
    explanation: "Begin a run only at values whose predecessor is absent, then count forward through the set.",
    starterCode: longestConsecutiveCppStarter,
    executionMode: "function", supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: longestConsecutiveCppStarter, python3: longestConsecutivePythonStarter },
    functionSignature: { name: "longestConsecutive", parameters: [{ name: "nums", type: "int[]" }], returns: "int" },
  },
  {
    slug: "nonadjacent-maximum-score",
    title: "Nonadjacent Maximum Score",
    difficulty: "Medium",
    complexity: { time: "O(n)", space: "O(1)" },
    topics: ["Arrays", "Dynamic Programming"],
    statement: "Each position in a row contains a non-negative score. Choose positions so that no two chosen positions are adjacent, and return the largest achievable total. Choosing no positions is allowed.",
    constraints: ["0 ≤ values.length ≤ 100,000", "0 ≤ values[i] ≤ 10,000"],
    samples: [
      { name: "Alternating choices", input: "values = [4, 1, 7, 3, 8]", expectedOutput: "19", explanation: "Choose 4, 7, and 8 for a total of 19." },
      { name: "Empty row", input: "values = []", expectedOutput: "0", explanation: "With no positions, the total is zero." },
    ],
    explanation: "At each position, compare skipping it with taking its value plus the best total two positions earlier.",
    starterCode: houseRobberCppStarter,
    executionMode: "function", supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: houseRobberCppStarter, python3: houseRobberPythonStarter },
    functionSignature: { name: "rob", parameters: [{ name: "values", type: "int[]" }], returns: "int" },
  },
  {
    slug: "strict-majority-value",
    title: "Strict Majority Value",
    difficulty: "Easy",
    complexity: { time: "O(n)", space: "O(1)" },
    topics: ["Arrays", "Hashing"],
    statement: "The input is guaranteed to contain one value occurring more than half the time. Return that value.",
    constraints: ["1 ≤ nums.length ≤ 100,000", "−1,000,000 ≤ nums[i] ≤ 1,000,000", "A value occurs in more than nums.length / 2 positions."],
    samples: [
      { name: "One value dominates", input: "nums = [4, 2, 4, 4, 1, 4, 4]", expectedOutput: "4", explanation: "Four appears five times, more than half of seven entries." },
      { name: "Negative majority", input: "nums = [-3, 2, -3]", expectedOutput: "-3", explanation: "Negative three occurs twice out of three." },
    ],
    explanation: "A majority candidate can be found in linear time with constant extra space by canceling unequal pairs.",
    starterCode: majorityElementCppStarter,
    executionMode: "function", supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: majorityElementCppStarter, python3: majorityElementPythonStarter },
    functionSignature: { name: "majorityElement", parameters: [{ name: "nums", type: "int[]" }], returns: "int" },
  },
  ...expandedArrayProblems,
  ...expandedGraphProblems,
  ...expandedStructuralProblems,
];

export function findInternalProblem(slug: string) {
  return internalProblems.find((problem) => problem.slug === slug);
}
