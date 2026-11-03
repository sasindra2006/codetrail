export type SampleCase = {
  name: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
};

export type SupportedLanguage = "cpp17" | "python3";
export type ExecutionMode = "stdio" | "function";
export type FunctionSignature = {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  returns: string;
};
export type FunctionTestInput =
  | { kind: "two-sum"; nums: number[]; target: number }
  | { kind: "number-array"; nums: number[] }
  | { kind: "string"; value: string };
export type FunctionExpectedOutput = number[] | number | string | boolean;
export type FunctionTestCase = {
  name: string;
  input: FunctionTestInput;
  expectedOutput: FunctionExpectedOutput;
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
  difficulty: "Easy";
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

export type ExternalProblem = {
  kind: "codeforces";
  contestId: number;
  index: string;
  title: string;
  rating: number | null;
  topics: string[];
  solvedCount: number | null;
  externalUrl: string;
  starterCode: string;
};

export type WorkspaceProblem = InternalProblem | ExternalProblem;

export type ProblemListingItem = {
  key: string;
  source: "internal" | "codeforces";
  title: string;
  href: string;
  difficulty: string | null;
  rating: number | null;
  topics: string[];
  problemId: string | null;
  solvedCount: number | null;
};

export function toInternalProblemListing(problem: InternalProblem): ProblemListingItem {
  return {
    key: `internal:${problem.slug}`,
    source: "internal",
    title: problem.title,
    href: `/problems/${encodeURIComponent(problem.slug)}`,
    difficulty: problem.difficulty,
    rating: null,
    topics: problem.topics,
    problemId: null,
    solvedCount: null,
  };
}

export function isExternalProblem(
  problem: WorkspaceProblem
): problem is ExternalProblem {
  return problem.kind === "codeforces";
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

export const internalProblems: InternalProblem[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
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
];

export function findInternalProblem(slug: string) {
  return internalProblems.find((problem) => problem.slug === slug);
}
