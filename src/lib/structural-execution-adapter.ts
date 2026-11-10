import "server-only";

import type { FunctionTestCase, FunctionTestInput } from "@/lib/problems";
import { findInternalProblem } from "@/lib/problems";

const commonCpp = `#include <algorithm>\n#include <climits>\n#include <functional>\n#include <iostream>\n#include <queue>\n#include <unordered_set>\n#include <vector>\nusing namespace std;\n`;
const treeCpp = `static TreeNode* __ctBuildTree(vector<long long> v){if(v.empty()||v[0]==LLONG_MIN)return nullptr;auto*r=new TreeNode((int)v[0]);queue<TreeNode*>q;q.push(r);size_t i=1;while(!q.empty()&&i<v.size()){auto*n=q.front();q.pop();if(i<v.size()){if(v[i]!=LLONG_MIN){n->left=new TreeNode((int)v[i]);q.push(n->left);}++i;}if(i<v.size()){if(v[i]!=LLONG_MIN){n->right=new TreeNode((int)v[i]);q.push(n->right);}++i;}}return r;}\n`;
const listCpp = `static ListNode* __ctBuildList(vector<int>v,int cycleAt=-1){ListNode*d=new ListNode(0),*t=d;vector<ListNode*>p;for(int x:v){t->next=new ListNode(x);t=t->next;p.push_back(t);}if(cycleAt>=0&&!p.empty())t->next=p[cycleAt];return d->next;}\nstatic vector<int> __ct_list_values(ListNode*n){vector<int>v;unordered_set<ListNode*>s;while(n&&s.insert(n).second){v.push_back(n->val);n=n->next;}return v;}\n`;
const pythonHelpers = `\ndef __ct_build_tree(values):\n    if not values or values[0] is None:return None\n    root=TreeNode(values[0]);q=[root];i=1;head=0\n    while head<len(q) and i<len(values):\n        n=q[head];head+=1\n        if i<len(values):\n            if values[i] is not None:n.left=TreeNode(values[i]);q.append(n.left)\n            i+=1\n        if i<len(values):\n            if values[i] is not None:n.right=TreeNode(values[i]);q.append(n.right)\n            i+=1\n    return root\ndef __ct_build_list(values,cycle_at=-1):\n    dummy=ListNode(0);tail=dummy;nodes=[]\n    for value in values:tail.next=ListNode(value);tail=tail.next;nodes.append(tail)\n    if cycle_at>=0 and nodes:tail.next=nodes[cycle_at]\n    return dummy.next\ndef __ct_list_values(node):\n    values=[];seen=set()\n    while node and id(node) not in seen:seen.add(id(node));values.append(node.val);node=node.next\n    return values\n`;

function isStructural(input: FunctionTestInput): input is Extract<FunctionTestInput, { kind: "tree" | "linked-list" | "backtracking" }> {
  return input.kind === "tree" || input.kind === "linked-list" || input.kind === "backtracking";
}

function inputArgs(slug: string, input: FunctionTestInput) {
  if (!isStructural(input)) throw new Error("Expected a structural input.");
  const problem = findInternalProblem(slug);
  if (!problem?.functionSignature) throw new Error(`No structural function signature for ${slug}.`);
  const variables = input.kind === "tree" ? { root: "__ctRoot", k: String(input.k ?? 0), target: String(input.target ?? 0) }
    : input.kind === "linked-list" ? { head: "__ctHead", second: "__ctSecond", n: String(input.k ?? 0), k: String(input.k ?? 0), target: String(input.target ?? 0) }
      : { values: "__ctValues", target: String(input.target ?? 0) };
  return { problem, args: problem.functionSignature.parameters.map((p) => variables[p.name as keyof typeof variables] ?? "0") };
}

function cppInput(input: Extract<FunctionTestInput, { kind: "tree" | "linked-list" | "backtracking" }>) {
  if (input.kind === "tree") return `TreeNode* __ctRoot=__ctBuildTree(vector<long long>{${input.levelOrder.map((x) => x === null ? "LLONG_MIN" : String(x)).join(",")}});`;
  if (input.kind === "linked-list") return `ListNode* __ctHead=__ctBuildList(vector<int>{${input.values.join(",")}},${input.cycleAt ?? -1});ListNode* __ctSecond=__ctBuildList(vector<int>{${input.secondValues?.join(",") ?? ""}});`;
  return `vector<int> __ctValues{${input.values.join(",")}};`;
}

