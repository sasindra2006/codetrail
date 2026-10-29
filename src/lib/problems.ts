export type SampleCase = {
  name: string;
  input: string;
  expectedOutput: string;
};

export type InternalProblem = {
  kind?: "internal";
  slug: string;
  title: string;
  difficulty: "Easy";
  topics: string[];
  statement: string;
  constraints: string[];
  samples: SampleCase[];
  explanation: string;
  starterCode: string;
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

export function isExternalProblem(
  problem: WorkspaceProblem
): problem is ExternalProblem {
  return problem.kind === "codeforces";
}

export const internalProblems: InternalProblem[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topics: ["Arrays", "Hashing"],
    statement: "Given an array of integers and a target, find two different positions whose values add up to the target. Print the two positions using 1-based indexing. Exactly one pair exists.",
    constraints: ["2 ≤ n ≤ 100,000", "−1,000,000,000 ≤ values[i], target ≤ 1,000,000,000", "Exactly one valid pair exists."],
    samples: [
      { name: "Example 1", input: "4\n2 7 11 15\n9\n", expectedOutput: "1 2\n" },
      { name: "Example 2", input: "5\n3 2 4 1 6\n10\n", expectedOutput: "3 5\n" },
    ],
    explanation: "In the first example, the values at positions 1 and 2 sum to 9. In the second, 4 and 6 are at positions 3 and 5.",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> values(n);
    for (auto& value : values) cin >> value;
    long long target;
    cin >> target;

    // Find and print the two 1-based positions.
    return 0;
}`,
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
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> values(n);
    for (auto& value : values) cin >> value;

    // Compute and print the largest contiguous subarray sum.
    return 0;
}`,
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
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> values(n);
    for (int& value : values) cin >> value;

    // Find and print the absent value from 0 through n.
    return 0;
}`,
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
    starterCode: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string line;
    getline(cin, line);

    // Print the words in reverse order, separated by one space.
    return 0;
}`,
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
    starterCode: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string line;
    getline(cin, line);

    // Print YES if the cleaned line is a palindrome, otherwise NO.
    return 0;
}`,
  },
];

export function findInternalProblem(slug: string) {
  return internalProblems.find((problem) => problem.slug === slug);
}
