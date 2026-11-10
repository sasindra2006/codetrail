/* eslint-disable @typescript-eslint/no-require-imports */
require("@next/env").loadEnvConfig(process.cwd());

const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const originalLoad = Module._load;
let historyWrites = 0;
const mockDatabase = { insert: () => ({ values: async () => { historyWrites += 1; } }) };
const mockSchema = { problemSubmissions: { id: 1, problemSlug: 1, userId: 1, language: 1, status: 1, passedCount: 1, totalCount: 1, createdAt: 1, isSampleRun: 1 } };

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  module._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};
require.extensions[".tsx"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  module._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
};

Module._load = function loadWithProjectAliases(request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "@/lib/auth-server") return { getSession: async () => ({ user: { id: "problems-verification" } }), requireSession: async () => undefined };
  if (request === "next/navigation") return { notFound: () => { throw new Error("Unexpected notFound during workspace verification"); } };
  if (request === "./problem-workspace" && parent?.filename?.endsWith(`${path.sep}problems${path.sep}[slug]${path.sep}page.tsx`)) {
    return { ProblemWorkspace: function ProblemWorkspace() {} };
  }
  if (request === "@/lib/db") return { getDatabase: () => mockDatabase };
  if (request === "@/lib/db/schema") return mockSchema;
  if (request === "drizzle-orm") return { and: () => 0, desc: () => 0, eq: () => 0 };
  if (request.startsWith("@/")) {
    request = path.join(process.cwd(), "src", request.slice(2));
    if (!request.endsWith(".json")) request += ".ts";
  }
  return originalLoad.call(this, request, parent, isMain);
};

const problemModule = require(path.resolve("src/lib/problems.ts"));
const { internalProblems, findInternalProblem } = problemModule;
const priorOriginalSlugs = new Set(["two-sum", "maximum-subarray-sum", "missing-number", "reverse-words", "valid-palindrome"]);
const verificationScope = process.env.VERIFY_PROBLEMS_SCOPE;
const verificationProblems = internalProblems.filter((problem) => !priorOriginalSlugs.has(problem.slug)
  && (verificationScope === "graphs"
    ? problem.topics.includes("Graphs")
    : verificationScope === "structural"
      ? problem.topics.some((topic) => ["Trees", "Linked Lists", "Backtracking"].includes(topic))
    : !verificationScope || verificationScope.split(",").includes(problem.slug)));
const references = require(path.resolve("src/lib/problem-reference-solutions.ts")).originalProblemReferenceSolutions;
const runSamples = require(path.resolve("src/app/api/run-samples/route.ts")).POST;
const submit = require(path.resolve("src/app/api/problems/[slug]/submissions/route.ts")).POST;
const getCatalog = require(path.resolve("src/app/api/problems/route.ts")).GET;
const internalWorkspacePage = require(path.resolve("src/app/(app)/problems/[slug]/page.tsx")).default;

function request(body) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function judgeCall(run) {
  let last;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    last = await run();
    const transient = last.status === "service_error"
      || last.status === "internal_judge_error"
      || last.body?.verdict === "internal_judge_error"
      || last.body?.results?.some((result) => result.verdict === "service_error");
    if (!transient) return last;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  return last;
}

