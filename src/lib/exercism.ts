import "server-only";

import type {
  ExercismProblem,
  ExercismTrackMetadata,
  FunctionTestCase,
  ExercismAdapterId,
  ExercismAdapterContract,
  SupportedLanguage,
} from "@/lib/problems";
import reviewManifest from "@/lib/exercism/review-manifest.json";

const problemSpecificationsSha = reviewManifest.problemSpecificationsSha;
const pythonTrackSha = reviewManifest.exercises["binary-search"].tracks.python3.sha;
const cppTrackSha = reviewManifest.exercises["binary-search"].tracks.cpp17.sha;

const problemSpecificationsLicense = `https://github.com/exercism/problem-specifications/blob/${problemSpecificationsSha}/LICENSE`;
const pythonLicense = `https://github.com/exercism/python/blob/${pythonTrackSha}/LICENSE`;
const cppLicense = `https://github.com/exercism/xcpp/blob/${cppTrackSha}/LICENSE`;
const mitCopyright = "Copyright (c) 2014, 2019, 2021 Exercism";
const mitTerms = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

function mitNotice(copyright: string) {
  return `MIT License\n\n${copyright}\n\n${mitTerms}`;
}

type ReviewedTrack = {
  repository: "python" | "xcpp";
  sha: string;
  uuid: string;
  track: ExercismTrackMetadata["track"];
  difficulty: number | null;
  concepts: string[];
  starterPath: string;
  testFile: string;
};

type ReviewedExercise = {
  status: "discovered" | "needs_review" | "approved" | "playable" | "excluded";
  adapterId: ExercismAdapterId;
  review: {
    instructions: { status: "approved"; sourceName: string; sourceUrl: string; license: "MIT" | "CC BY-SA 4.0" | "CodeTrail original"; licenseUrl: string };
    tests: { status: "approved"; sourceUrl: string; license: "MIT"; licenseUrl: string };
    adapters: { status: "playable"; verifiedLanguages: SupportedLanguage[]; verificationNote: string };
  };
  slug: string;
  title: string;
  metadataSourceName: string | null;
  metadataSourceUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  statementLicense: "MIT" | "CC BY-SA 4.0";
  statementLicenseUrl: string;
  statementPath?: string;
  originalStatement?: string;
  publicExampleUuid: string;
  statementChanges: string;
  tracks: Partial<Record<SupportedLanguage, ReviewedTrack>>;
};

// This allowlist was reviewed against the corresponding track config files at
// the pinned commits. Difficulty and concepts remain track-specific metadata.
const reviewedExercises = reviewManifest.exercises as unknown as Record<string, ReviewedExercise>;

type CanonicalCase = {
  uuid: string;
  description: string;
  input: Record<string, unknown>;
  expected: unknown;
};

type TrackExerciseConfig = {
  authors?: unknown;
  contributors?: unknown;
  blurb?: unknown;
  source?: unknown;
  source_url?: unknown;
  files?: { solution?: unknown; test?: unknown };
};

export class ExercismProviderError extends Error {
  constructor(message: string, readonly statusCode = 503) {
    super(message);
    this.name = "ExercismProviderError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function rawFileUrl(repository: string, sha: string, path: string) {
  return `https://raw.githubusercontent.com/exercism/${repository}/${sha}/${path}`;
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(Math.max(seconds * 1000, 100), 1_500);
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.min(Math.max(dateDelay, 100), 1_500);
  }

  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (response.status === 403 && Number(response.headers.get("x-ratelimit-remaining")) === 0 && Number.isFinite(reset)) {
    return Math.min(Math.max(reset * 1000 - Date.now(), 100), 1_500);
  }
  return 250 * (attempt + 1);
}

async function fetchPinnedText(repository: string, sha: string, path: string, maxBytes = 128_000) {
  const url = rawFileUrl(repository, sha, path);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "text/plain" },
        next: { revalidate: 86_400 },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      if (attempt === 1) throw new ExercismProviderError("Exercism could not be reached. Please try again.");
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      continue;
    }

    if (response.ok) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > maxBytes) {
        throw new ExercismProviderError("The requested Exercism file exceeded the size limit.", 502);
      }
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }

    const retryable = response.status === 429 || response.status === 403 || response.status >= 500;
    if (!retryable || attempt === 1) {
      throw new ExercismProviderError(
        response.status === 404
          ? "The reviewed Exercism file is no longer available."
          : "Exercism is temporarily unavailable. Please try again.",
        response.status === 404 ? 404 : 503,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
  }
  throw new ExercismProviderError("Exercism is temporarily unavailable. Please try again.");
}

