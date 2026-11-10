import "server-only";

import type { SupportedLanguage } from "@/lib/problems";
import { expandedArrayReferences } from "@/lib/expanded-array-problems";
import { expandedGraphReferences } from "@/lib/expanded-graph-execution";
import { expandedStructuralReferences } from "@/lib/expanded-structural-execution";

/** Reference implementations stay server-only and are never included in problem API payloads. */
export const originalProblemReferenceSolutions: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  ...expandedArrayReferences,
  ...expandedGraphReferences,
  ...expandedStructuralReferences,
  "two-sum": {
    cpp17: `#include <unordered_map>\nclass Solution { public: vector<int> twoSum(vector<int>& nums, int target) { unordered_map<int,int> seen; for(int i=0;i<(int)nums.size();++i){ auto it=seen.find(target-nums[i]); if(it!=seen.end()) return {it->second,i}; seen[nums[i]]=i; } return {}; } };`,
    python3: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, value in enumerate(nums):\n            if target - value in seen: return [seen[target - value], i]\n            seen[value] = i\n        return []`,
  },
  "maximum-subarray-sum": {
    cpp17: `class Solution { public: int maxSubArray(vector<int>& a) { int cur=a[0],best=a[0]; for(size_t i=1;i<a.size();++i){cur=max(a[i],cur+a[i]);best=max(best,cur);} return best; } };`,
    python3: `class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        current = best = nums[0]\n        for value in nums[1:]: current = max(value, current + value); best = max(best, current)\n        return best`,
  },
  "missing-number": {
    cpp17: `class Solution { public: int missingNumber(vector<int>& a) { long long n=a.size(),sum=n*(n+1)/2; for(int x:a)sum-=x; return (int)sum; } };`,
    python3: `class Solution:\n    def missingNumber(self, nums: list[int]) -> int:\n        return len(nums) * (len(nums) + 1) // 2 - sum(nums)`,
  },
  "reverse-words": {
    cpp17: `#include <sstream>\nclass Solution { public: string reverseWords(string s) { istringstream in(s); vector<string> words; string word; while(in>>word)words.push_back(word); reverse(words.begin(),words.end()); string out; for(auto& x:words){if(!out.empty())out+=' ';out+=x;}return out;} };`,
    python3: `class Solution:\n    def reverseWords(self, s: str) -> str:\n        return " ".join(reversed(s.split()))`,
  },
  "valid-palindrome": {
    cpp17: `#include <cctype>\nclass Solution { public: bool isPalindrome(string s) { string t; for(unsigned char c:s)if(isalnum(c))t+=tolower(c); for(int i=0,j=(int)t.size()-1;i<j;++i,--j)if(t[i]!=t[j])return false; return true;} };`,
    python3: `class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        clean = "".join(c.lower() for c in s if c.isascii() and c.isalnum())\n        return clean == clean[::-1]`,
  },
  "maximum-single-trade-profit": {
    cpp17: `class Solution { public: int maxProfit(vector<int>& prices) { int low = prices.empty() ? 0 : prices[0], best = 0; for (int price : prices) { best = max(best, price - low); low = min(low, price); } return best; } };`,
    python3: `class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        low = float("inf")\n        best = 0\n        for price in prices:\n            best = max(best, price - low)\n            low = min(low, price)\n        return best`,
  },
  "maximum-product-range": {
    cpp17: `class Solution { public: long long maxProduct(vector<int>& nums) { long long high = nums[0], low = nums[0], best = nums[0]; for (size_t i = 1; i < nums.size(); ++i) { long long x = nums[i]; if (x < 0) swap(high, low); high = max(x, high * x); low = min(x, low * x); best = max(best, high); } return best; } };`,
    python3: `class Solution:\n    def maxProduct(self, nums: list[int]) -> int:\n        high = low = best = nums[0]\n        for value in nums[1:]:\n            if value < 0:\n                high, low = low, high\n            high = max(value, high * value)\n            low = min(value, low * value)\n            best = max(best, high)\n        return best`,
  },
  "longest-consecutive-run": {
    cpp17: `#include <unordered_set>\nclass Solution { public: int longestConsecutive(vector<int>& nums) { unordered_set<int> values(nums.begin(), nums.end()); int best = 0; for (int x : values) if (!values.count(x - 1)) { int length = 1; while (values.count(x + length)) ++length; best = max(best, length); } return best; } };`,
    python3: `class Solution:\n    def longestConsecutive(self, nums: list[int]) -> int:\n        values = set(nums)\n        best = 0\n        for value in values:\n            if value - 1 not in values:\n                end = value + 1\n                while end in values:\n                    end += 1\n                best = max(best, end - value)\n        return best`,
  },
  "nonadjacent-maximum-score": {
    cpp17: `class Solution { public: long long rob(vector<int>& values) { long long twoBack = 0, oneBack = 0; for (int value : values) { long long current = max(oneBack, twoBack + value); twoBack = oneBack; oneBack = current; } return oneBack; } };`,
    python3: `class Solution:\n    def rob(self, values: list[int]) -> int:\n        two_back = one_back = 0\n        for value in values:\n            two_back, one_back = one_back, max(one_back, two_back + value)\n        return one_back`,
  },
  "strict-majority-value": {
    cpp17: `class Solution { public: int majorityElement(vector<int>& nums) { int candidate = 0, count = 0; for (int value : nums) { if (!count) candidate = value; count += value == candidate ? 1 : -1; } return candidate; } };`,
    python3: `class Solution:\n    def majorityElement(self, nums: list[int]) -> int:\n        candidate = None\n        count = 0\n        for value in nums:\n            if count == 0:\n                candidate = value\n            count += 1 if value == candidate else -1\n        return candidate`,
  },
};
