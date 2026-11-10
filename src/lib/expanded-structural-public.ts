import type { InternalProblem } from "@/lib/problems";

const treeDefinitions = [
  { slug: "tree-inorder-values", title: "Binary Tree Inorder Values", difficulty: "Easy", topics: ["Trees", "Depth-First Search"], method: "inorderTraversal", result: "int[]", statement: "Given the level-order representation of a binary tree, return its values in inorder: left subtree, node, right subtree.", values: [1, null, 2, 3], expected: [1, 3, 2], extra: [[null], []], complexity: ["O(n)", "O(h)"] },
  { slug: "tree-preorder-values", title: "Binary Tree Preorder Values", difficulty: "Easy", topics: ["Trees", "Depth-First Search"], method: "preorderTraversal", result: "int[]", statement: "Return the values of a binary tree in preorder: node, left subtree, right subtree.", values: [1, 2, 3, null, 4], expected: [1, 2, 4, 3], extra: [[null], []], complexity: ["O(n)", "O(h)"] },
  { slug: "tree-postorder-values", title: "Binary Tree Postorder Values", difficulty: "Easy", topics: ["Trees", "Depth-First Search"], method: "postorderTraversal", result: "int[]", statement: "Return the values of a binary tree in postorder: left subtree, right subtree, node.", values: [1, 2, 3, 4, 5], expected: [4, 5, 2, 3, 1], extra: [[null], []], complexity: ["O(n)", "O(h)"] },
  { slug: "binary-tree-maximum-depth", title: "Binary Tree Maximum Depth", difficulty: "Easy", topics: ["Trees", "Depth-First Search"], method: "maxDepth", result: "int", statement: "Return the number of nodes on the longest path from the root to any leaf. An empty tree has depth zero.", values: [3, 9, 20, null, null, 15, 7], expected: 3, extra: [[null], [], [1, 2, null, 3, null, 4]], complexity: ["O(n)", "O(h)"] },
  { slug: "binary-tree-minimum-depth", title: "Binary Tree Minimum Depth", difficulty: "Easy", topics: ["Trees", "Breadth-First Search"], method: "minDepth", result: "int", statement: "Return the number of nodes on the shortest root-to-leaf path. A node with only one child is not a leaf.", values: [1, 2, 3, 4, null, null, 5], expected: 3, extra: [[null], [], [1, 2, null, 3]], complexity: ["O(n)", "O(n)"] },
  { slug: "binary-tree-leaf-count", title: "Binary Tree Leaf Count", difficulty: "Easy", topics: ["Trees", "Depth-First Search"], method: "countLeaves", result: "int", statement: "Count the leaf nodes in a binary tree. The empty tree contains zero leaves.", values: [1, 2, 3, 4, 5], expected: 3, extra: [[null], [], [7]], complexity: ["O(n)", "O(h)"] },
  { slug: "binary-tree-value-sum", title: "Binary Tree Value Sum", difficulty: "Easy", topics: ["Trees", "Depth-First Search"], method: "sumTree", result: "long long", statement: "Return the sum of every node value in a binary tree. The empty tree has sum zero.", values: [5, 2, 9, null, 3], expected: 19, extra: [[null], [], [-4, -2, -7]], complexity: ["O(n)", "O(h)"] },
  { slug: "binary-tree-balanced-check", title: "Height-Balanced Binary Tree", difficulty: "Medium", topics: ["Trees", "Depth-First Search"], method: "isBalanced", result: "bool", statement: "A binary tree is height-balanced when, at every node, the heights of its left and right subtrees differ by at most one. Determine whether the tree is balanced.", values: [3, 9, 20, null, null, 15, 7], expected: true, extra: [[null], [], [1, 2, null, 3, null, 4]], complexity: ["O(n)", "O(h)"] },
  { slug: "validate-binary-search-tree", title: "Validate a Binary Search Tree", difficulty: "Medium", topics: ["Trees", "Binary Search Tree"], method: "isValidBST", result: "bool", statement: "Determine whether every node in the binary tree obeys strict BST ordering: all values in its left subtree are smaller and all values in its right subtree are larger.", values: [5, 1, 4, null, null, 3, 6], expected: false, extra: [[2, 1, 3], [2, 2, 3], [null]], complexity: ["O(n)", "O(h)"] },
  { slug: "bst-kth-smallest", title: "Kth Smallest BST Value", difficulty: "Medium", topics: ["Trees", "Binary Search Tree", "Depth-First Search"], method: "kthSmallest", result: "int", parameter: "k", statement: "Given a BST with distinct values and a valid one-based rank k, return its kth smallest value.", values: [5, 3, 7, 2, 4, 6, 8], k: 4, expected: 5, extra: [[1, 0, 2]], complexity: ["O(h + k)", "O(h)"] },
  { slug: "bst-search-value", title: "Search a Binary Search Tree", difficulty: "Easy", topics: ["Trees", "Binary Search Tree"], method: "searchBST", result: "bool", parameter: "target", statement: "Determine whether target occurs in a BST with distinct values.", values: [8, 3, 10, 1, 6, null, 14], target: 6, expected: true, extra: [[8, 3, 10], [null], []], complexity: ["O(h)", "O(1)"] },
] as const;