async function main() {
  const catalogResponse = await getCatalog();
  const catalog = await catalogResponse.json();
  const keys = catalog.problems.map((problem) => problem.key);
  const hrefs = catalog.problems.map((problem) => problem.href);
  const internalSlugs = internalProblems.map((problem) => problem.slug);
  const titles = catalog.problems.map((problem) => problem.title.trim().toLocaleLowerCase());
  if (catalogResponse.status !== 200 || catalog.problems.length !== 80
    || new Set(keys).size !== keys.length || new Set(hrefs).size !== hrefs.length
    || new Set(internalSlugs).size !== internalSlugs.length || new Set(titles).size !== titles.length) {
    throw new Error(`Catalog check failed: status=${catalogResponse.status}, entries=${catalog.problems?.length}, originals=${internalProblems.length}, keys=${new Set(keys).size}, duplicateKeys=${keys.filter((key, index) => keys.indexOf(key) !== index).join(",")}`);
  }
  const difficultyCounts = internalProblems.reduce((counts, problem) => {
    counts[problem.difficulty] = (counts[problem.difficulty] ?? 0) + 1;
    return counts;
  }, {});
  const topicCounts = internalProblems.reduce((counts, problem) => {
    for (const topic of new Set(problem.topics)) counts[topic] = (counts[topic] ?? 0) + 1;
    return counts;
  }, {});
  console.log(`CodeTrail originals by difficulty (Exercism difficulty is unassigned): ${Object.entries(difficultyCounts).map(([name, count]) => `${name} ${count}`).join(", ")}.`);
  console.log(`CodeTrail originals by topic: ${Object.entries(topicCounts).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => `${name} ${count}`).join(", ")}.`);

  let sampleCount = 0;
  let hiddenCount = 0;
  let wrongAnswerCount = 0;
  let duplicateResultCount = 0;
  for (const problem of verificationProblems) {
    if (findInternalProblem(problem.slug) !== problem || !catalog.problems.some((item) => item.href === `/problems/${problem.slug}`)) {
      throw new Error(`Workspace listing is missing ${problem.slug}`);
    }
    const workspace = await internalWorkspacePage({ params: Promise.resolve({ slug: problem.slug }) });
    if (workspace.props.problem.slug !== problem.slug) throw new Error(`Workspace route failed for ${problem.slug}`);
    for (const language of ["cpp17", "python3"]) {
      const sourceCode = references[problem.slug]?.[language];
      if (!sourceCode) throw new Error(`Missing ${language} reference for ${problem.slug}`);

      const sample = await judgeCall(async () => {
        const response = await runSamples(request({ slug: problem.slug, language, sourceCode }));
        return { status: response.status === 200 ? "ok" : "service_error", response, body: await response.json() };
      });
      const samplePassed = sample.body.results?.filter((result) => result.passed).length ?? 0;
      const sampleTotal = sample.body.results?.length ?? 0;
      if (sample.status !== "ok" || sampleTotal === 0 || samplePassed !== sampleTotal) {
        throw new Error(`Samples failed for ${problem.slug}/${language}: ${samplePassed}/${sampleTotal}; ${JSON.stringify(sample.body)}`);
      }
      sampleCount += sampleTotal;

      const full = await judgeCall(async () => {
        const response = await submit(request({ language, sourceCode }), { params: Promise.resolve({ slug: problem.slug }) });
        return { status: response.status === 200 ? "ok" : "internal_judge_error", response, body: await response.json() };
      });
      const result = full.body;
      if (full.status !== "ok" || result.verdict !== "accepted" || result.passedCount !== result.totalCount || !result.historySaved) {
        throw new Error(`Full suite failed for ${problem.slug}/${language}: ${JSON.stringify(result)}`);
      }
      hiddenCount += result.totalCount - sampleTotal;

      if (language === "python3") {
        const wrongSource = `class Solution:\n    def ${problem.functionSignature?.name ?? "solve"}(self, *args):\n        return None`;
        const wrongResponse = await submit(request({ language: "python3", sourceCode: wrongSource }), { params: Promise.resolve({ slug: problem.slug }) });
        const wrong = await wrongResponse.json();
        if (wrongResponse.status !== 200 || wrong.verdict !== "wrong_answer") {
          throw new Error(`Wrong-answer check failed for ${problem.slug}: ${wrong.verdict}`);
        }
        wrongAnswerCount += 1;
        if (problem.topics.includes("Backtracking")) {
          const duplicateSource = `class Solution:\n    def ${problem.functionSignature?.name ?? "solve"}(self, *args):\n        return [[], []]`;
          const duplicateResponse = await submit(request({ language: "python3", sourceCode: duplicateSource }), { params: Promise.resolve({ slug: problem.slug }) });
          const duplicate = await duplicateResponse.json();
          if (duplicateResponse.status !== 200 || duplicate.verdict !== "wrong_answer") {
            throw new Error(`Duplicate-output check failed for ${problem.slug}: ${duplicate.verdict}`);
          }
          duplicateResultCount += 1;
        }
      }
    }
    console.log(`${problem.slug}: C++17 and Python 3 passed samples and full suites`);
  }

  const expectedWrites = verificationProblems.length * 5;
  if (historyWrites < expectedWrites) throw new Error(`History write mock count ${historyWrites}; expected at least ${expectedWrites}`);
  console.log(`Catalog: ${catalog.problems.length} unique entries (${internalProblems.length} CodeTrail originals).`);
  console.log(`Reverified ${verificationProblems.length} newly added CodeTrail originals; the five earlier originals were left out of this run.`);
  console.log(`Executed ${sampleCount} sample cases, ${hiddenCount} hidden cases, and ${wrongAnswerCount} Wrong Answer checks.`);
  if (duplicateResultCount) console.log(`Rejected ${duplicateResultCount} duplicate-result backtracking submissions.`);
  console.log(`Submission history: ${historyWrites} mocked writes; live database persistence was not tested.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
