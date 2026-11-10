import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "src/lib/exercism/review-manifest.json");
const outputPath = path.join(root, "src/lib/exercism/discovery-snapshot.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const auditPath = path.join(root, "src/lib/exercism/audit-report.json");
let auditRows = [];
try { auditRows = JSON.parse(await readFile(auditPath, "utf8")).exercises ?? []; } catch { /* First discovery run has no review report yet. */ }
const repos = {
  python3: { repository: "python", sha: manifest.exercises["binary-search"].tracks.python3.sha, track: "Python" },
  cpp17: { repository: "xcpp", sha: manifest.exercises["binary-search"].tracks.cpp17.sha, track: "C++" },
};

function retryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1_000, 30_000);
  return Math.min(500 * (2 ** attempt), 8_000);
}

async function get(url, { json = false, retries = 3, maxBytes = 64_000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: json ? "application/vnd.github+json" : "text/plain",
          "User-Agent": "CodeTrail-Exercism-Discovery",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, retryDelay({ headers: new Headers() }, attempt)));
      continue;
    }
    if (response.ok) {
      const text = await response.text();
      if (Buffer.byteLength(text, "utf8") > maxBytes) throw new Error(`Metadata file exceeded ${maxBytes} bytes: ${url}`);
      if (!json) return text;
      try { return JSON.parse(text); } catch { throw new Error(`Malformed JSON response for ${url}`); }
    }
    if (response.status === 404) return null;
    if (![403, 429].includes(response.status) && response.status < 500) {
      throw new Error(`Unexpected HTTP ${response.status} for ${url}`);
    }
    if (attempt === retries) throw new Error(`HTTP ${response.status} for ${url}`);
    await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
  }
  return null;
}

async function listPracticeExercises({ repository, sha }) {
  const configText = await get(`https://raw.githubusercontent.com/exercism/${repository}/${sha}/config.json`, { maxBytes: 2_000_000 });
  let config;
  try { config = JSON.parse(configText); } catch { throw new Error(`Malformed pinned ${repository}/config.json`); }
  const entries = config?.exercises?.practice;
  if (!Array.isArray(entries)) throw new Error(`Missing practice exercise metadata in ${repository}/config.json`);
  return entries.filter((entry) => entry && typeof entry.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug));
}

function parseTomlString(source, key) {
  const match = new RegExp(`^${key}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")\\s*$`, "m").exec(source ?? "");
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

function parseTomlArray(source, key) {
  const match = new RegExp(`^${key}\\s*=\\s*\\[([^\\]]*)\\]`, "m").exec(source ?? "");
  if (!match) return [];
  return [...match[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((entry) => {
    try { return JSON.parse(`"${entry[1]}"`); } catch { return ""; }
  }).filter(Boolean);
}

function parseTomlNumber(source, key) {
  const match = new RegExp(`^${key}\\s*=\\s*(\\d+)\\s*$`, "m").exec(source ?? "");
  return match ? Number(match[1]) : null;
}

async function mapLimit(values, limit, callback) {
  const results = new Array(values.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= values.length) return;
      results[index] = await callback(values[index]);
    }
  }));
  return results;
}

const trackLists = await Promise.all(Object.entries(repos).map(async ([language, track]) => [
  language,
  await listPracticeExercises(track),
]));
const bySlug = new Map();
for (const [language, exercises] of trackLists) {
  for (const metadata of exercises) {
    const entry = bySlug.get(metadata.slug) ?? { slug: metadata.slug, titles: [], tracks: {} };
    if (typeof metadata.name === "string") entry.titles.push(metadata.name);
    entry.tracks[language] = {
      ...repos[language],
      officialTitle: typeof metadata.name === "string" ? metadata.name : null,
      exerciseUuid: typeof metadata.uuid === "string" ? metadata.uuid : null,
      difficulty: Number.isSafeInteger(metadata.difficulty) ? metadata.difficulty : null,
      concepts: Array.isArray(metadata.topics) ? metadata.topics.filter((value) => typeof value === "string") : [],
    };
    bySlug.set(metadata.slug, entry);
  }
}