const listDefinitions = [
  { slug: "reverse-linked-list", title: "Reverse a Linked List", difficulty: "Easy", topics: ["Linked Lists"], method: "reverseList", result: "int[]", values: [1, 2, 3, 4], expected: [4, 3, 2, 1], extra: [[], [8], [1, 2]], statement: "Reverse a singly linked list and return the new head.", complexity: ["O(n)", "O(1)"] },
  { slug: "merge-sorted-linked-lists", title: "Merge Two Sorted Linked Lists", difficulty: "Easy", topics: ["Linked Lists", "Recursion"], method: "mergeTwoLists", result: "int[]", values: [1, 3, 5], secondValues: [1, 2, 6], expected: [1, 1, 2, 3, 5, 6], extra: [[], [4], [1, 2]], statement: "Merge two non-decreasing singly linked lists into one non-decreasing list, reusing their nodes.", complexity: ["O(n + m)", "O(1)"] },
  { slug: "linked-list-middle-value", title: "Linked List Middle Value", difficulty: "Easy", topics: ["Linked Lists", "Two Pointers"], method: "middleValue", result: "int", values: [1, 2, 3, 4, 5, 6], expected: 4, extra: [[], [9], [1, 2, 3, 4]], statement: "Return the value at the middle position, choosing the second middle when the list length is even. Return -1 for an empty list.", complexity: ["O(n)", "O(1)"] },
  { slug: "linked-list-length", title: "Linked List Length", difficulty: "Easy", topics: ["Linked Lists"], method: "listLength", result: "int", values: [4, 1, 7], expected: 3, extra: [[], [1], Array.from({ length: 1000 }, (_, i) => i)], statement: "Return the number of nodes in an acyclic singly linked list.", complexity: ["O(n)", "O(1)"] },
  { slug: "linked-list-cycle-check", title: "Linked List Cycle Check", difficulty: "Easy", topics: ["Linked Lists", "Two Pointers"], method: "hasCycle", result: "bool", values: [3, 2, 0, -4], cycleAt: 1, expected: true, extra: [[], [1], [1, 2, 3]], statement: "Determine whether following next pointers in a singly linked list eventually revisits a node. cycleAt is the zero-based index joined by the final node, or -1 when no cycle exists.", complexity: ["O(n)", "O(1)"] },
  { slug: "linked-list-cycle-entry", title: "Linked List Cycle Entry", difficulty: "Medium", topics: ["Linked Lists", "Two Pointers"], method: "cycleEntryValue", result: "int", values: [3, 2, 0, -4], cycleAt: 1, expected: 2, extra: [[], [1], [1, 2, 3]], statement: "Return the value at the first node of a cycle, or -1 when the list has no cycle. cycleAt specifies the cycle's entry index, or -1 for no cycle.", complexity: ["O(n)", "O(1)"] },
  { slug: "linked-list-palindrome-check", title: "Linked List Palindrome Check", difficulty: "Easy", topics: ["Linked Lists", "Two Pointers"], method: "isListPalindrome", result: "bool", values: [1, 2, 2, 1], expected: true, extra: [[], [1], [1, 2, 3]], statement: "Determine whether the sequence of values in a singly linked list is a palindrome. The empty list is a palindrome.", complexity: ["O(n)", "O(1)"] },
  { slug: "remove-linked-list-value", title: "Remove Value from Linked List", difficulty: "Easy", topics: ["Linked Lists"], method: "removeValue", result: "int[]", values: [1, 2, 6, 3, 4, 5, 6], target: 6, expected: [1, 2, 3, 4, 5], extra: [[], [2, 2, 2], [1, 2, 3]], statement: "Remove every node whose value equals target and return the resulting list.", complexity: ["O(n)", "O(1)"] },
  { slug: "remove-nth-from-list-end", title: "Remove Nth Node from List End", difficulty: "Medium", topics: ["Linked Lists", "Two Pointers"], method: "removeNthFromEnd", result: "int[]", values: [1, 2, 3, 4, 5], k: 2, expected: [1, 2, 3, 5], extra: [[], [1], [1, 2, 3]], statement: "Given a valid one-based n from the end, remove that node and return the list head.", complexity: ["O(n)", "O(1)"] },
  { slug: "rotate-linked-list", title: "Rotate Linked List Right", difficulty: "Medium", topics: ["Linked Lists", "Two Pointers"], method: "rotateRight", result: "int[]", values: [1, 2, 3, 4, 5], k: 2, expected: [4, 5, 1, 2, 3], extra: [[], [1], [1, 2, 3]], statement: "Rotate a singly linked list right by non-negative k positions. Rotations larger than the list length wrap around.", complexity: ["O(n)", "O(1)"] },
] as const;