function cppOutput(result: string, input: Extract<FunctionTestInput, { kind: "tree" | "linked-list" | "backtracking" }>, testCase: FunctionTestCase) {
  if (input.kind === "backtracking") {
    const expected = testCase.expectedOutput as number[][];
    const sortInner = input.normalization === "set-of-value-sets" ? "for(auto& row:actual)sort(row.begin(),row.end());for(auto& row:expected)sort(row.begin(),row.end());" : "";
    return `auto actual=${result};vector<vector<int>> expected{${expected.map((x) => `vector<int>{${x.join(",")}}`).join(",")}};${sortInner}sort(actual.begin(),actual.end());sort(expected.begin(),expected.end());if(adjacent_find(actual.begin(),actual.end())!=actual.end()){cout<<\"\\\"__duplicate_result__\\\"\";return 0;}cout<<'[';for(size_t i=0;i<actual.size();++i){if(i)cout<<',';cout<<'[';for(size_t j=0;j<actual[i].size();++j){if(j)cout<<',';cout<<actual[i][j];}cout<<']';}cout<<']';`;
  }
  if (Array.isArray(testCase.expectedOutput)) {
    const vector = input.kind === "linked-list" ? `__ct_list_values` : "";
    const val = input.kind === "linked-list" ? `auto values=${vector}(${result});` : `auto values=${result};`;
    return `${val}cout<<'[';for(size_t i=0;i<values.size();++i){if(i)cout<<',';cout<<values[i];}cout<<']';`;
  }
  if (typeof testCase.expectedOutput === "number") return `cout<<${result};`;
  return `cout<<(${result} ? \"true\" : \"false\");`;
}

function pythonInput(input: Extract<FunctionTestInput, { kind: "tree" | "linked-list" | "backtracking" }>) {
  if (input.kind === "tree") return `__ct_root=__ct_build_tree(${JSON.stringify(input.levelOrder).replace(/\bnull\b/g, "None")})`;
  if (input.kind === "linked-list") return `__ct_head=__ct_build_list(${JSON.stringify(input.values)},${input.cycleAt ?? -1});__ct_second=__ct_build_list(${JSON.stringify(input.secondValues ?? [])})`;
  return `__ct_values=${JSON.stringify(input.values)}`;
}

function pyCall(slug: string, input: Extract<FunctionTestInput, { kind: "tree" | "linked-list" | "backtracking" }>) {
  const { problem } = inputArgs(slug, input);
  const args = problem.functionSignature!.parameters.map((p) => {
    if (input.kind === "tree") return p.name === "root" ? "__ct_root" : p.name === "k" ? String(input.k ?? 0) : p.name === "target" ? String(input.target ?? 0) : "0";
    if (input.kind === "linked-list") return p.name === "head" ? "__ct_head" : p.name === "second" ? "__ct_second" : p.name === "n" || p.name === "k" ? String(input.k ?? 0) : p.name === "target" ? String(input.target ?? 0) : "0";
    return p.name === "values" ? "__ct_values" : String(input.target ?? 0);
  });
  return `Solution().${problem.functionSignature!.name}(${args.join(",")})`;
}

export function buildStructuralSampleSource(slug: string, language: "cpp17" | "python3", sourceCode: string, testCase: FunctionTestCase): string | null {
  if (!isStructural(testCase.input)) return null;
  const input = testCase.input;
  if (language === "cpp17") {
    const { problem, args } = inputArgs(slug, input);
    const result = `solution.${problem.functionSignature!.name}(${args.join(",")})`;
    return `${commonCpp}${sourceCode}\n${input.kind === "tree" ? treeCpp : ""}${input.kind === "linked-list" ? listCpp : ""}int main(){${cppInput(input)}Solution solution;${cppOutput(result,input,testCase)}cout<<'\\n';}`;
  }
  const norm = input.kind === "backtracking" ? `\nif isinstance(__ct_result,list) and __ct_result and isinstance(__ct_result[0],list):\n    if ${JSON.stringify(input.normalization)}=='set-of-value-sets':__ct_result=[sorted(row) for row in __ct_result]\n    __ct_result=sorted(__ct_result)\n    if len({tuple(row) for row in __ct_result})!=len(__ct_result):__ct_result='__duplicate_result__'` : "";
  const output = input.kind === "linked-list" && Array.isArray(testCase.expectedOutput) ? "__ct_result=__ct_list_values(__ct_result)" : "";
  return `import json\n${sourceCode}\n${pythonHelpers}\n${pythonInput(input)}\n__ct_result=${pyCall(slug,input)}\n${output}${norm}\nprint(json.dumps(__ct_result,separators=(',',':')))\n`;
}