function parseTomlString(source: string, key: string): string | null {
  const match = new RegExp(`^${key}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")\\s*$`, "m").exec(source);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as string;
  } catch {
    return null;
  }
}

function parseTrackConfig(source: string): TrackExerciseConfig {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw new ExercismProviderError("Exercism returned invalid exercise metadata.", 502);
  }
  if (!isRecord(value)) throw new ExercismProviderError("Exercism returned invalid exercise metadata.", 502);
  return value as TrackExerciseConfig;
}

function parseTestsToml(source: string) {
  const ids = [...source.matchAll(/^\[([0-9a-f-]{36})\]\s*$/gim)].map((match) => match[1].toLowerCase());
  if (ids.length === 0 || new Set(ids).size !== ids.length) {
    throw new ExercismProviderError("Exercism returned invalid test metadata.", 502);
  }
  return new Set(ids);
}

function parseCanonicalData(source: string, exercise: ReviewedExercise): CanonicalCase[] {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw new ExercismProviderError("Exercism returned invalid canonical test data.", 502);
  }
  if (!isRecord(value) || !Array.isArray(value.cases) || value.cases.length === 0 || value.cases.length > 100) {
    throw new ExercismProviderError("Exercism returned invalid canonical test data.", 502);
  }

  return value.cases.map((entry): CanonicalCase => {
    if (!isRecord(entry) || typeof entry.uuid !== "string" || typeof entry.description !== "string" || !isRecord(entry.input)) {
      throw new ExercismProviderError("Exercism returned invalid canonical test data.", 502);
    }
    const input = entry.input;
    const expected = entry.expected;
    let valid = false;
    if (exercise.adapterId === "binary-search-index") {
      valid = Array.isArray(input.array) && input.array.every(Number.isSafeInteger) && Number.isSafeInteger(input.value)
        && (Number.isSafeInteger(expected) || (isRecord(expected) && expected.error === "value not in array"));
    } else if (exercise.adapterId === "integer-to-prime-list") {
      valid = Number.isSafeInteger(input.limit) && Number(input.limit) >= 1 && Array.isArray(expected)
        && expected.every((number) => Number.isSafeInteger(number) && Number(number) >= 2);
    } else if (exercise.adapterId === "string-to-bracket-balance") {
      valid = typeof input.value === "string" && typeof expected === "boolean";
    } else if (exercise.adapterId === "two-int-lists-to-relation") {
      valid = Array.isArray(input.listOne) && input.listOne.every(Number.isSafeInteger)
        && Array.isArray(input.listTwo) && input.listTwo.every(Number.isSafeInteger)
        && ["equal", "sublist", "superlist", "unequal"].includes(String(expected));
    } else if (exercise.adapterId === "integer-base-reencoding") {
      valid = Number.isSafeInteger(input.inputBase) && Number.isSafeInteger(input.outputBase)
        && Array.isArray(input.digits) && input.digits.every(Number.isSafeInteger)
        && ((Array.isArray(expected) && expected.every(Number.isSafeInteger)) || (isRecord(expected) && typeof expected.error === "string"));
    } else if (getExercismAdapter(exercise.adapterId)?.strategy === "string-grid-transform") {
      const key = getExercismAdapter(exercise.adapterId)?.inputParameter;
      valid = typeof key === "string" && Array.isArray(input[key]) && input[key].every((row) => typeof row === "string")
        && Array.isArray(expected) && expected.every((row) => typeof row === "string");
    } else if (exercise.adapterId === "domino-chain-check") {
      valid = Array.isArray(input.dominoes) && input.dominoes.every((tile) => Array.isArray(tile) && tile.length === 2 && tile.every(Number.isSafeInteger))
        && typeof expected === "boolean";
    }
    if (!valid) throw new ExercismProviderError("Exercism returned an unsupported canonical test case.", 502);
    return { uuid: entry.uuid.toLowerCase(), description: entry.description, input, expected };
  });
}

