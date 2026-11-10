import "server-only";

import type { ExercismAdapterId, FunctionTestCase, SupportedLanguage } from "@/lib/problems";
import { findInternalProblem } from "@/lib/problems";
import { getExercismAdapter } from "@/lib/exercism";
import { buildStructuralCppSuite, buildStructuralPythonSuite } from "@/lib/structural-execution-adapter";

export type SubmissionVerdict =
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "runtime_error"
  | "compilation_error"
  | "internal_judge_error";

export type SubmissionExecution = {
  verdict: SubmissionVerdict;
  passedCount: number;
  totalCount: number;
  message: string;
};

type Judge0Submission = {
  token?: unknown;
  stdout?: unknown;
  stderr?: unknown;
  compile_output?: unknown;
  message?: unknown;
  status?: { id?: unknown; description?: unknown };
};

type Judge0Outcome = {
  state: "complete" | "time_limit_exceeded" | "runtime_error" | "compilation_error" | "internal_judge_error";
  stdout: string;
  message: string;
};

const maxPolls = 30;
const pollIntervalMs = 400;
const maxDecodedOutputBytes = 8_000;

function decodeBase64(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  try {
    return Buffer.from(value, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function statusId(result: Judge0Submission) {
  return typeof result.status?.id === "number" ? result.status.id : null;
}

async function readSubmission(baseUrl: string, token: string, headers: HeadersInit): Promise<Judge0Submission | null> {
  const response = await fetch(`${baseUrl}/submissions/${encodeURIComponent(token)}?base64_encoded=true`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return null;
  const result: unknown = await response.json();
  return typeof result === "object" && result !== null ? result as Judge0Submission : null;
}

async function executeJudge0(
  baseUrl: string,
  headers: HeadersInit,
  languageId: number,
  sourceCode: string,
  input: string,
): Promise<Judge0Outcome> {
  try {
    const created = await fetch(`${baseUrl}/submissions?base64_encoded=false`, {
      method: "POST",
      headers: { ...Object.fromEntries(new Headers(headers)), "Content-Type": "application/json" },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin: input,
        cpu_time_limit: 2,
        cpu_extra_time: 0.5,
        wall_time_limit: 5,
        memory_limit: 128_000,
        stack_limit: 64_000,
        max_file_size: 1_024,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!created.ok) {
      return { state: "internal_judge_error", stdout: "", message: "The judge service could not accept this submission. Please try again." };
    }

    const createdResult: unknown = await created.json();
    const token = typeof createdResult === "object" && createdResult !== null
      ? (createdResult as { token?: unknown }).token
      : null;
    if (typeof token !== "string" || !/^[a-zA-Z0-9-]+$/.test(token)) {
      return { state: "internal_judge_error", stdout: "", message: "The judge service returned an invalid run token." };
    }

    let result: Judge0Submission | null = null;
    for (let attempt = 0; attempt < maxPolls; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      result = await readSubmission(baseUrl, token, headers);
      if (!result) {
        return { state: "internal_judge_error", stdout: "", message: "The judge service could not return this submission result." };
      }
      const id = statusId(result);
      if (id !== null && id >= 3) break;
    }

    const stdout = decodeBase64(result?.stdout).slice(0, maxDecodedOutputBytes);
    const id = result ? statusId(result) : null;
    if (id === null || id < 3) {
      return { state: "internal_judge_error", stdout, message: "The judge service did not finish before its result deadline." };
    }
    if (id === 5) {
      return { state: "time_limit_exceeded", stdout, message: "The submission exceeded the execution time limit." };
    }
    if (id === 6) {
      const compileOutput = decodeBase64(result?.compile_output).slice(0, maxDecodedOutputBytes);
      return {
        state: "compilation_error",
        stdout,
        message: compileOutput || "Compilation failed. Check the function signature and syntax, then retry.",
      };
    }
    if (id === 13) {
      return { state: "internal_judge_error", stdout, message: "The judge service encountered an internal error." };
    }
    if (id !== 3 && id !== 4) {
      const description = typeof result?.status?.description === "string" ? result.status.description.slice(0, 200) : "Runtime Error";
      return { state: "runtime_error", stdout, message: `The program terminated with ${description}.` };
    }
    return { state: "complete", stdout, message: "" };
  } catch {
    return { state: "internal_judge_error", stdout: "", message: "The judge service did not respond in time. Please try again." };
  }
}

function cppSuiteSource(slug: string, sourceCode: string, cases: FunctionTestCase[]) {
  const structuralSource = buildStructuralCppSuite(slug, sourceCode, cases);
  if (structuralSource) return structuralSource;
  const prefix = `#include <algorithm>\n#include <cstddef>\n#include <deque>\n#include <functional>\n#include <iostream>\n#include <numeric>\n#include <queue>\n#include <stdexcept>\n#include <string>\n#include <unordered_map>\n#include <unordered_set>\n#include <vector>\nusing namespace std;\n\n${sourceCode}\n\nstatic void emitResult(int index, bool passed) {\n    std::cout << "__CODETRAIL_RESULT__" << index << ':' << (passed ? 1 : 0) << '\\n';\n}\nstatic void emitRuntimeError(int index) {\n    std::cout << "__CODETRAIL_RUNTIME__" << index << '\\n';\n}\n\n`;
  const inputKind = cases[0]?.input.kind;
  const adapter = getExercismAdapter(slug);
  const methods: Record<string, string> = {
    "two-sum": "twoSum",
    "binary-search": "find",
    "number-array": findInternalProblem(slug)?.functionSignature?.name ?? "missingNumber",
    string: slug === "reverse-words" ? "reverseWords" : "isPalindrome",
    graph: findInternalProblem(slug)?.functionSignature?.name ?? "missingGraphMethod",
  };
  const method = methods[inputKind ?? "string"];
  const exercismMethod = adapter && (["integer", "string", "number-array-pair", "integer-base-reencoding", "domino-chain-check"].includes(inputKind ?? "") || adapter.strategy === "string-grid-transform")
    ? adapter.cppFunction : undefined;
  if ((!method && !exercismMethod) || cases.some((testCase) => testCase.input.kind !== inputKind)) {
    throw new Error("The submission test suite does not match its function wrapper.");
  }

  const caseBody = cases.map((testCase, index) => {
    const variableSuffix = String(index);
    if (testCase.input.kind === "graph") {
      const graphInput = testCase.input;
      const problem = findInternalProblem(slug);
      if (!problem?.functionSignature) throw new Error("The graph suite has no function signature.");
      const edges = graphInput.edges.map((edge) => `{${edge.join(", ")}}`).join(", ");
      const args = problem.functionSignature.parameters.map((parameter) => {
        if (parameter.name === "nodeCount") return String(graphInput.nodeCount);
        if (parameter.name === "edges") return `edges${variableSuffix}`;
        if (parameter.name === "start") return String(graphInput.start);
        if (parameter.name === "target") return String(graphInput.target ?? 0);
        if (parameter.name === "directed") return String(graphInput.directed);
        throw new Error(`Unsupported graph parameter ${parameter.name}.`);
      });
      const expected = typeof testCase.expectedOutput === "boolean" ? String(testCase.expectedOutput) : String(testCase.expectedOutput);
      return `    {\n        std::vector<std::vector<int>> edges${variableSuffix}{${edges}};\n        try { Solution solution; const auto result = solution.${problem.functionSignature.name}(${args.join(", ")}); emitResult(${index}, result == ${expected}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "binary-search") {
      return `    {\n        char kind${variableSuffix}; std::size_t count${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> count${variableSuffix}) || kind${variableSuffix} != 'B') return 2;\n        std::vector<int> nums${variableSuffix}(count${variableSuffix});\n        for (int& value : nums${variableSuffix}) std::cin >> value;\n        int target${variableSuffix}; int expectedException${variableSuffix}; long long expected${variableSuffix};\n        std::cin >> target${variableSuffix} >> expectedException${variableSuffix} >> expected${variableSuffix};\n        try { const std::size_t result = ${adapter?.cppNamespace ?? "binary_search"}::${adapter?.cppFunction ?? "find"}(nums${variableSuffix}, target${variableSuffix}); emitResult(${index}, expectedException${variableSuffix} == 0 && result == static_cast<std::size_t>(expected${variableSuffix})); }\n        catch (const ${adapter?.cppException ?? "std::domain_error"}&) { emitResult(${index}, expectedException${variableSuffix} == 1); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "two-sum") {
      return `    {\n        char kind${variableSuffix}; std::size_t count${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> count${variableSuffix}) || kind${variableSuffix} != 'T') return 2;\n        std::vector<int> nums${variableSuffix}(count${variableSuffix});\n        for (int& value : nums${variableSuffix}) std::cin >> value;\n        int target${variableSuffix}; std::size_t expectedCount${variableSuffix};\n        std::cin >> target${variableSuffix} >> expectedCount${variableSuffix};\n        std::vector<int> expected${variableSuffix}(expectedCount${variableSuffix});\n        for (int& value : expected${variableSuffix}) std::cin >> value;\n        try { Solution solution; const std::vector<int> result = solution.twoSum(nums${variableSuffix}, target${variableSuffix}); emitResult(${index}, result == expected${variableSuffix}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "number-array") {
      return `    {\n        char kind${variableSuffix}; std::size_t count${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> count${variableSuffix}) || kind${variableSuffix} != 'A') return 2;\n        std::vector<int> nums${variableSuffix}(count${variableSuffix});\n        for (int& value : nums${variableSuffix}) std::cin >> value;\n        long long expected${variableSuffix}; std::cin >> expected${variableSuffix};\n        try { Solution solution; const long long result = solution.${method}(nums${variableSuffix}); emitResult(${index}, result == expected${variableSuffix}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "integer" && adapter) {
      return `    {\n        char kind${variableSuffix}; int limit${variableSuffix}; std::size_t count${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> limit${variableSuffix} >> count${variableSuffix}) || kind${variableSuffix} != 'I') return 2;\n        std::vector<int> expected${variableSuffix}(count${variableSuffix});\n        for (int& value : expected${variableSuffix}) std::cin >> value;\n        try { const auto result = ${adapter.cppNamespace}::${adapter.cppFunction}(limit${variableSuffix}); emitResult(${index}, result == expected${variableSuffix}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "string" && slug === "reverse-words") {
      return `    {\n        char kind${variableSuffix}; std::size_t length${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> length${variableSuffix}) || kind${variableSuffix} != 'S') return 2;\n        std::cin.get(); std::string value${variableSuffix}(length${variableSuffix}, '\\0');\n        if (length${variableSuffix}) std::cin.read(&value${variableSuffix}[0], static_cast<std::streamsize>(length${variableSuffix}));\n        std::cin.get(); std::size_t expectedLength${variableSuffix}; std::cin >> expectedLength${variableSuffix}; std::cin.get();\n        std::string expected${variableSuffix}(expectedLength${variableSuffix}, '\\0');\n        if (expectedLength${variableSuffix}) std::cin.read(&expected${variableSuffix}[0], static_cast<std::streamsize>(expectedLength${variableSuffix}));\n        std::cin.get();\n        try { Solution solution; const std::string result = solution.reverseWords(value${variableSuffix}); emitResult(${index}, result == expected${variableSuffix}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "string" && slug === "valid-palindrome") {
      return `    {\n        char kind${variableSuffix}; std::size_t length${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> length${variableSuffix}) || kind${variableSuffix} != 'P') return 2;\n        std::cin.get(); std::string value${variableSuffix}(length${variableSuffix}, '\\0');\n        if (length${variableSuffix}) std::cin.read(&value${variableSuffix}[0], static_cast<std::streamsize>(length${variableSuffix}));\n        std::cin.get(); int expected${variableSuffix}; std::cin >> expected${variableSuffix};\n        try { Solution solution; const bool result = solution.isPalindrome(value${variableSuffix}); emitResult(${index}, result == (expected${variableSuffix} == 1)); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "string" && adapter) {
      return `    {\n        char kind${variableSuffix}; std::size_t length${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> length${variableSuffix}) || kind${variableSuffix} != 'M') return 2;\n        std::cin.get(); std::string value${variableSuffix}(length${variableSuffix}, '\\0');\n        if (length${variableSuffix}) std::cin.read(&value${variableSuffix}[0], static_cast<std::streamsize>(length${variableSuffix}));\n        std::cin.get(); int expected${variableSuffix}; std::cin >> expected${variableSuffix};\n        try { const bool result = ${adapter.cppNamespace}::${adapter.cppFunction}(value${variableSuffix}); emitResult(${index}, result == (expected${variableSuffix} == 1)); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "number-array-pair" && adapter?.cppEnumType) {
      return `    {\n        char kind${variableSuffix}; std::size_t firstCount${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> firstCount${variableSuffix}) || kind${variableSuffix} != 'L') return 2;\n        std::vector<int> first${variableSuffix}(firstCount${variableSuffix});\n        for (int& value : first${variableSuffix}) std::cin >> value;\n        std::size_t secondCount${variableSuffix}; std::cin >> secondCount${variableSuffix};\n        std::vector<int> second${variableSuffix}(secondCount${variableSuffix});\n        for (int& value : second${variableSuffix}) std::cin >> value;\n        std::string expected${variableSuffix}; std::cin >> expected${variableSuffix};\n        try { const auto result = ${adapter.cppNamespace}::${adapter.cppFunction}(first${variableSuffix}, second${variableSuffix});\n            const bool passed = (expected${variableSuffix} == "equal" && result == ${adapter.cppEnumType}::${adapter.cppEnumValues?.equal ?? "equal"}) || (expected${variableSuffix} == "sublist" && result == ${adapter.cppEnumType}::${adapter.cppEnumValues?.sublist ?? "sublist"}) || (expected${variableSuffix} == "superlist" && result == ${adapter.cppEnumType}::${adapter.cppEnumValues?.superlist ?? "superlist"}) || (expected${variableSuffix} == "unequal" && result == ${adapter.cppEnumType}::${adapter.cppEnumValues?.unequal ?? "unequal"});\n            emitResult(${index}, passed); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "integer-base-reencoding" && adapter) {
      const expected = (testCase.expectedOutput as number[] | null) ?? [];
      const expectedValues = expected.join(", ");
      const expectedException = Boolean(testCase.expectedException);
      return `    {\n        const ${adapter.cppInputType ?? "std::vector<int>"} digits${variableSuffix}{${testCase.input.digits.join(", ")}};\n        const ${adapter.cppResultType ?? "std::vector<int>"} expected${variableSuffix}{${expectedValues}};\n        try { const auto result = ${adapter.cppNamespace}::${adapter.cppFunction}(${testCase.input.inputBase}, digits${variableSuffix}, ${testCase.input.outputBase}); emitResult(${index}, !${expectedException} && result == expected${variableSuffix}); }\n        catch (const ${adapter.cppException ?? "std::invalid_argument"}&) { emitResult(${index}, ${expectedException}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "string-grid-transform" && adapter) {
      const inputRows = testCase.input.rows.map((row) => JSON.stringify(row)).join(", ");
      const expectedRows = (testCase.expectedOutput as string[]).map((row) => JSON.stringify(row)).join(", ");
      return `    {\n        const std::vector<std::string> input${variableSuffix}{${inputRows}};\n        const std::vector<std::string> expected${variableSuffix}{${expectedRows}};\n        try { const auto result = ${adapter.cppNamespace}::${adapter.cppFunction}(input${variableSuffix}); emitResult(${index}, result == expected${variableSuffix}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "domino-chain-check") throw new Error("Dominoes is not available in C++17.");
    throw new Error("No C++ full-submission wrapper is configured for this problem.");
  }).join("\n");

  return `${prefix}int main() {\n    int caseCount; if (!(std::cin >> caseCount) || caseCount != ${cases.length}) return 2;\n${caseBody}\n    return 0;\n}\n`;
}

function cppSuiteInput(slug: string, cases: FunctionTestCase[]) {
  const records = cases.map((testCase) => {
    if (testCase.input.kind === "two-sum") {
      const expected = testCase.expectedOutput as number[];
      return `T ${testCase.input.nums.length} ${testCase.input.nums.join(" ")} ${testCase.input.target} ${expected.length} ${expected.join(" ")}`;
    }
    if (testCase.input.kind === "number-array") {
      return `A ${testCase.input.nums.length} ${testCase.input.nums.join(" ")} ${testCase.expectedOutput}`;
    }
    if (testCase.input.kind === "graph") return "G";
    if (["tree", "linked-list", "backtracking"].includes(testCase.input.kind)) return "S";
    if (testCase.input.kind === "integer" && slug === "integer-to-prime-list") {
      const expected = testCase.expectedOutput as number[];
      return `I ${testCase.input.value} ${expected.length} ${expected.join(" ")}`;
    }
    if (testCase.input.kind === "binary-search") {
      return `B ${testCase.input.nums.length} ${testCase.input.nums.join(" ")} ${testCase.input.target} ${testCase.expectedException ? 1 : 0} ${testCase.expectedOutput ?? 0}`;
    }
    if (testCase.input.kind === "number-array-pair" && slug === "two-int-lists-to-relation") {
      return `L ${testCase.input.first.length} ${testCase.input.first.join(" ")} ${testCase.input.second.length} ${testCase.input.second.join(" ")} ${testCase.expectedOutput}`;
    }
    if (testCase.input.kind === "integer-base-reencoding" || testCase.input.kind === "string-grid-transform") return "X";
    if (testCase.input.kind === "domino-chain-check") throw new Error("Dominoes is not available in C++17.");
    if (testCase.input.kind !== "string") throw new Error("The submission input does not match its function wrapper.");
    const inputLength = Buffer.byteLength(testCase.input.value, "utf8");
    if (slug === "reverse-words") {
      const expected = testCase.expectedOutput as string;
      return `S ${inputLength}\n${testCase.input.value}\n${Buffer.byteLength(expected, "utf8")}\n${expected}`;
    }
    if (slug === "string-to-bracket-balance") {
      return `M ${inputLength}\n${testCase.input.value}\n${testCase.expectedOutput ? 1 : 0}`;
    }
    return `P ${inputLength}\n${testCase.input.value}\n${testCase.expectedOutput ? 1 : 0}`;
  });
  return `${records.length}\n${records.join("\n")}\n`;
}

function pythonSuiteSource(slug: string, sourceCode: string, cases: FunctionTestCase[]) {
  const structuralSource = buildStructuralPythonSuite(slug, sourceCode, cases);
  if (structuralSource) return structuralSource;
  const adapter = getExercismAdapter(slug);
  if (slug === "binary-search-index") {
    if (!adapter?.pythonException) throw new Error("The Exercism binary-search adapter is unavailable.");
    return `import json as __ct_json\nimport sys as __ct_sys\n__ct_cases = __ct_json.loads(__ct_sys.stdin.read())\n\n${sourceCode}\n\nfor __ct_index, __ct_case in enumerate(__ct_cases):\n    __ct_expected_exception = __ct_case.get('expectedException') == 'value-not-found'\n    try:\n        __ct_result = ${adapter.pythonFunction}(__ct_case['nums'], __ct_case['target'])\n        __ct_passed = not __ct_expected_exception and type(__ct_result) is int and __ct_result == __ct_case['expectedOutput']\n        print('__CODETRAIL_RESULT__' + str(__ct_index) + ':' + ('1' if __ct_passed else '0'))\n    except ${adapter.pythonException}:\n        __ct_passed = __ct_expected_exception\n        print('__CODETRAIL_RESULT__' + str(__ct_index) + ':' + ('1' if __ct_passed else '0'))\n    except Exception:\n        print('__CODETRAIL_RUNTIME__' + str(__ct_index))\n`;
  }
  if (["integer-base-reencoding", "domino-chain-check"].includes(slug) || adapter?.strategy === "string-grid-transform") {
    if (!adapter) throw new Error("The reviewed Exercism adapter is unavailable.");
    const invocation = slug === "integer-base-reencoding"
      ? `${adapter.pythonFunction}(__ct_case['inputBase'], __ct_case['digits'], __ct_case['outputBase'])`
      : adapter.strategy === "string-grid-transform"
        ? `${adapter.pythonFunction}(__ct_case['rows'])`
        : `${adapter.pythonFunction}([tuple(__ct_tile) for __ct_tile in __ct_case['dominoes']])`;
    const exceptionHandling = slug === "integer-base-reencoding"
      ? `    except ${adapter.pythonException ?? "ValueError"}:\n        __ct_passed = __ct_case.get('expectedException') == 'invalid-argument'\n        print('__CODETRAIL_RESULT__' + str(__ct_index) + ':' + ('1' if __ct_passed else '0'))\n    except Exception:\n        print('__CODETRAIL_RUNTIME__' + str(__ct_index))`
      : `    except Exception:\n        print('__CODETRAIL_RUNTIME__' + str(__ct_index))`;
    return `import json as __ct_json\nimport sys as __ct_sys\n__ct_cases = __ct_json.loads(__ct_sys.stdin.read())\n\ndef __ct_equal(left, right):\n    if type(left) is not type(right): return False\n    if type(left) is list: return len(left) == len(right) and all(__ct_equal(a, b) for a, b in zip(left, right))\n    return left == right\n\n${sourceCode}\n\nfor __ct_index, __ct_case in enumerate(__ct_cases):\n    try:\n        __ct_result = ${invocation}\n        __ct_passed = __ct_case.get('expectedException') is None and __ct_equal(__ct_result, __ct_case['expectedOutput'])\n        print('__CODETRAIL_RESULT__' + str(__ct_index) + ':' + ('1' if __ct_passed else '0'))\n${exceptionHandling}\n`;
  }
  if (["integer-to-prime-list", "string-to-bracket-balance", "two-int-lists-to-relation"].includes(slug)) {
    if (!adapter) throw new Error("The reviewed Exercism adapter is unavailable.");
    const call = slug === "integer-to-prime-list" ? `${adapter.pythonFunction}(__ct_case['value'])`
      : slug === "string-to-bracket-balance" ? `${adapter.pythonFunction}(__ct_case['value'])`
        : `${adapter.pythonFunction}(__ct_case['first'], __ct_case['second'])`;
    const constants = Object.values(adapter.pythonConstants ?? {});
    const enumLabels = Object.entries(adapter.pythonConstants ?? {}).map(([label, name]) => `${name}: '${label}'`).join(", ");
    const normalize = adapter.pythonConstants
      ? `        __ct_constants = (${constants.join(", ")})\n        __ct_unique = len(set(__ct_constants)) == 4\n        __ct_labels = {${enumLabels}}\n        __ct_result = __ct_labels.get(__ct_result, 'invalid') if __ct_unique else 'invalid'`
      : "";
    return `import json as __ct_json\nimport sys as __ct_sys\n__ct_cases = __ct_json.loads(__ct_sys.stdin.read())\n\n${sourceCode}\n\nfor __ct_index, __ct_case in enumerate(__ct_cases):\n    try:\n        __ct_result = ${call}\n${normalize}\n        __ct_expected = __ct_case['expectedOutput']\n        if type(__ct_expected) is list:\n            __ct_passed = type(__ct_result) is list and len(__ct_result) == len(__ct_expected) and all(type(__ct_result[i]) is int and __ct_result[i] == __ct_expected[i] for i in range(len(__ct_expected)))\n        elif type(__ct_expected) is bool:\n            __ct_passed = type(__ct_result) is bool and __ct_result is __ct_expected\n        elif type(__ct_expected) is int:\n            __ct_passed = type(__ct_result) is int and __ct_result == __ct_expected\n        else:\n            __ct_passed = type(__ct_result) is str and __ct_result == __ct_expected\n        print('__CODETRAIL_RESULT__' + str(__ct_index) + ':' + ('1' if __ct_passed else '0'))\n    except Exception:\n        print('__CODETRAIL_RUNTIME__' + str(__ct_index))\n`;
  }
  const method = findInternalProblem(slug)?.functionSignature?.name;
  if (!method) throw new Error("No Python full-submission wrapper is configured for this problem.");
  return `import json as __ct_json\nimport sys as __ct_sys\n__ct_cases = __ct_json.loads(__ct_sys.stdin.read())\n\n${sourceCode}\n\nfor __ct_index, __ct_case in enumerate(__ct_cases):\n    try:\n        if __ct_case['kind'] == 'two-sum':\n            __ct_result = Solution().${method}(__ct_case['nums'], __ct_case['target'])\n        elif __ct_case['kind'] == 'number-array':\n            __ct_result = Solution().${method}(__ct_case['nums'])\n        elif __ct_case['kind'] == 'graph':\n            __ct_result = Solution().${method}(__ct_case['nodeCount'], __ct_case['edges'], __ct_case['start'], __ct_case.get('target', 0), __ct_case['directed'])\n        else:\n            __ct_result = Solution().${method}(__ct_case['value'])\n        __ct_expected = __ct_case['expectedOutput']\n        if type(__ct_expected) is list:\n            __ct_passed = type(__ct_result) is list and len(__ct_result) == len(__ct_expected) and all(type(__ct_result[i]) is int and __ct_result[i] == __ct_expected[i] for i in range(len(__ct_expected)))\n        elif type(__ct_expected) is bool:\n            __ct_passed = type(__ct_result) is bool and __ct_result is __ct_expected\n        elif type(__ct_expected) is int:\n            __ct_passed = type(__ct_result) is int and __ct_result == __ct_expected\n        else:\n            __ct_passed = type(__ct_result) is str and __ct_result == __ct_expected\n        print('__CODETRAIL_RESULT__' + str(__ct_index) + ':' + ('1' if __ct_passed else '0'))\n    except Exception:\n        print('__CODETRAIL_RUNTIME__' + str(__ct_index))\n`;
}

function pythonSuiteInput(cases: FunctionTestCase[]) {
  return JSON.stringify(cases.map((testCase) => ({
    ...testCase.input,
    expectedOutput: testCase.expectedOutput,
    ...(testCase.expectedException ? { expectedException: testCase.expectedException } : {}),
  })));
}

function parseSuiteOutput(stdout: string, totalCount: number) {
  const passed = new Set<number>();
  const runtimeErrors = new Set<number>();
  const received = new Set<number>();
  for (const line of stdout.split(/\r?\n/)) {
    const result = /^__CODETRAIL_RESULT__(\d+):([01])$/.exec(line.trim());
    if (result) {
      const index = Number(result[1]);
      if (index >= 0 && index < totalCount) {
        received.add(index);
        if (result[2] === "1") passed.add(index);
        else passed.delete(index);
        runtimeErrors.delete(index);
      }
      continue;
    }
    const runtime = /^__CODETRAIL_RUNTIME__(\d+)$/.exec(line.trim());
    if (runtime) {
      const index = Number(runtime[1]);
      if (index >= 0 && index < totalCount) {
        received.add(index);
        runtimeErrors.add(index);
        passed.delete(index);
      }
    }
  }
  return { passedCount: passed.size, runtimeErrorCount: runtimeErrors.size, receivedCount: received.size };
}

export async function runSubmissionSuite(args: {
  slug: string;
  adapterId?: ExercismAdapterId;
  language: SupportedLanguage;
  sourceCode: string;
  testCases: FunctionTestCase[];
}): Promise<SubmissionExecution> {
  const totalCount = args.testCases.length;
  const configuredUrl = process.env.JUDGE0_API_URL?.trim();
  if (!configuredUrl) {
    return { verdict: "internal_judge_error", passedCount: 0, totalCount, message: "Code execution is not configured on the server." };
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredUrl);
    if (!["https:", "http:"].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
      return { verdict: "internal_judge_error", passedCount: 0, totalCount, message: "The configured judge URL is invalid." };
    }
  } catch {
    return { verdict: "internal_judge_error", passedCount: 0, totalCount, message: "The configured judge URL is invalid." };
  }

  const configuredLanguageId = args.language === "cpp17"
    ? process.env.JUDGE0_CPP17_LANGUAGE_ID ?? "54"
    : process.env.JUDGE0_PYTHON3_LANGUAGE_ID ?? "92";
  const languageId = Number.parseInt(configuredLanguageId, 10);
  if (!Number.isInteger(languageId) || languageId < 1) {
    return { verdict: "internal_judge_error", passedCount: 0, totalCount, message: "The configured Judge0 language is invalid." };
  }

  const headers = new Headers({ Accept: "application/json" });
  const apiKey = process.env.JUDGE0_API_KEY?.trim();
  if (apiKey) headers.set("X-Auth-Token", apiKey);

  const runnerSlug = args.adapterId ?? args.slug;
  const sourceCode = args.language === "cpp17"
    ? cppSuiteSource(runnerSlug, args.sourceCode, args.testCases)
    : pythonSuiteSource(runnerSlug, args.sourceCode, args.testCases);
  const stdin = args.language === "cpp17" ? cppSuiteInput(runnerSlug, args.testCases) : pythonSuiteInput(args.testCases);
  const outcome = await executeJudge0(
    baseUrl.origin + baseUrl.pathname.replace(/\/$/, ""),
    headers,
    languageId,
    sourceCode,
    stdin,
  );
  const output = parseSuiteOutput(outcome.stdout, totalCount);

  if (outcome.state === "compilation_error") {
    return { verdict: "compilation_error", passedCount: 0, totalCount, message: outcome.message };
  }
  if (outcome.state === "time_limit_exceeded") {
    return { verdict: "time_limit_exceeded", passedCount: output.passedCount, totalCount, message: outcome.message };
  }
  if (outcome.state === "runtime_error") {
    return { verdict: "runtime_error", passedCount: output.passedCount, totalCount, message: outcome.message };
  }
  if (outcome.state === "internal_judge_error") {
    return { verdict: "internal_judge_error", passedCount: output.passedCount, totalCount, message: outcome.message };
  }
  if (output.receivedCount !== totalCount) {
    return { verdict: "internal_judge_error", passedCount: output.passedCount, totalCount, message: "The judge returned an incomplete test result." };
  }
  if (output.runtimeErrorCount > 0) {
    return { verdict: "runtime_error", passedCount: output.passedCount, totalCount, message: "The program terminated unexpectedly on at least one test case." };
  }
  if (output.passedCount !== totalCount) {
    return { verdict: "wrong_answer", passedCount: output.passedCount, totalCount, message: "One or more test cases did not match the expected result." };
  }
  return { verdict: "accepted", passedCount: totalCount, totalCount, message: "All test cases passed." };
}