const backtrackingDefinitions = [
  { slug: "array-subsets", title: "Generate Array Subsets", difficulty: "Medium", topics: ["Recursion", "Backtracking"], method: "subsets", normalization: "set-of-value-sets" as const, values: [1, 2, 3], expected: [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]], target: 0, statement: "Return every subset of the input's distinct integers exactly once. The empty subset is included.", complexity: ["O(n · 2^n)", "O(n · 2^n)"] },
  { slug: "unique-array-subsets", title: "Unique Subsets with Duplicates", difficulty: "Medium", topics: ["Recursion", "Backtracking", "Sorting"], method: "subsetsWithDuplicates", normalization: "set-of-value-sets" as const, values: [1, 2, 2], expected: [[], [1], [2], [1, 2], [2, 2], [1, 2, 2]], target: 0, statement: "Return every distinct subset of a multiset of integers exactly once, including the empty subset.", complexity: ["O(n · 2^n)", "O(n · 2^n)"] },
  { slug: "choose-k-from-n", title: "Choose K Values from One to N", difficulty: "Medium", topics: ["Recursion", "Backtracking"], method: "combinations", normalization: "set-of-value-sets" as const, values: [4, 2], expected: [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]], target: 0, statement: "Return all ways to choose k distinct values from the integers 1 through n. Each result is in ascending order.", complexity: ["O(k · C(n,k))", "O(k)"] },
  { slug: "array-permutations", title: "Generate Array Permutations", difficulty: "Medium", topics: ["Recursion", "Backtracking"], method: "permute", normalization: "set-of-sequences" as const, values: [1, 2, 3], expected: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]], target: 0, statement: "Return all permutations of the input's distinct integers. The order of returned permutations is not significant, but order within a permutation is significant.", complexity: ["O(n · n!)", "O(n · n!)"] },
  { slug: "unique-array-permutations", title: "Unique Permutations with Duplicates", difficulty: "Medium", topics: ["Recursion", "Backtracking", "Sorting"], method: "permuteUnique", normalization: "set-of-sequences" as const, values: [1, 1, 2], expected: [[1, 1, 2], [1, 2, 1], [2, 1, 1]], target: 0, statement: "Return each distinct permutation of a multiset exactly once. The order of returned permutations is not significant.", complexity: ["O(n · n!)", "O(n · n!)"] },
  { slug: "combination-sum-reuse", title: "Combination Sum with Reuse", difficulty: "Medium", topics: ["Recursion", "Backtracking"], method: "combinationSum", normalization: "set-of-value-sets" as const, values: [2, 3, 6, 7], expected: [[2, 2, 3], [7]], target: 7, statement: "Return all unique combinations of positive candidate values that sum to target. A candidate may be used repeatedly; each combination is returned in nondecreasing order.", complexity: ["Output-sensitive", "O(target / minCandidate)"] },
  { slug: "combination-sum-single-use", title: "Combination Sum with Single Use", difficulty: "Medium", topics: ["Recursion", "Backtracking", "Sorting"], method: "combinationSumOnce", normalization: "set-of-value-sets" as const, values: [10, 1, 2, 7, 6, 1, 5, 8], expected: [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6], [8]], target: 8, statement: "Return distinct combinations that sum to target. Each array position can be selected at most once, even when values repeat.", complexity: ["O(2^n)", "O(n)"] },
  { slug: "balanced-parentheses-generation", title: "Generate Balanced Parentheses", difficulty: "Medium", topics: ["Recursion", "Backtracking", "Strings"], method: "generateParentheses", normalization: "set-of-sequences" as const, values: [3], expected: [[1, 1, 1, 2, 2, 2], [1, 1, 2, 1, 2, 2], [1, 1, 2, 2, 1, 2], [1, 2, 1, 1, 2, 2], [1, 2, 1, 2, 1, 2]], target: 3, statement: "Generate every well-formed sequence containing n opening and n closing parentheses. For this integer-array interface, encode '(' as 1 and ')' as 2.", complexity: ["O(C_n · n)", "O(n)"] },
  { slug: "target-sum-sign-assignments", title: "Target Sum Sign Assignments", difficulty: "Medium", topics: ["Recursion", "Backtracking", "Dynamic Programming"], method: "targetSumWays", normalization: "set-of-sequences" as const, values: [1, 1, 1, 1, 1], expected: [[1, 1, 1, 1, -1], [1, 1, 1, -1, 1], [1, 1, -1, 1, 1], [1, -1, 1, 1, 1], [-1, 1, 1, 1, 1]], target: 3, statement: "Assign either plus or minus to each value and return every sign sequence whose signed sum equals target. Each output position is 1 for plus and -1 for minus.", complexity: ["O(2^n)", "O(n)"] },
] as const;