async function loadTrackData(exercise: ReviewedExercise, language: SupportedLanguage) {
  const track = exercise.tracks[language];
  if (!track) throw new ExercismProviderError("This language track is unavailable for the reviewed exercise.", 404);
  const folder = `exercises/practice/${exercise.slug}`;
  const configPath = `${folder}/.meta/config.json`;
  const testsPath = `${folder}/.meta/tests.toml`;
  const [configText, testSelection, starterFile] = await Promise.all([
    fetchPinnedText(track.repository, track.sha, configPath, 32_000),
    fetchPinnedText(track.repository, track.sha, testsPath, 16_000),
    fetchPinnedText(track.repository, track.sha, track.starterPath, 8_000),
  ]);
  const config = parseTrackConfig(configText);
  const solutionFile = track.starterPath.split("/").at(-1);
  const testFile = track.testFile;
  const expectedBlurb = exercise.adapterId === "binary-search-index" ? "Implement a binary search algorithm." : null;
  if (!Array.isArray(config.files?.solution) || !config.files.solution.includes(solutionFile)
    || !Array.isArray(config.files?.test) || !config.files.test.includes(testFile)
    || typeof config.blurb !== "string"
    || (expectedBlurb !== null && config.blurb !== expectedBlurb)
    || (exercise.metadataSourceName !== null && config.source !== exercise.metadataSourceName)
    || (exercise.metadataSourceUrl !== null && config.source_url !== exercise.metadataSourceUrl)
    || (exercise.metadataSourceName === null && config.source !== undefined)
    || (exercise.metadataSourceUrl === null && config.source_url !== undefined)) {
    throw new ExercismProviderError("This Exercism exercise no longer matches its reviewed metadata.", 502);
  }
  let starterCode = starterFile;
  if (language === "cpp17") {
    if (!starterFile.includes(`#include "${exercise.slug.replaceAll("-", "_")}.h`)) {
      throw new ExercismProviderError("The reviewed C++ starter file changed unexpectedly.", 502);
    }
    const adapter = getExercismAdapter(exercise.adapterId);
    if (!adapter || typeof adapter.cppStarter !== "string") throw new ExercismProviderError("The reviewed C++ adapter has no starter template.", 502);
    starterCode = adapter.cppStarter;
  }
  const adapter = getExercismAdapter(exercise.adapterId);
  if (language === "python3" && (!adapter || typeof adapter.pythonFunction !== "string" || !new RegExp(`^def ${adapter.pythonFunction}\\s*\\(`, "m").test(starterCode))) {
    throw new ExercismProviderError("The reviewed Python starter code changed unexpectedly.", 502);
  }

  const metadata: ExercismTrackMetadata = {
    track: track.track,
    exerciseUuid: track.uuid,
    difficulty: track.difficulty,
    concepts: track.concepts,
    authors: strings(config.authors),
    contributors: strings(config.contributors),
    sourceUrl: `https://github.com/exercism/${track.repository}/tree/${track.sha}/${folder}`,
  };
  if (metadata.authors.length === 0) throw new ExercismProviderError("Exercism exercise attribution is unavailable.", 502);
  return { metadata, starterCode, testIds: parseTestsToml(testSelection) };
}

async function loadSharedData(exercise: ReviewedExercise) {
  const folder = `exercises/${exercise.slug}`;
  const [instructions, metadataText, canonicalText] = await Promise.all([
    exercise.statementPath
      ? fetchPinnedText("problem-specifications", problemSpecificationsSha, `${folder}/${exercise.statementPath}`, 32_000)
      : Promise.resolve(""),
    fetchPinnedText("problem-specifications", problemSpecificationsSha, `${folder}/metadata.toml`, 8_000),
    fetchPinnedText("problem-specifications", problemSpecificationsSha, `${folder}/canonical-data.json`, 64_000),
  ]);
  const title = parseTomlString(metadataText, "title");
  const sourceName = parseTomlString(metadataText, "source");
  const sourceUrl = parseTomlString(metadataText, "source_url");
  if (title !== exercise.title || sourceName !== exercise.metadataSourceName || sourceUrl !== exercise.metadataSourceUrl) {
    throw new ExercismProviderError("This Exercism exercise no longer matches its reviewed source attribution.", 502);
  }
  const cases = parseCanonicalData(canonicalText, exercise);
  const statement = exercise.originalStatement ?? instructions
    .replace(/~~~~exercism\/(caution|note)\s*\n([\s\S]*?)\n~~~~/g, (_match, kind: string, content: string) => `> **${kind === "caution" ? "Caution" : "Note"}:** ${content.trim()}`)
    .trim();
  return { statement, cases };
}