const rows = await mapLimit([...bySlug.values()], 8, async (exercise) => {
  const metadataUrl = `https://raw.githubusercontent.com/exercism/problem-specifications/${manifest.problemSpecificationsSha}/exercises/${exercise.slug}/metadata.toml`;
  const metadataText = await get(metadataUrl, { maxBytes: 16_000 });
  const tracks = await Promise.all(Object.entries(exercise.tracks).map(async ([language, track]) => {
    const folder = `exercises/practice/${exercise.slug}`;
    const configUrl = `https://raw.githubusercontent.com/exercism/${track.repository}/${track.sha}/${folder}/.meta/config.json`;
    const testsUrl = `https://raw.githubusercontent.com/exercism/${track.repository}/${track.sha}/${folder}/.meta/tests.toml`;
    const [configText, testsText] = await Promise.all([get(configUrl, { maxBytes: 32_000 }), get(testsUrl, { maxBytes: 24_000 })]);
    if (!configText || !testsText) {
      return [language, { ...track, available: false, reviewStatus: "needs_review", missingFiles: [!configText && "config.json", !testsText && "tests.toml"].filter(Boolean) }];
    }
    let config;
    try { config = JSON.parse(configText); } catch {
      return [language, { ...track, available: false, reviewStatus: "needs_review", error: "Malformed config.json" }];
    }
    const selectedTestIds = [...testsText.matchAll(/^\[([0-9a-f-]{36})\]\s*$/gim)].map((match) => match[1].toLowerCase());
    const solutionFiles = Array.isArray(config.files?.solution) ? config.files.solution : [];
    const testFiles = Array.isArray(config.files?.test) ? config.files.test : [];
    return [language, {
      ...track,
      available: true,
      configUuid: typeof config.uuid === "string" ? config.uuid : null,
      authors: Array.isArray(config.authors) ? config.authors : [],
      contributors: Array.isArray(config.contributors) ? config.contributors : [],
      blurb: typeof config.blurb === "string" ? config.blurb : null,
      trackSource: typeof config.source === "string" ? config.source : null,
      trackSourceUrl: typeof config.source_url === "string" ? config.source_url : null,
      starterPath: solutionFiles.length === 1 ? `${folder}/${solutionFiles[0]}` : null,
      starterFiles: solutionFiles,
      testFiles,
      testSelectionPath: `${folder}/.meta/tests.toml`,
      selectedTestIds,
      reviewStatus: "needs_review",
      rights: "unreviewed",
      adapter: "unreviewed",
    }];
  }));

  const shared = metadataText ? {
    title: parseTomlString(metadataText, "title") ?? exercise.titles[0] ?? null,
    uuid: parseTomlString(metadataText, "uuid"),
    difficulty: parseTomlNumber(metadataText, "difficulty"),
    concepts: [...new Set([...parseTomlArray(metadataText, "topics"), ...parseTomlArray(metadataText, "concepts")])],
    sourceName: parseTomlString(metadataText, "source"),
    sourceUrl: parseTomlString(metadataText, "source_url"),
    instructionsPath: `exercises/${exercise.slug}/instructions.md`,
    canonicalDataPath: `exercises/${exercise.slug}/canonical-data.json`,
    canonicalDataUrl: `https://raw.githubusercontent.com/exercism/problem-specifications/${manifest.problemSpecificationsSha}/exercises/${exercise.slug}/canonical-data.json`,
    provenanceStatus: "needs_review",
    contentLicenseStatus: "unreviewed",
    testLicenseStatus: "unreviewed",
  } : {
    title: exercise.titles[0] ?? null, uuid: null, difficulty: null, concepts: [], sourceName: null, sourceUrl: null,
    instructionsPath: `exercises/${exercise.slug}/instructions.md`,
    canonicalDataPath: `exercises/${exercise.slug}/canonical-data.json`, canonicalDataUrl: null,
    provenanceStatus: "needs_review", contentLicenseStatus: "unreviewed", testLicenseStatus: "unreviewed",
    error: "Missing spec metadata.toml",
  };
  const reviewed = auditRows.find((row) => row.slug === exercise.slug);
  const playable = manifest.exercises[exercise.slug]?.status === "playable";
  const status = playable ? "playable" : reviewed?.status ?? "discovered";
  const reviewedTracks = new Map((reviewed?.tracks ?? []).map((track) => [track.language, track]));
  const enrichedTracks = Object.fromEntries(tracks.map(([language, track]) => {
    const reviewTrack = reviewedTracks.get(language);
    return [language, {
      ...track,
      reviewStatus: status,
      rights: reviewed?.rights?.status ?? "unreviewed",
      adapter: playable ? "playable" : reviewTrack?.technicalStatus ?? "unreviewed",
    }];
  }));
  return {
    slug: exercise.slug,
    uuid: shared.uuid,
    trackUuids: [...new Set(Object.values(Object.fromEntries(tracks)).map((track) => track.exerciseUuid).filter(Boolean))],
    title: shared.title,
    status,
    source: shared,
    tracks: enrichedTracks,
    adapterId: playable ? manifest.exercises[exercise.slug].adapterId : reviewed?.adapter ?? null,
    reviewNote: playable ? manifest.exercises[exercise.slug].review.adapters.verificationNote : reviewed?.reviewNote ?? "Exercise has been discovered but has not been audited yet.",
  };
});

const statusCounts = Object.fromEntries(["discovered", "needs_review", "approved", "playable", "needs_manual_legal_review", "needs_technical_review", "excluded"].map((status) => [
  status,
  rows.filter((row) => row.status === status).length,
]));
const snapshot = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  repositories: Object.fromEntries(Object.entries(repos).map(([language, track]) => [language, { repository: track.repository, sha: track.sha }])),
  problemSpecificationsSha: manifest.problemSpecificationsSha,
  discoveryMethod: "GitHub practice-directory metadata and pinned individual config.json, tests.toml, and metadata.toml files; no source archives or canonical datasets downloaded.",
  counts: { total: rows.length, ...statusCounts, python: trackLists[0][1].length, cpp: trackLists[1][1].length, sharedAcrossTracks: rows.filter((row) => row.tracks.python3 && row.tracks.cpp17).length },
  exercises: rows,
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify(snapshot.counts, null, 2));
console.log(`Wrote ${path.relative(root, outputPath)}`);
