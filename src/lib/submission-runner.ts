import "server-only";

import type { FunctionTestCase, SupportedLanguage } from "@/lib/problems";

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
  const prefix = `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\n${sourceCode}\n\nstatic void emitResult(int index, bool passed) {\n    std::cout << "__CODETRAIL_RESULT__" << index << ':' << (passed ? 1 : 0) << '\\n';\n}\nstatic void emitRuntimeError(int index) {\n    std::cout << "__CODETRAIL_RUNTIME__" << index << '\\n';\n}\n\n`;
  const inputKind = cases[0]?.input.kind;
  const method = {
    "two-sum": "twoSum",
    "number-array": slug === "maximum-subarray-sum" ? "maxSubArray" : "missingNumber",
    string: slug === "reverse-words" ? "reverseWords" : "isPalindrome",
  }[inputKind ?? "string"];
  if (!method || cases.some((testCase) => testCase.input.kind !== inputKind)) {
    throw new Error("The submission test suite does not match its function wrapper.");
  }

  const caseBody = cases.map((testCase, index) => {
    const variableSuffix = String(index);
    if (testCase.input.kind === "two-sum") {
      return `    {\n        char kind${variableSuffix}; std::size_t count${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> count${variableSuffix}) || kind${variableSuffix} != 'T') return 2;\n        std::vector<int> nums${variableSuffix}(count${variableSuffix});\n        for (int& value : nums${variableSuffix}) std::cin >> value;\n        int target${variableSuffix}; std::size_t expectedCount${variableSuffix};\n        std::cin >> target${variableSuffix} >> expectedCount${variableSuffix};\n        std::vector<int> expected${variableSuffix}(expectedCount${variableSuffix});\n        for (int& value : expected${variableSuffix}) std::cin >> value;\n        try { Solution solution; const std::vector<int> result = solution.twoSum(nums${variableSuffix}, target${variableSuffix}); emitResult(${index}, result == expected${variableSuffix}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "number-array") {
      return `    {\n        char kind${variableSuffix}; std::size_t count${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> count${variableSuffix}) || kind${variableSuffix} != 'A') return 2;\n        std::vector<int> nums${variableSuffix}(count${variableSuffix});\n        for (int& value : nums${variableSuffix}) std::cin >> value;\n        int expected${variableSuffix}; std::cin >> expected${variableSuffix};\n        try { Solution solution; const int result = solution.${method}(nums${variableSuffix}); emitResult(${index}, result == expected${variableSuffix}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "string" && slug === "reverse-words") {
      return `    {\n        char kind${variableSuffix}; std::size_t length${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> length${variableSuffix}) || kind${variableSuffix} != 'S') return 2;\n        std::cin.get(); std::string value${variableSuffix}(length${variableSuffix}, '\\0');\n        if (length${variableSuffix}) std::cin.read(value${variableSuffix}.data(), static_cast<std::streamsize>(length${variableSuffix}));\n        std::cin.get(); std::size_t expectedLength${variableSuffix}; std::cin >> expectedLength${variableSuffix}; std::cin.get();\n        std::string expected${variableSuffix}(expectedLength${variableSuffix}, '\\0');\n        if (expectedLength${variableSuffix}) std::cin.read(expected${variableSuffix}.data(), static_cast<std::streamsize>(expectedLength${variableSuffix}));\n        std::cin.get();\n        try { Solution solution; const std::string result = solution.reverseWords(value${variableSuffix}); emitResult(${index}, result == expected${variableSuffix}); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
    if (testCase.input.kind === "string" && slug === "valid-palindrome") {
      return `    {\n        char kind${variableSuffix}; std::size_t length${variableSuffix};\n        if (!(std::cin >> kind${variableSuffix} >> length${variableSuffix}) || kind${variableSuffix} != 'P') return 2;\n        std::cin.get(); std::string value${variableSuffix}(length${variableSuffix}, '\\0');\n        if (length${variableSuffix}) std::cin.read(value${variableSuffix}.data(), static_cast<std::streamsize>(length${variableSuffix}));\n        std::cin.get(); int expected${variableSuffix}; std::cin >> expected${variableSuffix};\n        try { Solution solution; const bool result = solution.isPalindrome(value${variableSuffix}); emitResult(${index}, result == (expected${variableSuffix} == 1)); }\n        catch (...) { emitRuntimeError(${index}); }\n    }`;
    }
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
    const inputLength = Buffer.byteLength(testCase.input.value, "utf8");
    if (slug === "reverse-words") {
      const expected = testCase.expectedOutput as string;
      return `S ${inputLength}\n${testCase.input.value}\n${Buffer.byteLength(expected, "utf8")}\n${expected}`;
    }
    return `P ${inputLength}\n${testCase.input.value}\n${testCase.expectedOutput ? 1 : 0}`;
  });
  return `${records.length}\n${records.join("\n")}\n`;
}

function pythonSuiteSource(slug: string, sourceCode: string) {
  const method = {
    "two-sum": "twoSum",
    "maximum-subarray-sum": "maxSubArray",
    "missing-number": "missingNumber",
    "reverse-words": "reverseWords",
    "valid-palindrome": "isPalindrome",
  }[slug];
  if (!method) throw new Error("No Python full-submission wrapper is configured for this problem.");
  return `import json as __ct_json\nimport sys as __ct_sys\n__ct_cases = __ct_json.loads(__ct_sys.stdin.read())\n\n${sourceCode}\n\nfor __ct_index, __ct_case in enumerate(__ct_cases):\n    try:\n        if __ct_case['kind'] == 'two-sum':\n            __ct_result = Solution().${method}(__ct_case['nums'], __ct_case['target'])\n        elif __ct_case['kind'] == 'number-array':\n            __ct_result = Solution().${method}(__ct_case['nums'])\n        else:\n            __ct_result = Solution().${method}(__ct_case['value'])\n        __ct_expected = __ct_case['expectedOutput']\n        if type(__ct_expected) is list:\n            __ct_passed = type(__ct_result) is list and len(__ct_result) == len(__ct_expected) and all(type(__ct_result[i]) is int and __ct_result[i] == __ct_expected[i] for i in range(len(__ct_expected)))\n        elif type(__ct_expected) is bool:\n            __ct_passed = type(__ct_result) is bool and __ct_result is __ct_expected\n        elif type(__ct_expected) is int:\n            __ct_passed = type(__ct_result) is int and __ct_result == __ct_expected\n        else:\n            __ct_passed = type(__ct_result) is str and __ct_result == __ct_expected\n        print('__CODETRAIL_RESULT__' + str(__ct_index) + ':' + ('1' if __ct_passed else '0'))\n    except Exception:\n        print('__CODETRAIL_RUNTIME__' + str(__ct_index))\n`;
}

function pythonSuiteInput(cases: FunctionTestCase[]) {
  return JSON.stringify(cases.map((testCase) => ({ ...testCase.input, expectedOutput: testCase.expectedOutput })));
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

  const sourceCode = args.language === "cpp17"
    ? cppSuiteSource(args.slug, args.sourceCode, args.testCases)
    : pythonSuiteSource(args.slug, args.sourceCode);
  const stdin = args.language === "cpp17" ? cppSuiteInput(args.slug, args.testCases) : pythonSuiteInput(args.testCases);
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
