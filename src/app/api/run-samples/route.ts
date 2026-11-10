import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getDatabase } from "@/lib/db";
import { problemSubmissions } from "@/lib/db/schema";
import { getFunctionTestCases } from "@/lib/function-test-cases";
import { findInternalProblem, type FunctionTestCase, type SupportedLanguage } from "@/lib/problems";
import { ExercismProviderError, getExercismAdapter, getExercismFunctionTestCases, getExercismProblem } from "@/lib/exercism";
import { buildStructuralSampleSource } from "@/lib/structural-execution-adapter";

export const maxDuration = 30;

const maxRequestBytes = 24_000;
const maxSourceBytes = 20_000;
const maxSampleInputBytes = 8_000;
const maxTotalSampleInputBytes = 24_000;
const pollIntervalMs = 400;
const maxPolls = 30;

type Judge0Submission = {
  token?: unknown;
  stdout?: unknown;
  stderr?: unknown;
  compile_output?: unknown;
  message?: unknown;
  status?: { id?: unknown; description?: unknown };
};

type SampleVerdict =
  | "accepted"
  | "wrong_answer"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "service_error";

type ExecutionFailureVerdict = Exclude<SampleVerdict, "accepted" | "wrong_answer">;
type RawExecution =
  | { actualOutput: string; error: null; verdict: null }
  | { actualOutput: string; error: string; verdict: ExecutionFailureVerdict };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function decodeBase64(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  try {
    return Buffer.from(value, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function normalizedOutput(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
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

function executionFailure(verdict: ExecutionFailureVerdict, error: string, actualOutput = ""): RawExecution {
  return { actualOutput, error, verdict };
}

async function executeProgram(
  baseUrl: string,
  headers: HeadersInit,
  languageId: number,
  sourceCode: string,
  input: string,
): Promise<RawExecution> {
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
      const responseText = await created.text().catch(() => "");
      console.error("[Judge0] Submission rejected", {
        status: created.status,
        statusText: created.statusText,
        response: responseText.slice(0, 1000),
      });

      return executionFailure("service_error", `Judge0 rejected the submission (HTTP ${created.status}). Check the dev server terminal.`);
    }

    const createdResult: unknown = await created.json();
    const token = typeof createdResult === "object" && createdResult !== null
      ? (createdResult as { token?: unknown }).token
      : null;
    if (typeof token !== "string" || !/^[a-zA-Z0-9-]+$/.test(token)) {
      return executionFailure("service_error", "Judge0 returned an invalid run token.");
    }

    let result: Judge0Submission | null = null;
    for (let attempt = 0; attempt < maxPolls; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      result = await readSubmission(baseUrl, token, headers);
      if (!result) return executionFailure("service_error", "Judge0 could not return this run result.");
      const id = statusId(result);
      if (id !== null && id >= 3) break;
    }

    const actualOutput = decodeBase64(result?.stdout).slice(0, 8_000);
    const compileOutput = decodeBase64(result?.compile_output).slice(0, 8_000);
    const stderr = decodeBase64(result?.stderr).slice(0, 8_000);
    const message = decodeBase64(result?.message).slice(0, 8_000);
    const id = result ? statusId(result) : null;
    if (id === null || id < 3) {
      return executionFailure("service_error", "The execution service did not finish before results became available. Try again shortly.", actualOutput);
    }
    if (id === 6) {
      return executionFailure("compilation_error", compileOutput || "Compilation failed.", actualOutput);
    }
    if (id === 5) {
      return executionFailure("time_limit_exceeded", stderr || message || "The sample exceeded its execution time limit.", actualOutput);
    }
    if (id !== 3 && id !== 4) {
      const details = stderr || message;
      const description = typeof result?.status?.description === "string" ? result.status.description : "The program did not finish successfully.";
      const verdict = id === 13 ? "service_error" : "runtime_error";
      return executionFailure(verdict, details || description, actualOutput);
    }

    return { actualOutput, error: null, verdict: null };
  } catch {
    return executionFailure("service_error", "The execution service did not respond in time. Please try again.");
  }
}

async function executeSample(
  baseUrl: string,
  headers: HeadersInit,
  languageId: number,
  sourceCode: string,
  input: string,
  expectedOutput: string,
) {
  const execution = await executeProgram(baseUrl, headers, languageId, sourceCode, input);
  if (execution.error) {
    return { passed: false, actualOutput: execution.actualOutput, error: execution.error, verdict: execution.verdict };
  }

  const passed = normalizedOutput(execution.actualOutput) === normalizedOutput(expectedOutput);
  return {
    passed,
    actualOutput: execution.actualOutput,
    error: passed ? null : "Output did not match the expected result.",
    verdict: passed ? "accepted" as const : "wrong_answer" as const,
  };
}

function buildCppFunctionSource(sourceCode: string, testCase: FunctionTestCase) {
  if (testCase.input.kind !== "two-sum") {
    throw new Error("The Two Sum wrapper received an incompatible test case.");
  }
  return `#include <iostream>\n#include <vector>\nusing namespace std;\n\n${sourceCode}\n\nint main() {\n    std::vector<int> nums{${testCase.input.nums.join(", ")}};\n    Solution solution;\n    const std::vector<int> result = solution.twoSum(nums, ${testCase.input.target});\n    std::cout << '[';\n    for (std::size_t i = 0; i < result.size(); ++i) {\n        if (i > 0) std::cout << ',';\n        std::cout << result[i];\n    }\n    std::cout << "]\\n";\n    return 0;\n}\n`;
}

function cppJsonStringSerializer() {
  return String.raw`static void emitJsonString(const std::string& value) {
    const char* hex = "0123456789abcdef";
    std::cout << '"';
    for (unsigned char ch : value) {
        switch (ch) {
            case '"': std::cout << "\\\""; break;
            case '\\': std::cout << "\\\\"; break;
            case '\b': std::cout << "\\b"; break;
            case '\f': std::cout << "\\f"; break;
            case '\n': std::cout << "\\n"; break;
            case '\r': std::cout << "\\r"; break;
            case '\t': std::cout << "\\t"; break;
            default:
                if (ch < 0x20) {
                    std::cout << "\\u00" << hex[ch >> 4] << hex[ch & 0x0f];
                } else {
                    std::cout << static_cast<char>(ch);
                }
        }
    }
    std::cout << '"';
}`;
}

function buildCppOtherFunctionSource(slug: string, sourceCode: string, testCase: FunctionTestCase) {
  const prefix = `#include <algorithm>\n#include <cstddef>\n#include <deque>\n#include <functional>\n#include <iostream>\n#include <numeric>\n#include <queue>\n#include <stdexcept>\n#include <string>\n#include <unordered_map>\n#include <unordered_set>\n#include <vector>\nusing namespace std;\n\n${cppJsonStringSerializer()}\n\n${sourceCode}\n\n`;
  const adapter = getExercismAdapter(slug);
  if (testCase.input.kind === "integer" && adapter) {
    return `${prefix}int main() {\n    const auto result = ${adapter.cppNamespace}::${adapter.cppFunction}(${testCase.input.value});\n    std::cout << '[';\n    for (std::size_t i = 0; i < result.size(); ++i) { if (i) std::cout << ','; std::cout << result[i]; }\n    std::cout << "]\\n";\n}\n`;
  }
  if (testCase.input.kind === "number-array") {
    const method = findInternalProblem(slug)?.functionSignature?.name;
    if (!method) throw new Error("No C++ array function is configured for this problem.");
    return `${prefix}int main() {\n    std::vector<int> nums{${testCase.input.nums.join(", ")}};\n    Solution solution;\n    const long long result = solution.${method}(nums);\n    std::cout << result << '\\n';\n    return 0;\n}\n`;
  }
  if (testCase.input.kind === "graph") {
    const graphInput = testCase.input;
    const problem = findInternalProblem(slug);
    const method = problem?.functionSignature?.name;
    if (!method || !problem.functionSignature) throw new Error("No graph function is configured for this problem.");
    const edges = graphInput.edges.map((edge) => `{${edge.join(", ")}}`).join(", ");
    const args = problem.functionSignature.parameters.map((parameter) => {
      if (parameter.name === "nodeCount") return String(graphInput.nodeCount);
      if (parameter.name === "edges") return "edges";
      if (parameter.name === "start") return String(graphInput.start);
      if (parameter.name === "target") return String(graphInput.target ?? 0);
      if (parameter.name === "directed") return JSON.stringify(graphInput.directed);
      throw new Error(`Unsupported graph parameter ${parameter.name}.`);
    });
    const output = problem.functionSignature.returns === "bool"
      ? `std::cout << (result ? "true" : "false") << '\\n';`
      : `std::cout << result << '\\n';`;
    return `${prefix}int main() {\n    std::vector<std::vector<int>> edges{${edges}};\n    Solution solution;\n    const auto result = solution.${method}(${args.join(", ")});\n    ${output}\n    return 0;\n}\n`;
  }
  if (testCase.input.kind === "binary-search") {
    if (!adapter?.cppException) throw new Error("The Exercism binary-search adapter is unavailable.");
    return `${prefix}int main() {\n    const std::vector<int> data{${testCase.input.nums.join(", ")}};\n    try {\n        std::cout << ${adapter.cppNamespace}::${adapter.cppFunction}(data, ${testCase.input.target}) << '\\n';\n    } catch (const ${adapter.cppException}&) {\n        std::cout << "{\\\"exception\\\":\\\"value-not-found\\\"}\\n";\n    }\n    return 0;\n}\n`;
  }
  if (testCase.input.kind === "string" && slug === "reverse-words") {
    return `${prefix}int main() {\n    Solution solution;\n    const std::string result = solution.reverseWords(${JSON.stringify(testCase.input.value)});\n    emitJsonString(result);\n    std::cout << '\\n';\n    return 0;\n}\n`;
  }
  if (testCase.input.kind === "string" && slug === "valid-palindrome") {
    return `${prefix}int main() {\n    Solution solution;\n    const bool result = solution.isPalindrome(${JSON.stringify(testCase.input.value)});\n    std::cout << (result ? \"true\" : \"false\") << '\\n';\n    return 0;\n}\n`;
  }
  if (testCase.input.kind === "string" && adapter) {
    return `${prefix}int main() {\n    const bool result = ${adapter.cppNamespace}::${adapter.cppFunction}(${JSON.stringify(testCase.input.value)});\n    std::cout << (result ? "true" : "false") << '\\n';\n}\n`;
  }
  if (testCase.input.kind === "number-array-pair" && adapter?.cppEnumType) {
    const labels = ["equal", "sublist", "superlist", "unequal"] as const;
    const comparisons = labels.map((label) => `if (result == ${adapter.cppEnumType}::${adapter.cppEnumValues?.[label] ?? label}) { emitJsonString("${label}"); }`).join(" else ");
    return `${prefix}int main() {\n    const std::vector<int> first{${testCase.input.first.join(", ")}};\n    const std::vector<int> second{${testCase.input.second.join(", ")}};\n    const auto result = ${adapter.cppNamespace}::${adapter.cppFunction}(first, second);\n    ${comparisons}\n    else { emitJsonString("invalid"); }\n    std::cout << '\\n';\n}\n`;
  }
  if (testCase.input.kind === "integer-base-reencoding" && adapter) {
    const inputType = adapter.cppInputType ?? "std::vector<int>";
    const exceptionResult = testCase.expectedException ? `std::cout << "{\\\"exception\\\":\\\"invalid-argument\\\"}";` : `std::cout << "null";`;
    return `${prefix}int main() {\n    const ${inputType} digits{${testCase.input.digits.join(", ")}};\n    try {\n        const auto result = ${adapter.cppNamespace}::${adapter.cppFunction}(${testCase.input.inputBase}, digits, ${testCase.input.outputBase});\n        std::cout << '[';\n        for (std::size_t i = 0; i < result.size(); ++i) { if (i) std::cout << ','; std::cout << result[i]; }\n        std::cout << ']';\n    } catch (const ${adapter.cppException ?? "std::invalid_argument"}&) { ${exceptionResult} }\n    std::cout << '\\n';\n}\n`;
  }
  if (testCase.input.kind === "string-grid-transform" && adapter) {
    const rows = testCase.input.rows.map((row) => JSON.stringify(row)).join(", ");
    return `${prefix}int main() {\n    const std::vector<std::string> input{${rows}};\n    const auto result = ${adapter.cppNamespace}::${adapter.cppFunction}(input);\n    std::cout << '[';\n    for (std::size_t i = 0; i < result.size(); ++i) { if (i) std::cout << ','; emitJsonString(result[i]); }\n    std::cout << "]\\n";\n}\n`;
  }
  throw new Error("No C++ function wrapper is configured for this problem.");
}

function buildPythonFunctionSource(sourceCode: string, testCase: FunctionTestCase) {
  if (testCase.input.kind !== "two-sum") {
    throw new Error("The Two Sum wrapper received an incompatible test case.");
  }
  return `${sourceCode}\n\nimport json as __codetrail_json\n__codetrail_nums = ${JSON.stringify(testCase.input.nums)}\n__codetrail_target = ${testCase.input.target}\n__codetrail_result = Solution().twoSum(__codetrail_nums, __codetrail_target)\nprint(__codetrail_json.dumps(__codetrail_result, separators=(",", ":")))\n`;
}

function buildPythonOtherFunctionSource(slug: string, sourceCode: string, testCase: FunctionTestCase) {
  let call: string;
  const adapter = getExercismAdapter(slug);
  if (testCase.input.kind === "integer" && adapter) {
    call = `${adapter.pythonFunction}(${testCase.input.value})`;
  } else if (testCase.input.kind === "number-array") {
    const method = findInternalProblem(slug)?.functionSignature?.name;
    if (!method) throw new Error("No Python array function is configured for this problem.");
    call = `Solution().${method}(${JSON.stringify(testCase.input.nums)})`;
  } else if (testCase.input.kind === "graph") {
    const graphInput = testCase.input;
    const problem = findInternalProblem(slug);
    if (!problem?.functionSignature) throw new Error("No Python graph function is configured for this problem.");
    const args = problem.functionSignature.parameters.map((parameter) => {
      if (parameter.name === "nodeCount") return String(graphInput.nodeCount);
      if (parameter.name === "edges") return JSON.stringify(graphInput.edges);
      if (parameter.name === "start") return String(graphInput.start);
      if (parameter.name === "target") return String(graphInput.target ?? 0);
      if (parameter.name === "directed") return graphInput.directed ? "True" : "False";
      throw new Error(`Unsupported graph parameter ${parameter.name}.`);
    });
    call = `Solution().${problem.functionSignature.name}(${args.join(", ")})`;
  } else if (testCase.input.kind === "binary-search") {
    if (!adapter?.pythonException) throw new Error("The Exercism binary-search adapter is unavailable.");
    return `${sourceCode}\n\nimport json as __codetrail_json\ntry:\n    __codetrail_result = ${adapter.pythonFunction}(${JSON.stringify(testCase.input.nums)}, ${testCase.input.target})\n    print(__codetrail_json.dumps(__codetrail_result, separators=(",", ":")))\nexcept ${adapter.pythonException}:\n    print('{"exception":"value-not-found"}')\n`;
  } else if (testCase.input.kind === "string" && slug === "reverse-words") {
    call = `Solution().reverseWords(${JSON.stringify(testCase.input.value)})`;
  } else if (testCase.input.kind === "string" && slug === "valid-palindrome") {
    call = `Solution().isPalindrome(${JSON.stringify(testCase.input.value)})`;
  } else if (testCase.input.kind === "string" && adapter) {
    call = `${adapter.pythonFunction}(${JSON.stringify(testCase.input.value)})`;
  } else if (testCase.input.kind === "number-array-pair" && adapter?.pythonConstants) {
    const constants = adapter.pythonConstants;
    const entries = Object.entries(constants).map(([label, name]) => `${name}: ${JSON.stringify(label)}`).join(", ");
    const tuple = Object.values(constants).join(", ");
    return `${sourceCode}\n\nimport json as __codetrail_json\n__codetrail_constants = (${tuple})\n__codetrail_lists_unique = len(set(__codetrail_constants)) == 4\n__codetrail_result = ${adapter.pythonFunction}(${JSON.stringify(testCase.input.first)}, ${JSON.stringify(testCase.input.second)})\n__codetrail_labels = {${entries}}\n__codetrail_output = __codetrail_labels.get(__codetrail_result, "invalid") if __codetrail_lists_unique else "invalid"\nprint(__codetrail_json.dumps(__codetrail_output, separators=(",", ":")))\n`;
  } else if (testCase.input.kind === "integer-base-reencoding" && adapter) {
    return `${sourceCode}\n\nimport json as __codetrail_json\ntry:\n    __codetrail_result = ${adapter.pythonFunction}(${testCase.input.inputBase}, ${JSON.stringify(testCase.input.digits)}, ${testCase.input.outputBase})\n    print(__codetrail_json.dumps(__codetrail_result, separators=(",", ":")))\nexcept ${adapter.pythonException ?? "ValueError"}:\n    print('{"exception":"invalid-argument"}')\n`;
  } else if (testCase.input.kind === "string-grid-transform" && adapter) {
    call = `${adapter.pythonFunction}(${JSON.stringify(testCase.input.rows)})`;
  } else if (testCase.input.kind === "domino-chain-check" && adapter) {
    call = `${adapter.pythonFunction}([tuple(__codetrail_tile) for __codetrail_tile in ${JSON.stringify(testCase.input.dominoes)}])`;
  } else {
    throw new Error("No Python function wrapper is configured for this problem.");
  }
  return `${sourceCode}\n\nimport json as __codetrail_json\n__codetrail_result = ${call}\nprint(__codetrail_json.dumps(__codetrail_result, ensure_ascii=True, separators=(",", ":")))\n`;
}

function matchesExpectedFunctionOutput(value: unknown, expected: FunctionTestCase["expectedOutput"]): boolean {
  if (Array.isArray(expected)) {
    return Array.isArray(value)
      && value.length === expected.length
      && value.every((entry, index) => matchesExpectedFunctionOutput(entry, expected[index] as FunctionTestCase["expectedOutput"]));
  }
  if (typeof expected === "number") {
    return typeof value === "number" && Number.isSafeInteger(value) && value === expected;
  }
  return typeof value === typeof expected && value === expected;
}

async function executeFunctionCase(
  baseUrl: string,
  headers: HeadersInit,
  languageId: number,
  language: SupportedLanguage,
  slug: string,
  sourceCode: string,
  testCase: FunctionTestCase,
) {
  const structuralSource = buildStructuralSampleSource(slug, language, sourceCode, testCase);
  const wrappedSource = structuralSource ?? (language === "cpp17"
    ? testCase.input.kind === "two-sum"
      ? buildCppFunctionSource(sourceCode, testCase)
      : buildCppOtherFunctionSource(slug, sourceCode, testCase)
    : testCase.input.kind === "two-sum"
      ? buildPythonFunctionSource(sourceCode, testCase)
      : buildPythonOtherFunctionSource(slug, sourceCode, testCase));
  const execution = await executeProgram(baseUrl, headers, languageId, wrappedSource, "");
  if (execution.error) {
    return {
      name: testCase.name,
      passed: false,
      actualOutput: execution.actualOutput,
      error: execution.error,
      verdict: execution.verdict,
    };
  }

  const resultLine = execution.actualOutput.trimEnd().split(/\r?\n/).at(-1)?.trim() ?? "";
  let returnedValue: unknown;
  try {
    returnedValue = JSON.parse(resultLine) as unknown;
  } catch {
    return {
      name: testCase.name,
      passed: false,
      actualOutput: execution.actualOutput,
      error: "The function wrapper returned malformed output.",
      verdict: "runtime_error" as const,
    };
  }

  const expectedMissing = Boolean(testCase.expectedException)
    && typeof returnedValue === "object" && returnedValue !== null
    && "exception" in returnedValue && returnedValue.exception === testCase.expectedException;
  const passed = testCase.expectedException
    ? expectedMissing
    : matchesExpectedFunctionOutput(returnedValue, testCase.expectedOutput);
  return {
    name: testCase.name,
    passed,
    actualOutput: JSON.stringify(returnedValue),
    error: passed ? null : testCase.input.kind === "two-sum"
      ? "The returned indices did not match the expected result."
      : testCase.expectedException ? "The function did not report a missing value as required." : "The returned value did not match the expected result.",
    verdict: passed ? "accepted" as const : "wrong_answer" as const,
  };
}

export async function POST(request: Request) {
  let session;
  try {
    session = await getSession(request.headers);
  } catch {
    return jsonError("Authentication is temporarily unavailable.", 503);
  }
  if (!session) return jsonError("Sign in to run problem tests.", 401);

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return jsonError("The run request is too large.", 413);
  }

  const reader = request.body?.getReader();
  if (!reader) return jsonError("Send a valid JSON request.", 400);

  let requestBytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      requestBytes += value.byteLength;
      if (requestBytes > maxRequestBytes) {
        await reader.cancel();
        return jsonError("The run request is too large.", 413);
      }
      chunks.push(value);
    }
  } catch {
    return jsonError("Send a valid JSON request.", 400);
  } finally {
    reader.releaseLock();
  }

  const requestBuffer = new Uint8Array(requestBytes);
  let offset = 0;
  for (const chunk of chunks) {
    requestBuffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(requestBuffer)) as unknown;
  } catch {
    return jsonError("Send a valid JSON request.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError("Send a problem slug and source code.", 400);
  }
  const { slug, sourceCode, language: requestedLanguage } = body as {
    slug?: unknown;
    sourceCode?: unknown;
    language?: unknown;
  };
  if (typeof slug !== "string" || typeof sourceCode !== "string") {
    return jsonError("Send a problem slug and source code.", 400);
  }
  const language = requestedLanguage === undefined ? "cpp17" : requestedLanguage;
  if (language !== "cpp17" && language !== "python3") {
    return jsonError("Choose a supported programming language.", 400);
  }
  let problem;
  try {
    problem = findInternalProblem(slug) ?? await getExercismProblem(slug);
  } catch (error) {
    return jsonError(error instanceof ExercismProviderError ? error.message : "Exercism is temporarily unavailable.", 503);
  }
  if (!problem) return jsonError("That CodeTrail problem could not be found.", 404);
  const executionMode = problem.executionMode ?? "stdio";
  if (executionMode === "stdio" && language !== "cpp17") {
    return jsonError("Python 3 is not supported for this problem.", 400);
  }
  if (executionMode === "function" && !problem.supportedLanguages?.includes(language)) {
    return jsonError("That language is not supported for this problem.", 400);
  }
  let functionTestCases = null;
  if (executionMode === "function") {
    try {
      functionTestCases = problem.kind === "exercism"
        ? await getExercismFunctionTestCases(problem.slug, language, false)
        : getFunctionTestCases(problem.slug);
    } catch (error) {
      return jsonError(error instanceof ExercismProviderError ? error.message : "Exercism is temporarily unavailable.", 503);
    }
  }
  if (executionMode === "function" && !functionTestCases) {
    return jsonError("Function execution is not configured for this problem.", 501);
  }
  if (sourceCode.trim().length === 0) return jsonError("Add some code before running samples.", 400);
  if (byteLength(sourceCode) > maxSourceBytes) return jsonError("Source code must be 20 KB or smaller.", 413);

  if (executionMode === "stdio") {
    const inputs = problem.samples.map((sample) => sample.input);
    if (inputs.some((input) => byteLength(input) > maxSampleInputBytes)
      || inputs.reduce((total, input) => total + byteLength(input), 0) > maxTotalSampleInputBytes) {
      return jsonError("This problem’s sample input exceeds the execution limit.", 500);
    }
  }

  const configuredUrl = process.env.JUDGE0_API_URL?.trim();
  if (!configuredUrl) {
    return NextResponse.json({ error: "Code execution is not configured. Set JUDGE0_API_URL on the server to enable sample runs." }, { status: 503 });
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredUrl);
    if (!["https:", "http:"].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
      return jsonError("JUDGE0_API_URL must be a valid HTTP(S) base URL without credentials or query parameters.", 500);
    }
  } catch {
    return jsonError("JUDGE0_API_URL must be a valid HTTP(S) base URL.", 500);
  }

  const languageConfiguration = language === "python3"
    ? { value: process.env.JUDGE0_PYTHON3_LANGUAGE_ID ?? "92", name: "JUDGE0_PYTHON3_LANGUAGE_ID" }
    : { value: process.env.JUDGE0_CPP17_LANGUAGE_ID ?? "54", name: "JUDGE0_CPP17_LANGUAGE_ID" };
  const languageId = Number.parseInt(languageConfiguration.value, 10);
  if (!Number.isInteger(languageId) || languageId < 1) {
    return jsonError(`${languageConfiguration.name} must be a positive integer.`, 500);
  }

  const headers = new Headers({ Accept: "application/json" });
  const apiKey = process.env.JUDGE0_API_KEY?.trim();
  if (apiKey) headers.set("X-Auth-Token", apiKey);

  const judge0Url = baseUrl.origin + baseUrl.pathname.replace(/\/$/, "");
  const results = executionMode === "function"
    ? await Promise.all(functionTestCases!.map((testCase, index) => executeFunctionCase(
      judge0Url,
      headers,
      languageId,
      language,
      problem.kind === "exercism" ? problem.adapterId : problem.slug,
      sourceCode,
      testCase,
    ).then((result) => {
      if (testCase.publicExampleIndex === undefined) {
        return { caseNumber: index + 1, passed: result.passed };
      }
      const sample = problem.samples[testCase.publicExampleIndex];
      if (!sample) return { caseNumber: index + 1, passed: result.passed };
      return {
        caseNumber: index + 1,
        name: sample.name,
        input: sample.input,
        expectedOutput: sample.expectedOutput,
        actualOutput: result.actualOutput,
        passed: result.passed,
        error: result.error,
        verdict: result.verdict,
      };
    })))
    : await Promise.all(problem.samples.map(async (sample, index) => ({
      name: sample.name,
      caseNumber: index + 1,
      input: sample.input,
      expectedOutput: sample.expectedOutput,
      ...await executeSample(judge0Url, headers, languageId, sourceCode, sample.input, sample.expectedOutput),
    })));

  const passedCount = results.filter((result) => result.passed).length;
  const failedResult = results.find((result) => !result.passed);
  const diagnosticResult = results.find((result) => result.error && result.verdict && ["compilation_error", "runtime_error", "time_limit_exceeded", "service_error"].includes(result.verdict));
  const executionDiagnostic = diagnosticResult?.error?.slice(0, 8_000) ?? null;
  const status = !failedResult
    ? "sample_passed"
    : failedResult.verdict && failedResult.verdict !== "accepted"
      ? failedResult.verdict
      : "sample_failed";

  try {
    await getDatabase().insert(problemSubmissions).values({
      id: randomUUID(),
      userId: session.user.id,
      problemSlug: problem.slug,
      language,
      sourceCode,
      executionDiagnostic,
      status,
      passedCount,
      totalCount: results.length,
      isSampleRun: true,
    });

    return NextResponse.json(
      { results, history: { saved: true } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("[SampleRun] Could not save the authenticated user's sample-run history.");
    return NextResponse.json(
      { results, history: { saved: false, error: "The sample run completed, but its history could not be saved." } },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
