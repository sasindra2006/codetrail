import { NextResponse } from "next/server";
import { findInternalProblem } from "@/lib/problems";

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

async function executeSample(
  baseUrl: string,
  headers: HeadersInit,
  languageId: number,
  sourceCode: string,
  input: string,
  expectedOutput: string,
) {
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

      return {
        passed: false,
        actualOutput: "",
        error: `Judge0 rejected the submission (HTTP ${created.status}). Check the dev server terminal.`,
      };
    }

    const createdResult: unknown = await created.json();
    const token = typeof createdResult === "object" && createdResult !== null
      ? (createdResult as { token?: unknown }).token
      : null;
    if (typeof token !== "string" || !/^[a-zA-Z0-9-]+$/.test(token)) {
      return { passed: false, actualOutput: "", error: "Judge0 returned an invalid run token." };
    }

    let result: Judge0Submission | null = null;
    for (let attempt = 0; attempt < maxPolls; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      result = await readSubmission(baseUrl, token, headers);
      if (!result) return { passed: false, actualOutput: "", error: "Judge0 could not return this run result." };
      const id = statusId(result);
      if (id !== null && id >= 3) break;
    }

    const actualOutput = decodeBase64(result?.stdout).slice(0, 8_000);
    const compileOutput = decodeBase64(result?.compile_output).slice(0, 8_000);
    const stderr = decodeBase64(result?.stderr).slice(0, 8_000);
    const message = decodeBase64(result?.message).slice(0, 8_000);
    const id = result ? statusId(result) : null;
    if (id === null || id < 3) {
      return { passed: false, actualOutput, error: "This sample exceeded the execution wait limit. Try again shortly." };
    }
    if (id === 6) {
      return { passed: false, actualOutput, error: compileOutput || "Compilation failed." };
    }
    if (id !== 3 && id !== 4) {
      const details = stderr || message;
      return { passed: false, actualOutput, error: details || (typeof result?.status?.description === "string" ? result.status.description : "The program did not finish successfully.") };
    }

    const passed = normalizedOutput(actualOutput) === normalizedOutput(expectedOutput);
    return {
      passed,
      actualOutput,
      error: passed ? null : "Output did not match the expected result.",
    };
  } catch {
    return { passed: false, actualOutput: "", error: "The execution service did not respond in time. Please try again." };
  }
}

export async function POST(request: Request) {
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
  const { slug, sourceCode } = body as { slug?: unknown; sourceCode?: unknown };
  if (typeof slug !== "string" || typeof sourceCode !== "string") {
    return jsonError("Send a problem slug and source code.", 400);
  }
  const problem = findInternalProblem(slug);
  if (!problem) return jsonError("That CodeTrail problem could not be found.", 404);
  if (sourceCode.trim().length === 0) return jsonError("Add some C++ code before running samples.", 400);
  if (byteLength(sourceCode) > maxSourceBytes) return jsonError("Source code must be 20 KB or smaller.", 413);

  const inputs = problem.samples.map((sample) => sample.input);
  if (inputs.some((input) => byteLength(input) > maxSampleInputBytes)
    || inputs.reduce((total, input) => total + byteLength(input), 0) > maxTotalSampleInputBytes) {
    return jsonError("This problem’s sample input exceeds the execution limit.", 500);
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

  const languageId = Number.parseInt(process.env.JUDGE0_CPP17_LANGUAGE_ID ?? "54", 10);
  if (!Number.isInteger(languageId) || languageId < 1) return jsonError("JUDGE0_CPP17_LANGUAGE_ID must be a positive integer.", 500);

  const headers = new Headers({ Accept: "application/json" });
  const apiKey = process.env.JUDGE0_API_KEY?.trim();
  if (apiKey) headers.set("X-Auth-Token", apiKey);

  const results = await Promise.all(problem.samples.map(async (sample) => ({
    name: sample.name,
    expectedOutput: sample.expectedOutput,
    ...await executeSample(baseUrl.origin + baseUrl.pathname.replace(/\/$/, ""), headers, languageId, sourceCode, sample.input, sample.expectedOutput),
  })));

  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