function toFunctionCases(exercise: ReviewedExercise, cases: CanonicalCase[], testIds: Set<string>): FunctionTestCase[] {
  const selected = cases.filter((testCase) => testIds.has(testCase.uuid));
  if (selected.length !== testIds.size || !selected.some((testCase) => testCase.uuid === exercise.publicExampleUuid)) {
    throw new ExercismProviderError("The reviewed Exercism test selection no longer matches canonical data.", 502);
  }
  return selected.map((testCase) => {
    let input: FunctionTestCase["input"];
    let expectedOutput: FunctionTestCase["expectedOutput"];
    if (exercise.adapterId === "binary-search-index") {
      const array = testCase.input.array as number[];
      const value = testCase.input.value as number;
      input = { kind: "binary-search", nums: array, target: value };
      expectedOutput = Number.isSafeInteger(testCase.expected)
        ? testCase.expected as number
        : isRecord(testCase.expected) && Number.isSafeInteger(testCase.expected.index)
          ? testCase.expected.index as number
          : null;
      if (isRecord(testCase.expected) && testCase.expected.error === "value not in array") {
        return { name: testCase.description, input, expectedOutput, expectedException: "value-not-found", ...(testCase.uuid === exercise.publicExampleUuid ? { publicExampleIndex: 0 } : {}) };
      }
    } else if (exercise.adapterId === "integer-to-prime-list") {
      input = { kind: "integer", value: testCase.input.limit as number };
      expectedOutput = testCase.expected as number[];
    } else if (exercise.adapterId === "string-to-bracket-balance") {
      input = { kind: "string", value: testCase.input.value as string };
      expectedOutput = testCase.expected as boolean;
    } else if (exercise.adapterId === "two-int-lists-to-relation") {
      input = { kind: "number-array-pair", first: testCase.input.listOne as number[], second: testCase.input.listTwo as number[] };
      expectedOutput = testCase.expected as string;
    } else if (exercise.adapterId === "integer-base-reencoding") {
      input = {
        kind: "integer-base-reencoding",
        inputBase: testCase.input.inputBase as number,
        digits: testCase.input.digits as number[],
        outputBase: testCase.input.outputBase as number,
      };
      expectedOutput = Array.isArray(testCase.expected) ? testCase.expected as number[] : null;
      if (isRecord(testCase.expected) && typeof testCase.expected.error === "string") {
        return { name: testCase.description, input, expectedOutput, expectedException: "invalid-argument", ...(testCase.uuid === exercise.publicExampleUuid ? { publicExampleIndex: 0 } : {}) };
      }
    } else if (getExercismAdapter(exercise.adapterId)?.strategy === "string-grid-transform") {
      const parameter = getExercismAdapter(exercise.adapterId)?.inputParameter;
      if (!parameter) throw new ExercismProviderError("The reviewed string-grid adapter has no input parameter.", 502);
      input = { kind: "string-grid-transform", inputParameter: parameter, rows: testCase.input[parameter] as string[] };
      expectedOutput = testCase.expected as string[];
    } else if (exercise.adapterId === "domino-chain-check") {
      input = { kind: "domino-chain-check", dominoes: testCase.input.dominoes as number[][] };
      expectedOutput = testCase.expected as boolean;
    } else {
      throw new ExercismProviderError("This exercise has no supported test adapter.", 501);
    }
    return { name: testCase.description, input, expectedOutput, ...(testCase.uuid === exercise.publicExampleUuid ? { publicExampleIndex: 0 } : {}) };
  });
}

export function getReviewedExercismExercise(slug: string) {
  if (!slug.startsWith("exercism:")) return null;
  const exercise = reviewedExercises[slug.slice("exercism:".length)];
  return exercise?.status === "playable" ? exercise : null;
}

export function getExercismAdapter(adapterId: string): ExercismAdapterContract | null {
  const adapters = reviewManifest.adapters as unknown as Record<string, ExercismAdapterContract>;
  return adapters[adapterId] ?? null;
}

export function getExercismProblemTitle(slug: string) {
  const exercise = getReviewedExercismExercise(slug);
  return exercise ? `${exercise.title} · Exercism` : null;
}

export function getExercismListings() {
  return Object.values(reviewedExercises).filter((exercise) => exercise.status === "playable").map((exercise) => ({
    key: `exercism:${exercise.slug}`,
    source: "exercism" as const,
    title: exercise.title,
    href: `/problems/exercism/${exercise.slug}`,
    difficulty: null,
    trackDifficulties: Object.fromEntries(Object.entries(exercise.tracks).map(([language, track]) => [language, track?.difficulty ?? null])),
    languages: (["cpp17", "python3"] as const).filter((language) => Boolean(exercise.tracks[language])),
    topics: [...new Set(Object.values(exercise.tracks).flatMap((track) => track?.concepts ?? []))],
    problemId: exercise.slug,
  }));
}

