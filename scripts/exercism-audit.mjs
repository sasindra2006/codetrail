import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = path.join(root, "src/lib/exercism/discovery-snapshot.json");
const manifestPath = path.join(root, "src/lib/exercism/review-manifest.json");
const outputPath = path.join(root, "src/lib/exercism/audit-report.json");
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const responseCache = new Map();

async function fetchText(url, maxBytes) {
  if (responseCache.has(url)) return responseCache.get(url);
  const task = (async () => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let response;
      try {
        response = await fetch(url, {
          headers: { Accept: "text/plain", "User-Agent": "CodeTrail-Exercism-Review" },
          signal: AbortSignal.timeout(15_000),
        });
      } catch (error) {
        if (attempt === 3) return { text: null, error: `network: ${error instanceof Error ? error.message : "unknown error"}` };
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        continue;
      }
      if (response.status === 404) return { text: null, error: "missing file (HTTP 404)" };
      if (response.ok) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.byteLength > maxBytes) return { text: null, error: `file exceeds audit limit (${bytes.byteLength} > ${maxBytes} bytes)` };
        try { return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), error: null }; }
        catch { return { text: null, error: "file is not valid UTF-8" }; }
      }
      if (![403, 429].includes(response.status) && response.status < 500) return { text: null, error: `HTTP ${response.status}` };
      if (attempt === 3) return { text: null, error: `HTTP ${response.status} after retries` };
      const retry = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retry) && retry > 0 ? Math.min(retry * 1000, 8_000) : 500 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return { text: null, error: "request retries exhausted" };
  })();
  responseCache.set(url, task);
  return task;
}

async function mapLimit(rows, limit, fn) {
  const results = new Array(rows.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, rows.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= rows.length) return;
      results[index] = await fn(rows[index]);
    }
  }));
  return results;
}

function selectedIds(text) {
  return [...(text.matchAll(/^\[([0-9a-f-]{36})\]\s*$/gim))].map((match) => match[1].toLowerCase());
}

function canonicalIds(value) {
  const ids = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    if (typeof node.uuid === "string") ids.push(node.uuid.toLowerCase());
    for (const child of Object.values(node)) visit(child);
  };
  visit(value);
  return [...new Set(ids)];
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueShape(value, depth = 0) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (!value.length) return "array<empty>";
    const shapes = [...new Set(value.slice(0, 5).map((entry) => valueShape(entry, depth + 1)))];
    return `array<${shapes.join(" | ")}>`;
  }
  if (typeof value === "object") {
    if (depth >= 2) return "object";
    return `object{${Object.keys(value).sort().join(",")}}`;
  }
  return typeof value;
}

function externalSource(name, url) {
  if (!name && !url) return false;
  if (/exercism problem specifications|exercism exercise|exercism's classic introductory/i.test(name ?? "")
    && (!url || url.includes("github.com/exercism/problem-specifications"))) return false;
  return Boolean(url) || Boolean(name && !/^exercism$/i.test(name));
}

function dsaRelevance(exercise, instructions) {
  const concepts = Object.values(exercise.tracks).flatMap((track) => track.concepts ?? []).map((value) => value.toLowerCase());
  const title = (exercise.title ?? exercise.slug).toLowerCase();
  const body = (instructions ?? "").slice(0, 15_000).toLowerCase();
  const conceptDsa = new Set(["algorithms", "arrays", "data_structures", "lists", "maps", "pairs", "pointers", "searching", "sequences", "stacks"]);
  const titleDsa = /array|list|tree|graph|matrix|stack|queue|heap|sort|search|prime|factor|knapsack|path|sublist|linked|spiral|sieve|bracket|binary|palindrome|permutation|combination|substring|substring|word search|two.?bucket|domino|pasc/.test(title);
  const textDsa = /data structure|binary search|linked list|breadth.first|depth.first|sorting algorithm|graph traversal|dynamic programming|stack and queue|subsequence|sublist|matrix|prime factor|sieve of eratosthenes/.test(body);
  return concepts.some((concept) => conceptDsa.has(concept)) || titleDsa || textDsa
    ? { classification: "dsa_relevant", evidence: { concepts: [...new Set(concepts.filter((concept) => conceptDsa.has(concept)))], titleMatch: titleDsa, instructionMatch: textDsa } }
    : { classification: "other_programming", evidence: { concepts: [...new Set(concepts)], titleMatch: false, instructionMatch: false } };
}