export function buildStructuralCppSuite(slug: string, sourceCode: string, cases: FunctionTestCase[]): string | null {
  if (!cases.length || !isStructural(cases[0].input)) return null;
  const blocks = cases.map((testCase, index) => {
    if (!isStructural(testCase.input)) throw new Error("Mixed structural test cases are not supported.");
    const { problem, args } = inputArgs(slug, testCase.input);
    const result = `solution.${problem.functionSignature!.name}(${args.join(",")})`;
    let compare: string;
    if (testCase.input.kind === "backtracking") {
      const expected = testCase.expectedOutput as number[][];
      const inner = testCase.input.normalization === "set-of-value-sets" ? "for(auto& row:actual)sort(row.begin(),row.end());for(auto& row:expected)sort(row.begin(),row.end());" : "";
      compare = `auto actual=${result};vector<vector<int>> expected{${expected.map((x) => `vector<int>{${x.join(",")}}`).join(",")}};${inner}sort(actual.begin(),actual.end());sort(expected.begin(),expected.end());emitResult(${index},actual==expected&&adjacent_find(actual.begin(),actual.end())==actual.end());`;
    } else if (Array.isArray(testCase.expectedOutput)) {
      const actual = testCase.input.kind === "linked-list" ? `__ct_list_values(${result})` : result;
      compare = `auto actual=${actual};vector<int> expected{${(testCase.expectedOutput as number[]).join(",")}};emitResult(${index},actual==expected);`;
    } else {
      compare = `auto actual=${result};emitResult(${index},actual==${typeof testCase.expectedOutput === "boolean" ? String(testCase.expectedOutput) : String(testCase.expectedOutput)});`;
    }
    return `{${cppInput(testCase.input)}try{Solution solution;${compare}}catch(...){emitRuntimeError(${index});}}`;
  }).join("\n");
  return `${commonCpp}${sourceCode}\n${cases[0].input.kind === "tree" ? treeCpp : ""}${cases[0].input.kind === "linked-list" ? listCpp : ""}static void emitResult(int i,bool p){cout<<\"__CODETRAIL_RESULT__\"<<i<<':'<<(p?1:0)<<'\\n';}static void emitRuntimeError(int i){cout<<\"__CODETRAIL_RUNTIME__\"<<i<<'\\n';}int main(){${blocks}}`;
}

export function buildStructuralPythonSuite(slug: string, sourceCode: string, cases: FunctionTestCase[]): string | null {
  if (!cases.length || !isStructural(cases[0].input)) return null;
  const branches = cases.map((testCase) => {
    if (!isStructural(testCase.input)) throw new Error("Mixed structural test cases are not supported.");
    const input = testCase.input;
    const setup = input.kind === "tree" ? "__ct_root=__ct_build_tree(__ct_case['levelOrder'])" : input.kind === "linked-list" ? "__ct_head=__ct_build_list(__ct_case['values'],__ct_case.get('cycleAt',-1));__ct_second=__ct_build_list(__ct_case.get('secondValues',[]))" : "__ct_values=__ct_case['values']";
    const signature = findInternalProblem(slug)?.functionSignature;
    if (!signature) throw new Error(`No structural signature for ${slug}.`);
    const args = signature.parameters.map((p) => input.kind === "tree"
      ? p.name === "root" ? "__ct_root" : `__ct_case.get(${JSON.stringify(p.name)},0)`
      : input.kind === "linked-list" ? p.name === "head" ? "__ct_head" : p.name === "second" ? "__ct_second" : `__ct_case.get(${JSON.stringify(p.name === "n" ? "k" : p.name)},0)`
        : p.name === "values" ? "__ct_values" : "__ct_case.get('target',0)");
    const call = `Solution().${signature.name}(${args.join(",")})`;
    const normalize = input.kind === "backtracking" ? `\nif isinstance(result,list) and result and isinstance(result[0],list):\n    if ${JSON.stringify(input.normalization)}=='set-of-value-sets':result=[sorted(row) for row in result]\n    result=sorted(result)\n    if len({tuple(row) for row in result})!=len(result):result='__duplicate_result__'` : input.kind === "linked-list" && Array.isArray(testCase.expectedOutput) ? "\nresult=__ct_list_values(result)" : "";
    const expected = JSON.stringify(JSON.stringify(testCase.expectedOutput));
    const eq = input.kind === "backtracking" ? `result==__ct_expected and result!='__duplicate_result__'` : `type(result)==type(__ct_expected) and result==__ct_expected`;
    return `${setup}\nresult=${call}${normalize}\n__ct_expected=json.loads(${expected})\npassed=${eq}`;
  });
  const casesJson = JSON.stringify(cases.map((x) => x.input));
  const body = cases.map((_,i) => `    if __ct_i==${i}:\n        try:\n${branches[i].split("\n").map((line) => `            ${line}`).join("\n")}\n        except Exception:passed=False\n        print('__CODETRAIL_RESULT__'+str(__ct_i)+':' + ('1' if passed else '0'))`).join("\n");
  return `import json\n${sourceCode}\n${pythonHelpers}\n__ct_cases=json.loads(${JSON.stringify(casesJson)})\nfor __ct_i,__ct_case in enumerate(__ct_cases):\n${body}\n`;
}

