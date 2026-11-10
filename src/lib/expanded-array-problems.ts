import "server-only";

import type { FunctionTestCase } from "@/lib/problems";

type ArrayProblemSeed = {
  slug: string; title: string; difficulty: "Easy" | "Medium" | "Hard"; topics: string[];
  statement: string; constraint: string; method: string; explanation: string;
  examples: Array<{ values: number[]; expected: number; explanation: string }>;
  hidden: Array<{ name: string; values: number[]; expected: number }>;
  cpp: string; python: string;
};

const seeds: ArrayProblemSeed[] = [
  {
    slug: "maximum-container-area", title: "Maximum Container Area", difficulty: "Medium", topics: ["Arrays", "Two Pointers"],
    statement: "Vertical posts stand at consecutive integer positions. Post i has height heights[i]. Choose two posts and use the ground as a base; return the greatest water area their walls can contain.",
    constraint: "2 ≤ heights.length ≤ 100,000; 0 ≤ heights[i] ≤ 100,000.", method: "maxArea",
    explanation: "Move the shorter wall inward: moving the taller wall cannot increase the limiting height.",
    examples: [{ values: [1, 8, 6, 2, 5, 4, 8, 3, 7], expected: 49, explanation: "Posts at indices 1 and 8 hold area 7 × 7 = 49." }, { values: [1, 1], expected: 1, explanation: "The only pair has width one and height one." }],
    hidden: [{ name: "Flat walls", values: [4, 4, 4, 4], expected: 12 }, { name: "Zero wall", values: [0, 8, 0], expected: 0 }, { name: "Descending", values: [9, 7, 5, 3, 1], expected: 10 }, { name: "Wide boundary profile", values: Array.from({ length: 1_000 }, () => 100_000), expected: 99_900_000 }],
    cpp: `class Solution { public: long long maxArea(vector<int>& h) { int l=0,r=(int)h.size()-1; long long b=0; while(l<r){ b=max(b,(long long)min(h[l],h[r])*(r-l)); if(h[l]<h[r]) ++l; else --r; } return b; } };`,
    python: `class Solution:\n    def maxArea(self, heights: list[int]) -> int:\n        left, right, best = 0, len(heights) - 1, 0\n        while left < right:\n            best = max(best, min(heights[left], heights[right]) * (right - left))\n            if heights[left] < heights[right]: left += 1\n            else: right -= 1\n        return best`,
  },
  {
    slug: "terrace-rainwater", title: "Terrace Rainwater", difficulty: "Hard", topics: ["Arrays", "Two Pointers", "Stacks"],
    statement: "A cross-section of a terrace is described by non-negative column heights, each one unit wide. After rain, return the total number of unit cubes of water trapped between the columns.",
    constraint: "0 ≤ heights.length ≤ 100,000; 0 ≤ heights[i] ≤ 100,000.", method: "trap",
    explanation: "At each position, trapped water is bounded by the tallest wall on either side. Two pointers maintain those bounds in linear time.",
    examples: [{ values: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1], expected: 6, explanation: "The valleys contain six unit cubes in total." }, { values: [4, 2, 0, 3, 2, 5], expected: 9, explanation: "The six columns trap nine cubes across their basins." }],
    hidden: [{ name: "Empty profile", values: [], expected: 0 }, { name: "No basin", values: [1, 2, 3, 4], expected: 0 }, { name: "Equal basin walls", values: [5, 0, 0, 5], expected: 10 }, { name: "Wide deep basin", values: [100_000, ...Array.from({ length: 998 }, () => 0), 100_000], expected: 99_800_000 }],
    cpp: `class Solution { public: long long trap(vector<int>& h) { int l=0,r=(int)h.size()-1,lm=0,rm=0; long long w=0; while(l<=r){ if(lm<=rm){ lm=max(lm,h[l]); w+=lm-h[l++]; } else { rm=max(rm,h[r]); w+=rm-h[r--]; } } return w; } };`,
    python: `class Solution:\n    def trap(self, heights: list[int]) -> int:\n        left, right, left_max, right_max, water = 0, len(heights) - 1, 0, 0, 0\n        while left <= right:\n            if left_max <= right_max:\n                left_max = max(left_max, heights[left]); water += left_max - heights[left]; left += 1\n            else:\n                right_max = max(right_max, heights[right]); water += right_max - heights[right]; right -= 1\n        return water`,
  },
  {
    slug: "largest-histogram-rectangle", title: "Largest Histogram Rectangle", difficulty: "Hard", topics: ["Stacks", "Arrays"],
    statement: "A histogram has one unit-wide bar for each value in heights. Return the largest rectangle that can be drawn entirely inside the bars.",
    constraint: "0 ≤ heights.length ≤ 100,000; 0 ≤ heights[i] ≤ 1,000,000.", method: "largestRectangleArea",
    explanation: "A monotone stack identifies the nearest shorter bar on both sides of every possible limiting height.",
    examples: [{ values: [2, 1, 5, 6, 2, 3], expected: 10, explanation: "Bars of heights 5 and 6 form a rectangle of area 10." }, { values: [2, 4], expected: 4, explanation: "The second bar alone has area 4." }],
    hidden: [{ name: "Empty chart", values: [], expected: 0 }, { name: "Equal bars", values: [3, 3, 3, 3], expected: 12 }, { name: "Rising then falling", values: [1, 2, 3, 4, 3, 2, 1], expected: 10 }, { name: "Wide uniform chart", values: Array.from({ length: 1_000 }, () => 1_000_000), expected: 1_000_000_000 }],
    cpp: `class Solution { public: long long largestRectangleArea(vector<int>& h) { vector<int> s; long long best=0; for(int i=0;i<=(int)h.size();++i){ int x=i==(int)h.size()?0:h[i]; while(!s.empty()&&h[s.back()]>x){ int height=h[s.back()]; s.pop_back(); int left=s.empty()?-1:s.back(); best=max(best,(long long)height*(i-left-1)); } s.push_back(i); } return best; } };`,
    python: `class Solution:\n    def largestRectangleArea(self, heights: list[int]) -> int:\n        stack = []\n        best = 0\n        for i in range(len(heights) + 1):\n            height = heights[i] if i < len(heights) else 0\n            while stack and heights[stack[-1]] > height:\n                bar = heights[stack.pop()]\n                left = stack[-1] if stack else -1\n                best = max(best, bar * (i - left - 1))\n            stack.append(i)\n        return best`,
  },
  {
    slug: "increasing-subsequence-length", title: "Increasing Subsequence Length", difficulty: "Medium", topics: ["Arrays", "Dynamic Programming", "Searching and Sorting"],
    statement: "Return the length of the longest strictly increasing subsequence of the given sequence. Selected values keep their relative order, but need not be adjacent.",
    constraint: "0 ≤ nums.length ≤ 100,000; −1,000,000,000 ≤ nums[i] ≤ 1,000,000,000.", method: "lengthOfLIS",
    explanation: "Maintain the smallest possible tail for each subsequence length; binary search updates each value's position.",
    examples: [{ values: [10, 9, 2, 5, 3, 7, 101, 18], expected: 4, explanation: "One longest subsequence is 2, 3, 7, 18." }, { values: [4, 4, 4, 4], expected: 1, explanation: "Strict increase allows only one equal value." }],
    hidden: [{ name: "Empty sequence", values: [], expected: 0 }, { name: "Already increasing", values: [1, 2, 3, 4, 5], expected: 5 }, { name: "Descending sequence", values: [9, 7, 5, 3, 1], expected: 1 }, { name: "Long increasing sequence", values: Array.from({ length: 2_000 }, (_, i) => i), expected: 2_000 }],
    cpp: `class Solution { public: int lengthOfLIS(vector<int>& a) { vector<int> t; for(int x:a){ auto i=lower_bound(t.begin(),t.end(),x); if(i==t.end())t.push_back(x);else *i=x; } return t.size(); } };`,
    python: `class Solution:\n    def lengthOfLIS(self, nums: list[int]) -> int:\n        tails = []\n        for value in nums:\n            i = bisect_left(tails, value)\n            if i == len(tails): tails.append(value)\n            else: tails[i] = value\n        return len(tails)`,
  },
  {
    slug: "maximum-circular-segment-sum", title: "Maximum Circular Segment Sum", difficulty: "Hard", topics: ["Arrays", "Dynamic Programming"],
    statement: "Values sit on a circle. Find the greatest sum of a non-empty contiguous segment, where a segment may wrap from the end back to the beginning.",
    constraint: "1 ≤ nums.length ≤ 100,000; −10,000 ≤ nums[i] ≤ 10,000.", method: "maxSubarraySumCircular",
    explanation: "The optimum is either an ordinary maximum subarray or the total minus its minimum subarray; handle the all-negative case separately.",
    examples: [{ values: [5, -3, 5], expected: 10, explanation: "Taking the first and last 5 wraps around the circle for a sum of 10." }, { values: [1, -2, 3, -2], expected: 3, explanation: "The single value 3 is best." }],
    hidden: [{ name: "All negative", values: [-3, -2, -5], expected: -2 }, { name: "Single value", values: [7], expected: 7 }, { name: "All positive", values: [2, 3, 4], expected: 9 }, { name: "Long positive sequence", values: Array.from({ length: 2_000 }, () => 1), expected: 2_000 }],
    cpp: `class Solution { public: int maxSubarraySumCircular(vector<int>& a) { int total=0,curMax=0,bestMax=a[0],curMin=0,bestMin=a[0]; for(int x:a){ curMax=max(x,curMax+x);bestMax=max(bestMax,curMax);curMin=min(x,curMin+x);bestMin=min(bestMin,curMin);total+=x;} return bestMax<0?bestMax:max(bestMax,total-bestMin); } };`,
    python: `class Solution:\n    def maxSubarraySumCircular(self, nums: list[int]) -> int:\n        total = 0; cur_max = cur_min = 0\n        best_max = best_min = nums[0]\n        for value in nums:\n            cur_max = max(value, cur_max + value); best_max = max(best_max, cur_max)\n            cur_min = min(value, cur_min + value); best_min = min(best_min, cur_min)\n            total += value\n        return best_max if best_max < 0 else max(best_max, total - best_min)`,
  },
  {
    slug: "maximum-increasing-subsequence-score", title: "Maximum Increasing Subsequence Score", difficulty: "Medium", topics: ["Arrays", "Dynamic Programming"],
    statement: "Choose a strictly increasing subsequence and maximize the sum of its selected values. The subsequence must contain at least one value.",
    constraint: "1 ≤ nums.length ≤ 2,000; −10,000 ≤ nums[i] ≤ 10,000.", method: "maxSumIncreasingSubsequence",
    explanation: "For each ending position, extend the best increasing subsequence ending at a smaller earlier value.",
    examples: [{ values: [1, 101, 2, 3, 100, 4, 5], expected: 106, explanation: "The subsequence 1, 2, 3, 100 sums to 106." }, { values: [-4, -2, -7], expected: -2, explanation: "A non-empty answer is required, so choose -2." }],
    hidden: [{ name: "One value", values: [8], expected: 8 }, { name: "Decreasing positive", values: [9, 7, 5], expected: 9 }, { name: "Equal values", values: [3, 3, 3], expected: 3 }, { name: "Long increasing values", values: Array.from({ length: 500 }, (_, i) => i + 1), expected: 125_250 }],
    cpp: `class Solution { public: int maxSumIncreasingSubsequence(vector<int>& a) { vector<int> d=a; int best=a[0]; for(int i=0;i<(int)a.size();++i){ for(int j=0;j<i;++j)if(a[j]<a[i])d[i]=max(d[i],d[j]+a[i]); best=max(best,d[i]);} return best;} };`,
    python: `class Solution:\n    def maxSumIncreasingSubsequence(self, nums: list[int]) -> int:\n        best_ending = nums[:] \n        answer = nums[0]\n        for i in range(len(nums)):\n            for j in range(i):\n                if nums[j] < nums[i]: best_ending[i] = max(best_ending[i], best_ending[j] + nums[i])\n            answer = max(answer, best_ending[i])\n        return answer`,
  },
  {
    slug: "inversion-pair-count", title: "Inversion Pair Count", difficulty: "Medium", topics: ["Arrays", "Searching and Sorting"],
    statement: "An inversion is a pair of indices i < j for which nums[i] > nums[j]. Return the number of inversions in the sequence.",
    constraint: "0 ≤ nums.length ≤ 20,000; −1,000,000,000 ≤ nums[i] ≤ 1,000,000,000.", method: "countInversions",
    explanation: "Merge sort counts cross-half inversions whenever a right-half value is placed before remaining left-half values.",
    examples: [{ values: [2, 4, 1, 3, 5], expected: 3, explanation: "The inversion pairs are (2,1), (4,1), and (4,3)." }, { values: [5, 4, 3, 2, 1], expected: 10, explanation: "Every pair is inverted." }],
    hidden: [{ name: "Empty sequence", values: [], expected: 0 }, { name: "Duplicates are not inversions", values: [2, 2, 1], expected: 2 }, { name: "Sorted sequence", values: [1, 2, 3, 4], expected: 0 }, { name: "Long reverse order", values: Array.from({ length: 2_000 }, (_, i) => 2_000 - i), expected: 1_999_000 }],
    cpp: `class Solution { long long merge(vector<int>& a,vector<int>& t,int l,int r){if(r-l<2)return 0;int m=(l+r)/2;long long c=merge(a,t,l,m)+merge(a,t,m,r);int i=l,j=m,k=l;while(i<m&&j<r){if(a[i]<=a[j])t[k++]=a[i++];else{t[k++]=a[j++];c+=m-i;}}while(i<m)t[k++]=a[i++];while(j<r)t[k++]=a[j++];copy(t.begin()+l,t.begin()+r,a.begin()+l);return c;} public: long long countInversions(vector<int>& a){vector<int> t(a.size());return merge(a,t,0,a.size());} };`,
    python: `class Solution:\n    def countInversions(self, nums: list[int]) -> int:\n        values = nums[:]; temp = [0] * len(values)\n        def merge(left, right):\n            if right - left < 2: return 0\n            mid = (left + right) // 2\n            count = merge(left, mid) + merge(mid, right)\n            i, j, k = left, mid, left\n            while i < mid and j < right:\n                if values[i] <= values[j]: temp[k] = values[i]; i += 1\n                else: temp[k] = values[j]; j += 1; count += mid - i\n                k += 1\n            while i < mid: temp[k] = values[i]; i += 1; k += 1\n            while j < right: temp[k] = values[j]; j += 1; k += 1\n            values[left:right] = temp[left:right]\n            return count\n        return merge(0, len(values))`,
  },
  {
    slug: "minimum-jumps-to-finish", title: "Minimum Jumps to Finish", difficulty: "Medium", topics: ["Arrays", "Greedy"],
    statement: "At index i, you may move forward by any distance from 1 through nums[i]. Return the fewest jumps needed to reach the final index, or -1 when it cannot be reached.",
    constraint: "1 ≤ nums.length ≤ 100,000; 0 ≤ nums[i] ≤ 100,000.", method: "minimumJumps",
    explanation: "Scan each reachable layer and track the farthest index the next jump can reach.",
    examples: [{ values: [2, 3, 1, 1, 4], expected: 2, explanation: "Jump from index 0 to 1, then from 1 to the end." }, { values: [3, 2, 1, 0, 4], expected: -1, explanation: "The zero at index 3 prevents reaching the last position." }],
    hidden: [{ name: "Already at destination", values: [0], expected: 0 }, { name: "Direct jump", values: [8, 0, 0, 0], expected: 1 }, { name: "Blocked at start", values: [0, 1], expected: -1 }, { name: "Long one-step path", values: Array.from({ length: 1_000 }, () => 1), expected: 999 }],
    cpp: `class Solution { public: int minimumJumps(vector<int>& a){if(a.size()<2)return 0;int jumps=0,end=0,far=0;for(int i=0;i<(int)a.size()-1;++i){if(i>far)return -1;far=max(far,i+a[i]);if(i==end){if(far==end)return -1;++jumps;end=far;if(end>=(int)a.size()-1)return jumps;}}return -1;} };`,
    python: `class Solution:\n    def minimumJumps(self, nums: list[int]) -> int:\n        if len(nums) < 2: return 0\n        jumps = end = farthest = 0\n        for i in range(len(nums) - 1):\n            if i > farthest: return -1\n            farthest = max(farthest, i + nums[i])\n            if i == end:\n                if farthest == end: return -1\n                jumps += 1; end = farthest\n                if end >= len(nums) - 1: return jumps\n        return -1`,
  },
  {
    slug: "longest-mountain-range", title: "Longest Mountain Range", difficulty: "Medium", topics: ["Arrays", "Two Pointers"],
    statement: "A mountain is a contiguous range of at least three values that strictly rises to one peak and then strictly falls. Return the longest mountain length, or zero if none exists.",
    constraint: "0 ≤ nums.length ≤ 100,000; −1,000,000 ≤ nums[i] ≤ 1,000,000.", method: "longestMountain",
    explanation: "When a rising run ends at a peak, count its descending run and update the longest complete mountain.",
    examples: [{ values: [2, 1, 4, 7, 3, 2, 5], expected: 5, explanation: "The range [1, 4, 7, 3, 2] is a mountain of length five." }, { values: [2, 2, 2], expected: 0, explanation: "Equal adjacent values prevent a strict rise or fall." }],
    hidden: [{ name: "Empty input", values: [], expected: 0 }, { name: "Only rising", values: [1, 2, 3, 4], expected: 0 }, { name: "Two mountains", values: [0, 2, 1, 0, 3, 2, 1], expected: 4 }, { name: "Long mountain", values: Array.from({ length: 999 }, (_, i) => i < 500 ? i : 998 - i), expected: 999 }],
    cpp: `class Solution { public: int longestMountain(vector<int>& a){int best=0,n=a.size();for(int i=1;i+1<n;){if(a[i-1]<a[i]&&a[i]>a[i+1]){int l=i-1,r=i+1;while(l>0&&a[l-1]<a[l])--l;while(r+1<n&&a[r]>a[r+1])++r;best=max(best,r-l+1);i=r;}else ++i;}return best;} };`,
    python: `class Solution:\n    def longestMountain(self, nums: list[int]) -> int:\n        best = 0; i = 1; n = len(nums)\n        while i + 1 < n:\n            if nums[i - 1] < nums[i] > nums[i + 1]:\n                left = i - 1; right = i + 1\n                while left > 0 and nums[left - 1] < nums[left]: left -= 1\n                while right + 1 < n and nums[right] > nums[right + 1]: right += 1\n                best = max(best, right - left + 1); i = right\n            else: i += 1\n        return best`,
  },
  {
    slug: "maximum-profit-two-trades", title: "Maximum Profit from Two Trades", difficulty: "Hard", topics: ["Arrays", "Dynamic Programming"],
    statement: "A daily price sequence is given. Make at most two buy-then-sell trades, and never hold more than one share. Return the greatest total profit.",
    constraint: "0 ≤ prices.length ≤ 100,000; 0 ≤ prices[i] ≤ 1,000,000.", method: "maxProfitTwoTrades",
    explanation: "Track the best balance after each of four actions: first buy, first sale, second buy, and second sale.",
    examples: [{ values: [3, 3, 5, 0, 0, 3, 1, 4], expected: 6, explanation: "Buy at 3, sell at 5, buy at 0, then sell at 4 for total profit 6." }, { values: [1, 2, 3, 4, 5], expected: 4, explanation: "One trade from 1 to 5 yields the maximum profit." }],
    hidden: [{ name: "No prices", values: [], expected: 0 }, { name: "Falling prices", values: [7, 6, 4, 3, 1], expected: 0 }, { name: "One price", values: [5], expected: 0 }, { name: "Two separated rising runs", values: Array.from({ length: 1_000 }, (_, i) => i % 500), expected: 998 }],
    cpp: `class Solution { public: int maxProfitTwoTrades(vector<int>& p){int b1=-1000000000,s1=0,b2=-1000000000,s2=0;for(int x:p){b1=max(b1,-x);s1=max(s1,b1+x);b2=max(b2,s1-x);s2=max(s2,b2+x);}return s2;} };`,
    python: `class Solution:\n    def maxProfitTwoTrades(self, prices: list[int]) -> int:\n        buy1 = buy2 = -10**30; sell1 = sell2 = 0\n        for price in prices:\n            buy1 = max(buy1, -price); sell1 = max(sell1, buy1 + price)\n            buy2 = max(buy2, sell1 - price); sell2 = max(sell2, buy2 + price)\n        return sell2`,
  },
];

export const expandedArrayReferences = Object.fromEntries(seeds.map((seed) => [seed.slug, {
  cpp17: seed.cpp, python3: seed.method === "lengthOfLIS" ? `from bisect import bisect_left\n${seed.python}` : seed.python,
}]));

export const expandedArraySampleCases: Record<string, FunctionTestCase[]> = Object.fromEntries(seeds.map((seed) => [seed.slug,
  seed.examples.map((item, index) => ({ name: `Example ${index + 1}`, input: { kind: "number-array" as const, nums: item.values }, expectedOutput: item.expected, publicExampleIndex: index })),
]));
export const expandedArraySubmissionCases: Record<string, FunctionTestCase[]> = Object.fromEntries(seeds.map((seed) => [seed.slug, [
  ...seed.examples.map((item, index) => ({ name: `Example ${index + 1}`, input: { kind: "number-array" as const, nums: item.values }, expectedOutput: item.expected, publicExampleIndex: index })),
  ...seed.hidden.map((item) => ({ name: item.name, input: { kind: "number-array" as const, nums: item.values }, expectedOutput: item.expected })),
]]));