const pinnedLicenses = Object.fromEntries(await Promise.all([
  ["python", snapshot.repositories.python3],
  ["xcpp", snapshot.repositories.cpp17],
  ["problemSpecifications", { repository: "problem-specifications", sha: snapshot.problemSpecificationsSha }],
].map(async ([key, repo]) => {
  const file = await fetchText(`https://raw.githubusercontent.com/exercism/${repo.repository}/${repo.sha}/LICENSE`, 32_000);
  return [key, {
    revision: repo.sha,
    available: Boolean(file.text),
    isMit: Boolean(file.text && /Permission is hereby granted, free of charge/i.test(file.text) && /THE SOFTWARE IS PROVIDED "AS IS"/i.test(file.text)),
    bytes: Buffer.byteLength(file.text ?? ""),
    error: file.error,
  }];
})));

function statementSignature(source) {
  const python = [...source.matchAll(/^\s*def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?:/gm)].map((match) => ({ name: match[1], parameters: match[2].trim(), returns: match[3]?.trim() ?? null }));
  const cpp = [...source.matchAll(/(?:^|\n)\s*(?:(?:static|inline|virtual)\s+)*(?:const\s+)?([\w:]+(?:\s*<[^;{}]+>)?(?:\s*[*&])?)\s+([A-Za-z_]\w*)\s*\(([^;{}]*)\)\s*(?:const\s*)?(?:\{|;)/g)].map((match) => ({ returnType: match[1].trim(), name: match[2], parameters: match[3].trim() }));
  return { python, cpp };
}

function adapterFamily(inputShape, expectedShape, customTypes, exerciseSlug) {
  if (inputShape.includes("operations") || /bank-account|robot-simulator|circular-buffer|custom-set/.test(exerciseSlug)) return "stateful-object-or-operation-sequence";
  if (/matrix|garden|minefield|rows|board|grid/.test(inputShape) || expectedShape.startsWith("array<array<")) return "matrix-or-grid";
  if (/dominoes|tiles/.test(exerciseSlug) || inputShape.includes("array<array<number>>")) return "list-of-pairs-or-custom-structure";
  if (customTypes.some((type) => /Node|Tree|List|Graph|Domino/i.test(type))) return "custom-data-structure";
  if (inputShape.includes("array<") && expectedShape.includes("array<")) return "list-or-array-to-list-or-array";
  if (inputShape.includes("array<")) return "list-or-array-argument";
  return "primitive-or-multi-argument-function";
}

const rows = await mapLimit(snapshot.exercises, 8, async (exercise) => {
  const specRoot = `https://raw.githubusercontent.com/exercism/problem-specifications/${snapshot.problemSpecificationsSha}`;
  const instructionPath = exercise.source?.instructionsPath ?? `exercises/${exercise.slug}/instructions.md`;
  const canonicalPath = exercise.source?.canonicalDataPath ?? `exercises/${exercise.slug}/canonical-data.json`;
  const [instruction, canonical, metadata] = await Promise.all([
    fetchText(`${specRoot}/${instructionPath}`, 48_000),
    fetchText(`${specRoot}/${canonicalPath}`, 128_000),
    fetchText(`${specRoot}/exercises/${exercise.slug}/metadata.toml`, 16_000),
  ]);
  let canonicalParsed = null;
  let canonicalError = canonical.error;
  if (canonical.text) {
    try { canonicalParsed = JSON.parse(canonical.text); }
    catch { canonicalError = "canonical-data.json is malformed JSON"; }
  }
  const canonIds = canonicalParsed ? canonicalIds(canonicalParsed) : [];
  const canonicalCases = Array.isArray(canonicalParsed?.cases) ? canonicalParsed.cases : [];
  const trackReports = await Promise.all(Object.entries(exercise.tracks).map(async ([language, track]) => {
    const base = `https://raw.githubusercontent.com/exercism/${track.repository}/${track.sha}/exercises/practice/${exercise.slug}`;
    const selectionPath = track.testSelectionPath ?? `exercises/practice/${exercise.slug}/.meta/tests.toml`;
    const requests = [
      fetchText(`${base}/.meta/config.json`, 32_000),
      fetchText(`https://raw.githubusercontent.com/exercism/${track.repository}/${track.sha}/${selectionPath}`, 24_000),
      ...((track.starterFiles ?? []).map((file) => fetchText(`${base}/${file}`, 24_000))),
      ...((track.testFiles ?? []).map((file) => fetchText(`${base}/${file}`, 48_000))),
    ];
    const files = await Promise.all(requests);
    const [configFile, selectorFile, ...otherFiles] = files;
    let config = null;
    let configError = configFile.error;
    if (configFile.text) {
      try { config = JSON.parse(configFile.text); }
      catch { configError = "track .meta/config.json is malformed"; }
    }
    const selected = selectorFile.text ? selectedIds(selectorFile.text) : [];
    const missingSelected = selected.filter((id) => !canonIds.includes(id));
    const selectedCases = canonicalCases.filter((testCase) => typeof testCase?.uuid === "string" && selected.includes(testCase.uuid.toLowerCase()));
    const starterFiles = otherFiles.slice(0, track.starterFiles?.length ?? 0);
    const testFiles = otherFiles.slice(track.starterFiles?.length ?? 0);
    const issues = [];
    if (configError) issues.push(configError);
    if (selectorFile.error) issues.push(`test selector: ${selectorFile.error}`);
    if (selected.length === 0) issues.push("track test selector has no selected cases");
    if (canonicalError) issues.push(`canonical data: ${canonicalError}`);
    if (missingSelected.length) issues.push(`${missingSelected.length} selected UUIDs are absent from canonical data`);
    if (starterFiles.some((file) => file.error)) issues.push(`starter retrieval: ${starterFiles.filter((file) => file.error).map((file) => file.error).join("; ")}`);
    if (testFiles.some((file) => file.error)) issues.push(`test source retrieval: ${testFiles.filter((file) => file.error).map((file) => file.error).join("; ")}`);
    const starterText = starterFiles.map((file) => file.text ?? "").join("\n");
    const testText = testFiles.map((file) => file.text ?? "").join("\n");
    const structuralSignals = [...new Set([
      ...(starterText.match(/\b(?:Node|List|Tree|BinaryTree|LinkedList|Stack|Queue|Matrix|Graph|Iterator|Enum|Protocol|dataclass)\b/g) ?? []),
      ...(testText.match(/\b(?:Node|List|Tree|BinaryTree|LinkedList|Stack|Queue|Matrix|Graph|Iterator|Enum|Protocol|dataclass)\b/g) ?? []),
    ])];
    const customs = [...new Set([...(starterText.match(/\b(?:class|struct|enum)\s+([A-Za-z_]\w*)/g) ?? []), ...(testText.match(/\b(?:class|struct|enum)\s+([A-Za-z_]\w*)/g) ?? [])])];
    return {
      language,
      repository: track.repository,
      revision: track.sha,
      uuid: track.exerciseUuid,
      title: track.officialTitle,
      difficulty: track.difficulty,
      concepts: track.concepts,
      selectedTestCount: selected.length,
      canonicalCaseCount: canonIds.length,
      selectedCasesMatchCanonical: selected.length > 0 && missingSelected.length === 0,
      selectedCaseContracts: selectedCases.map((testCase) => ({
        uuid: testCase.uuid,
        description: typeof testCase.description === "string" ? testCase.description : null,
        property: typeof testCase.property === "string" ? testCase.property : null,
        inputShape: valueShape(testCase.input),
        inputFields: isRecord(testCase.input) ? Object.fromEntries(Object.entries(testCase.input).map(([key, value]) => [key, valueShape(value)])) : {},
        expectedShape: valueShape(testCase.expected),
      })),
      starterFiles: (track.starterFiles ?? []).map((name, index) => ({ path: `exercises/practice/${exercise.slug}/${name}`, bytes: Buffer.byteLength(starterFiles[index]?.text ?? ""), available: Boolean(starterFiles[index]?.text) })),
      testFiles: (track.testFiles ?? []).map((name, index) => ({ path: `exercises/practice/${exercise.slug}/${name}`, bytes: Buffer.byteLength(testFiles[index]?.text ?? ""), available: Boolean(testFiles[index]?.text) })),
      config: config ? { uuid: config.uuid ?? null, blurb: config.blurb ?? null, source: config.source ?? null, sourceUrl: config.source_url ?? null } : null,
      signature: statementSignature(starterText),
      cppPrototypeLines: starterText.split(/\r?\n/).map((line) => line.trim()).filter((line) => /\)\s*;\s*$/.test(line) && !line.startsWith("//")),
      functionLikeLines: starterText.split(/\r?\n/).map((line) => line.trim()).filter((line) => /\b(rebase|annotate|can_chain|Bankaccount|BankAccount)\s*\(/.test(line)).slice(0, 8),
      structuralSignals,
      customTypes: customs,
      technicalStatus: issues.length ? "needs_technical_review" : "inspected_unverified_adapter",
      technicalReasons: issues.length ? issues : ["Pinned starters, tests, selected cases, and canonical data were inspected; CodeTrail has no verified Judge0 adapter for this contract yet."],
    };
  }));

  const metaSourceName = exercise.source?.sourceName ?? null;
  const metaSourceUrl = exercise.source?.sourceUrl ?? null;
  const trackSources = trackReports.map((track) => ({ language: track.language, sourceName: track.config?.source ?? null, sourceUrl: track.config?.sourceUrl ?? null }));
  const thirdPartySources = [
    ...(externalSource(metaSourceName, metaSourceUrl) ? [{ scope: "instructions", name: metaSourceName, url: metaSourceUrl }] : []),
    ...trackSources.filter((source) => externalSource(source.sourceName, source.sourceUrl)).map((source) => ({ scope: `track:${source.language}`, name: source.sourceName, url: source.sourceUrl })),
  ];
  const auditIssues = [];
  if (instruction.error) auditIssues.push(`instructions: ${instruction.error}`);
  if (!metadata.text) auditIssues.push(`metadata.toml: ${metadata.error}`);
  if (canonicalError) auditIssues.push(`canonical data: ${canonicalError}`);
  if (thirdPartySources.length && manifest.exercises[exercise.slug]?.status !== "playable") auditIssues.push("Third-party source material is attributed; confirm its specific license and whether the statement adaptation is permitted. The Exercism MIT license does not resolve that third-party content.");
  if (!pinnedLicenses.problemSpecifications.isMit) auditIssues.push("Pinned problem-specifications LICENSE could not be confirmed as MIT.");
  if (trackReports.some((track) => !pinnedLicenses[track.language === "python3" ? "python" : "xcpp"].isMit)) auditIssues.push("A pinned track LICENSE could not be confirmed as MIT.");
  if (!instruction.text) auditIssues.push("The expected instructions.md file is absent; use of an alternative source or an independently written statement needs review.");
  const existing = manifest.exercises[exercise.slug];
  const rightsCleared = !thirdPartySources.length && Boolean(instruction.text)
    && pinnedLicenses.problemSpecifications.isMit
    && trackReports.every((track) => pinnedLicenses[track.language === "python3" ? "python" : "xcpp"].isMit);
  const status = existing?.status === "playable" ? "playable" : rightsCleared ? "needs_technical_review" : "needs_manual_legal_review";
  const relevance = dsaRelevance(exercise, instruction.text);
  const primaryCase = trackReports.flatMap((track) => track.selectedCaseContracts).find(Boolean);
  const inputShape = primaryCase?.inputShape ?? "unknown";
  const expectedShape = primaryCase?.expectedShape ?? "unknown";
  const customTypes = [...new Set(trackReports.flatMap((track) => track.customTypes))];
  const adapterAssessment = {
    family: adapterFamily(inputShape, expectedShape, customTypes, exercise.slug),
    inputShape,
    expectedShape,
    customTypes,
    status: existing?.status === "playable" ? "verified_playable" : "not_yet_verified",
  };
  const inspectedTracks = trackReports.map((track) => ({
    ...track,
    technicalStatus: existing?.status === "playable" ? "playable_verified" : track.technicalStatus,
    technicalReasons: existing?.status === "playable"
      ? [existing.review.adapters.verificationNote]
      : track.technicalReasons,
  }));
  return {
    slug: exercise.slug,
    uuid: exercise.uuid,
    title: exercise.title,
    status,
    relevance: relevance.classification,
    relevanceEvidence: relevance.evidence,
    languages: trackReports.map((track) => track.language),
    difficultyByLanguage: Object.fromEntries(trackReports.map((track) => [track.language, track.difficulty])),
    conceptsByLanguage: Object.fromEntries(trackReports.map((track) => [track.language, track.concepts])),
    statement: { path: instructionPath, available: Boolean(instruction.text), bytes: Buffer.byteLength(instruction.text ?? ""), sourceName: metaSourceName, sourceUrl: metaSourceUrl },
    adapterAssessment,
    rights: {
      statementLicense: existing?.statementLicense ?? (rightsCleared ? "MIT" : null),
      canonicalDataLicense: pinnedLicenses.problemSpecifications.isMit ? "MIT (pinned repository LICENSE verified)" : "unverified",
      trackSourceLicense: trackReports.every((track) => pinnedLicenses[track.language === "python3" ? "python" : "xcpp"].isMit) ? "MIT (pinned track LICENSE files verified)" : "unverified",
      status: existing?.status === "playable" ? "approved_by_existing_review_manifest" : rightsCleared ? "repository_MIT_confirmed_no_third_party_source_disclosed" : "needs_manual_legal_review",
      testLicense: pinnedLicenses.problemSpecifications.isMit ? "MIT" : null,
      thirdPartySources,
      reasons: auditIssues,
    },
    canonicalData: { path: canonicalPath, available: Boolean(canonicalParsed), bytes: Buffer.byteLength(canonical.text ?? ""), caseCount: canonIds.length, sha: snapshot.problemSpecificationsSha, error: canonicalError },
    provenance: { metadataAvailable: Boolean(metadata.text), specRevision: snapshot.problemSpecificationsSha, trackSources },
    tracks: inspectedTracks,
    adapter: existing?.adapterId ?? null,
    reviewNote: existing?.review?.adapters?.verificationNote ?? (status === "needs_manual_legal_review"
      ? auditIssues.filter((issue) => issue.includes("Third-party") || issue.includes("instructions.md") || issue.includes("LICENSE")).join("; ")
      : inspectedTracks.flatMap((track) => track.technicalReasons).join("; ")),
  };
});

const counts = Object.fromEntries(["playable", "needs_manual_legal_review", "needs_technical_review", "excluded"].map((status) => [status, rows.filter((row) => row.status === status).length]));
const relevanceCounts = Object.fromEntries(["dsa_relevant", "other_programming"].map((label) => [label, rows.filter((row) => row.relevance === label).length]));
const languageCounts = {
  pythonOnly: rows.filter((row) => row.languages.includes("python3") && !row.languages.includes("cpp17")).length,
  cppOnly: rows.filter((row) => row.languages.includes("cpp17") && !row.languages.includes("python3")).length,
  both: rows.filter((row) => row.languages.includes("python3") && row.languages.includes("cpp17")).length,
};
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "Pinned individual Exercism problem-specifications and track files; no repository clone or source archive used.",
  revisions: { python: snapshot.repositories.python3.sha, xcpp: snapshot.repositories.cpp17.sha, problemSpecifications: snapshot.problemSpecificationsSha },
  licenses: pinnedLicenses,
  counts: { total: rows.length, ...counts, ...relevanceCounts, ...languageCounts },
  reviewMethod: "All instruction files, canonical data files (up to 128 KB each), track config, selected-test metadata, starter files, referenced test files, and repository LICENSE files were requested individually from pinned revisions. File contents are summarized and not copied into this report. DSA relevance is a keyword/topic screen and is marked as screening evidence, not a human legal or pedagogical determination. Exercises with an explicit third-party source remain blocked until that source's license and adaptation terms are reviewed.",
  exercises: rows,
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.counts, null, 2));
console.log(`Wrote ${path.relative(root, outputPath)} (${rows.length} exercise reviews; ${responseCache.size} individual file URLs)`.replaceAll("\\", "/"));