export async function getExercismProblem(slug: string): Promise<ExercismProblem | null> {
  const exercise = getReviewedExercismExercise(slug);
  if (!exercise) return null;
  const languages = (["cpp17", "python3"] as const).filter((language) => exercise.tracks[language]);
  const [shared, ...tracks] = await Promise.all([
    loadSharedData(exercise),
    ...languages.map((language) => loadTrackData(exercise, language)),
  ]);
  const trackByLanguage = new Map(languages.map((language, index) => [language, tracks[index]]));
  const casesByLanguage = new Map(languages.map((language) => [language, toFunctionCases(exercise, shared.cases, trackByLanguage.get(language)!.testIds)]));
  const publicCase = casesByLanguage.get(languages[0])?.find((testCase) => testCase.publicExampleIndex === 0);
  if (!publicCase) {
    throw new ExercismProviderError("The public Exercism example is unavailable.", 502);
  }
  const input = publicCase.input;
  let publicSampleInput: string;
  if (input.kind === "binary-search") publicSampleInput = `search_list = [${input.nums.join(", ")}], value = ${input.target}`;
  else if (input.kind === "integer-base-reencoding") publicSampleInput = `input_base = ${input.inputBase}, digits = [${input.digits.join(", ")}], output_base = ${input.outputBase}`;
  else if (input.kind === "integer") publicSampleInput = `limit = ${input.value}`;
  else if (input.kind === "number-array-pair") publicSampleInput = `list_one = ${JSON.stringify(input.first)}, list_two = ${JSON.stringify(input.second)}`;
  else if (input.kind === "string") publicSampleInput = `input_string = ${JSON.stringify(input.value)}`;
  else if (input.kind === "string-grid-transform") publicSampleInput = `${input.inputParameter} = ${JSON.stringify(input.rows)}`;
  else if (input.kind === "domino-chain-check") publicSampleInput = `dominoes = ${JSON.stringify(input.dominoes)}`;
  else throw new ExercismProviderError("The public Exercism example has an unsupported input.", 502);
  const publicSample = {
    name: publicCase.name,
    input: publicSampleInput,
    expectedOutput: typeof publicCase.expectedOutput === "string" ? publicCase.expectedOutput : JSON.stringify(publicCase.expectedOutput),
  };
  const starters = Object.fromEntries([...trackByLanguage].map(([language, track]) => [language, track!.starterCode])) as Partial<Record<SupportedLanguage, string>>;
  const metadata = Object.fromEntries([...trackByLanguage].map(([language, track]) => [language, track!.metadata])) as Partial<Record<SupportedLanguage, ExercismTrackMetadata>>;
  return {
    kind: "exercism",
    adapterId: exercise.adapterId,
    slug: `exercism:${exercise.slug}`,
    exerciseSlug: exercise.slug,
    title: exercise.title,
    statement: shared.statement,
    constraints: [],
    samples: [publicSample],
    explanation: "",
    topics: [],
    difficulty: null,
    executionMode: "function",
    supportedLanguages: languages,
    languageStarters: starters,
    trackMetadata: metadata,
    sourceName: exercise.sourceName,
    sourceUrl: exercise.sourceUrl,
    statementLicense: exercise.statementLicense,
    statementLicenseUrl: exercise.statementLicenseUrl,
    statementChanges: exercise.statementChanges,
    exerciseLicense: "MIT",
    exerciseLicenseUrls: [pythonLicense, cppLicense],
    exerciseLicenseNotices: {
      python3: mitNotice("Copyright (c) 2021 Exercism"),
      cpp17: mitNotice("Copyright (c) 2021 Exercism"),
    },
    testDataLicense: "MIT",
    testDataLicenseUrl: problemSpecificationsLicense,
    testDataSourceUrl: `https://github.com/exercism/problem-specifications/blob/${problemSpecificationsSha}/exercises/${exercise.slug}/canonical-data.json`,
    testDataLicenseNotice: mitNotice(mitCopyright),
  };
}

export async function getExercismFunctionTestCases(
  slug: string,
  language: SupportedLanguage,
  includeCanonicalCases: boolean,
): Promise<FunctionTestCase[] | null> {
  const exercise = getReviewedExercismExercise(slug);
  if (!exercise || !exercise.tracks[language]) return null;
  const [shared, track] = await Promise.all([
    loadSharedData(exercise),
    loadTrackData(exercise, language),
  ]);
  const testCases = toFunctionCases(exercise, shared.cases, track.testIds);
  return includeCanonicalCases ? testCases : testCases.filter((testCase) => testCase.publicExampleIndex !== undefined);
}