type StructuralDefinition = {
  slug: string; title: string; difficulty: "Easy" | "Medium" | "Hard"; topics: readonly string[]; method: string;
  result?: string; parameter?: string; values: readonly (number | null)[]; secondValues?: readonly number[]; cycleAt?: number;
  k?: number; target?: number; expected: number | boolean | readonly number[] | readonly (readonly number[])[];
  normalization?: "set-of-value-sets" | "set-of-sequences"; complexity: readonly [string, string]; statement: string;
};

function makeProblem(definition: StructuralDefinition): InternalProblem {
  const isTree = "values" in definition && "result" in definition && treeDefinitions.some((item) => item.slug === definition.slug);
  const isList = listDefinitions.some((item) => item.slug === definition.slug);
  const hasTargetParameter = ["combinations", "combinationSum", "combinationSumOnce", "generateParentheses", "targetSumWays"].includes(definition.method);
  const parameterName = definition.parameter ?? (definition.k !== undefined ? (definition.method === "removeNthFromEnd" ? "n" : "k") : definition.target !== undefined ? "target" : undefined);
  const starter = isTree
    ? `struct TreeNode { int val; TreeNode* left; TreeNode* right; TreeNode(int x): val(x), left(nullptr), right(nullptr) {} };\nclass Solution { public: ${definition.result === "int[]" ? "vector<int>" : definition.result ?? "int"} ${definition.method}(TreeNode* root${parameterName ? `, int ${parameterName}` : ""}); };`
    : isList
      ? `struct ListNode { int val; ListNode* next; ListNode(int x): val(x), next(nullptr) {} };\nclass Solution { public: ${definition.result === "int[]" ? "ListNode*" : definition.result ?? "int"} ${definition.method}(ListNode* head${definition.secondValues ? ", ListNode* second" : ""}${parameterName ? `, int ${parameterName}` : ""}); };`
      : `class Solution { public: vector<vector<int>> ${definition.method}(vector<int>& values${hasTargetParameter ? ", int target" : ""}); };`;
  const pythonStarter = isTree
    ? `class TreeNode:\n    def __init__(self, val=0, left=None, right=None): self.val, self.left, self.right = val, left, right\n\nclass Solution:\n    def ${definition.method}(self, root${parameterName ? `, ${parameterName}` : ""}):\n        pass`
    : isList
      ? `class ListNode:\n    def __init__(self, val=0, next=None): self.val, self.next = val, next\n\nclass Solution:\n    def ${definition.method}(self, head${definition.secondValues ? ", second" : ""}${parameterName ? `, ${parameterName}` : ""}):\n        pass`
      : `class Solution:\n    def ${definition.method}(self, values${hasTargetParameter ? ", target" : ""}):\n        pass`;
  const parameters = isTree ? [{ name: "root", type: "TreeNode*" }, ...(parameterName ? [{ name: parameterName, type: "int" }] : [])]
    : isList ? [{ name: "head", type: "ListNode*" }, ...(definition.secondValues ? [{ name: "second", type: "ListNode*" }] : []), ...(parameterName ? [{ name: parameterName, type: "int" }] : [])]
      : [{ name: "values", type: "int[]" }, ...(hasTargetParameter ? [{ name: "target", type: "int" }] : [])];
  const returns = isTree ? definition.result ?? "int" : isList ? (definition.result === "int[]" ? "ListNode*" : definition.result ?? "int") : "int[][]";
  let sampleExpected = definition.expected;
  if (!isTree && !isList && Array.isArray(sampleExpected) && definition.normalization) {
    const rows = (sampleExpected as readonly (readonly number[])[]).map((row) => definition.normalization === "set-of-value-sets" ? [...row].sort((a, b) => a - b) : [...row]);
    rows.sort((a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i += 1) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; });
    sampleExpected = rows;
  }
  const sampleInput = isTree
    ? `levelOrder = ${JSON.stringify(definition.values)}${definition.k !== undefined ? `, k = ${definition.k}` : ""}${definition.target !== undefined ? `, target = ${definition.target}` : ""}`
    : `values = ${JSON.stringify(definition.values)}${definition.secondValues ? `, secondValues = ${JSON.stringify(definition.secondValues)}` : ""}${definition.cycleAt !== undefined ? `, cycleAt = ${definition.cycleAt}` : ""}${definition.k !== undefined ? `, k = ${definition.k}` : ""}${definition.target !== undefined && !isTree ? `, target = ${definition.target}` : ""}`;
  const samples = [{ name: "Example 1", input: sampleInput, expectedOutput: JSON.stringify(sampleExpected), explanation: "This output is obtained by applying the stated operation to the example input." }];
  const constraints = isTree
    ? ["0 <= node count <= 100,000", "Tree height is at most 900 nodes.", "Node values fit in a signed 32-bit integer.", ...(definition.k !== undefined ? ["k is a valid one-based rank in the BST."] : [])]
    : isList
      ? ["0 <= each list length <= 100,000", "Node values fit in a signed 32-bit integer.", ...(definition.secondValues ? ["Both input lists are sorted in non-decreasing order."] : []), ...(definition.cycleAt !== undefined ? ["cycleAt is -1 or a valid node index."] : []), ...(definition.k !== undefined ? ["n or k is valid for the list length."] : [])]
      : ["At most 12 input values are used, except permutation tasks which use at most 8.", "Candidate values for combination-sum tasks are positive integers.", "The requested target is non-negative and at most 100.", "Each returned collection contains no duplicate result."];
  return {
    slug: definition.slug, title: definition.title, difficulty: definition.difficulty,
    complexity: { time: definition.complexity[0], space: definition.complexity[1] }, topics: [...definition.topics],
    statement: definition.statement,
    constraints,
    samples, explanation: "The function receives the stated structure through CodeTrail's language adapter.",
    starterCode: starter, executionMode: "function", supportedLanguages: ["cpp17", "python3"],
    languageStarters: { cpp17: starter, python3: pythonStarter },
    functionSignature: { name: definition.method, parameters, returns },
  };
}

export const expandedStructuralProblems: InternalProblem[] = [
  ...treeDefinitions.map((definition) => makeProblem(definition)),
  ...listDefinitions.map((definition) => makeProblem(definition)),
  ...backtrackingDefinitions.map((definition) => makeProblem(definition)),
];

export const expandedTreeSeeds: readonly StructuralDefinition[] = treeDefinitions;
export const expandedListSeeds: readonly StructuralDefinition[] = listDefinitions;
export const expandedBacktrackingSeeds: readonly StructuralDefinition[] = backtrackingDefinitions;
