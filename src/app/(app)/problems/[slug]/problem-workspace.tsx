"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import {
  DockviewDefaultTab,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewPanelHeaderProps,
  type IDockviewPanelProps,
} from "dockview-react";
import {
  isExternalProblem,
  type WorkspaceProblem,
} from "@/lib/problems";
import { ProblemExamples, ProblemStatement } from "./problem-statement";

const DockviewReact = dynamic(
  () => import("dockview-react").then((module) => module.DockviewReact),
  { ssr: false }
);
const CodeEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-muted" role="status" aria-live="polite">
      Loading code editor…
    </div>
  ),
});

const layoutStorageKey = "codetrail-problem-workspace-layout-v1";
type PanelId = "problem" | "editor" | "results";
type SampleVerdict =
  | "accepted"
  | "wrong_answer"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "service_error";
type SampleResult = {
  name: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error: string | null;
  verdict?: SampleVerdict;
};
type RunResponse = { results?: SampleResult[]; error?: string };

type WorkspaceContextType = {
  problem: WorkspaceProblem;
  sourceCode: string;
  setSourceCode: (code: string) => void;
  editorTheme: "vs-dark" | "vs";
  running: boolean;
  runError: string | null;
  results: SampleResult[] | null;
  selectedSample: number;
  setSelectedSample: (index: number) => void;
  runSamples: () => Promise<void>;
  resetLayout: () => void;
  editorRef: React.RefObject<MonacoEditor.IStandaloneCodeEditor | null>;
  monacoRef: React.RefObject<typeof import("monaco-editor") | null>;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceContext.Provider");
  }
  return context;
}

function WorkspaceTab(props: IDockviewPanelHeaderProps) {
  return <DockviewDefaultTab {...props} hideClose />;
}

function DescriptionPanel() {
  const { problem, resetLayout } = useWorkspace();
  const isExternal = isExternalProblem(problem);

  return (
    <div className="problem-description-scrollbar flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-line pb-5">
        <Link
          className="w-fit text-xs font-medium text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent"
          href="/problems"
        >
          Back to Problems
        </Link>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{problem.title}</h1>
              {isExternal ? (
                <>
                  <span className="border border-line-strong px-2 py-1 font-mono text-xs text-muted">
                    {problem.contestId}{problem.index}
                  </span>
                  {problem.rating !== null ? (
                    <span className="border border-line-strong px-2 py-1 text-xs text-muted">
                      Rating: {problem.rating}
                    </span>
                  ) : (
                    <span className="border border-line-strong px-2 py-1 text-xs text-muted">
                      Unrated
                    </span>
                  )}
                </>
              ) : (
                <span className="border border-line-strong px-2 py-1 text-xs text-muted">
                  {problem.difficulty}
                </span>
              )}
            </div>
            {problem.topics.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Problem topics">
                {problem.topics.map((topic) => (
                  <span className="border border-line px-2 py-1 text-xs text-muted" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            aria-label="Reset workspace layout"
            className="hidden size-8 shrink-0 place-items-center border border-line bg-panel text-muted outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent lg:grid"
            onClick={resetLayout}
            title="Reset workspace layout"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              viewBox="0 0 24 24"
            >
              <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l3 2" />
            </svg>
          </button>
        </div>
      </div>
      {isExternal ? (
        <div className="flex flex-col gap-6">
          <section className="border border-line bg-surface p-4">
            <h3 className="text-sm font-semibold text-foreground">Statement unavailable</h3>
            <p className="mt-2 text-xs leading-6 text-muted">
              A statement and sample tests are not available in this workspace. Only catalog metadata was provided for this external problem, so no statement or examples are shown here.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Problem Metadata</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div className="border border-line bg-surface p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">Contest ID</dt>
                <dd className="mt-1 font-mono font-medium text-foreground">{problem.contestId}</dd>
              </div>
              <div className="border border-line bg-surface p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">Problem Index</dt>
                <dd className="mt-1 font-mono font-medium text-foreground">{problem.index}</dd>
              </div>
              <div className="border border-line bg-surface p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">Rating</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {problem.rating !== null ? problem.rating : "Unrated"}
                </dd>
              </div>
              {problem.solvedCount !== null && (
                <div className="border border-line bg-surface p-3 col-span-2 sm:col-span-3">
                  <dt className="text-[11px] uppercase tracking-wide text-muted">Solved Count</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {problem.solvedCount.toLocaleString()} accepted submissions on the source platform
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Workspace Notes</h3>
              <p className="mt-2 text-xs leading-6 text-muted">You can draft a C++17 solution here. Sample execution is unavailable because no verified test cases are attached to this problem.</p>
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="text-sm font-semibold">Description</h3>
            <div className="mt-2">
              <ProblemStatement statement={problem.statement} sections={problem.sections} />
            </div>
          </section>
          {(!problem.sections || !problem.sections.some((section) => section.title === "Constraints")) && (
            <section>
              <h3 className="text-sm font-semibold">Constraints</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
                {problem.constraints.map((constraint, index) => (
                  <li key={`${index}-${constraint}`}>{constraint}</li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h3 className="text-sm font-semibold">Examples</h3>
            <div className="mt-3 space-y-3">
              <ProblemExamples samples={problem.samples} />
            </div>
          </section>
          {problem.explanation && !problem.sections?.some((section) => section.title === "Explanation") && (
            <section>
              <h3 className="text-sm font-semibold">Explanation</h3>
              <div className="mt-2">
                <ProblemStatement statement={problem.explanation} />
              </div>
            </section>
          )}
          <footer className="border-t border-line pt-4 text-xs text-muted">
            Statement and examples provided by CodeTrail.
          </footer>
        </div>
      )}
    </div>
  );
}

function EditorPanel() {
  const {
    problem,
    sourceCode,
    setSourceCode,
    running,
    runSamples,
    editorTheme,
    editorRef,
    monacoRef,
  } = useWorkspace();
  const isExternal = isExternalProblem(problem);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
        <span aria-label="Selected language: C++17" className="inline-flex h-7 items-center border border-line px-2 font-mono text-[11px] font-medium text-muted">
          C++17
        </span>
        {isExternal ? (
          <button
            aria-disabled="true"
            className="inline-flex h-8 shrink-0 cursor-not-allowed items-center gap-2 border border-line bg-panel px-3 text-xs font-semibold text-muted opacity-60 outline-none"
            disabled
            title="Sample execution is disabled for external problems"
            type="button"
          >
            Samples unavailable
          </button>
        ) : (
          <button
            aria-busy={running}
            className="inline-flex h-8 shrink-0 items-center gap-2 bg-accent px-3 text-xs font-semibold text-accent-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
            disabled={running}
            onClick={runSamples}
            type="button"
          >
            {running ? "Running…" : "Run samples"}
          </button>
        )}
      </div>
      <div className="min-h-0 min-w-0 flex-1">
        <CodeEditor
          aria-label="C++17 source code"
          height="100%"
          language="cpp"
          onChange={(value) => setSourceCode(value ?? "")}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            monaco.editor.setTheme(editorTheme);
            editor.layout();
          }}
          options={{
            automaticLayout: true,
            fontSize: 13,
            fontFamily: "SFMono-Regular, Consolas, monospace",
            minimap: { enabled: false },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "on",
            lineNumbersMinChars: 3,
          }}
          theme={editorTheme}
          value={sourceCode}
        />
      </div>
    </div>
  );
}

function ResultsPanel() {
  const { problem, results, runError, running, selectedSample, setSelectedSample } = useWorkspace();
  const isExternal = isExternalProblem(problem);

  if (isExternal) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-11 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="text-xs font-medium text-foreground">Test Results</span>
          <span className="border border-line px-1.5 py-0.5 text-[11px] text-muted">Unavailable</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          <div className="border border-line bg-surface p-4">
            <h4 className="text-sm font-medium text-foreground">Execution unavailable</h4>
            <p className="mt-2 text-xs leading-6 text-muted">
              Sample input and expected output are not available for this problem, so the code runner cannot check a result yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeResult = results?.[selectedSample];
  const passedCount = results?.filter((result) => result.passed).length ?? 0;
  const verdictLabel = (result: SampleResult) => {
    const verdict = result.verdict ?? (result.passed ? "accepted" : "wrong_answer");
    return {
      accepted: "Accepted",
      wrong_answer: "Wrong Answer",
      compilation_error: "Compilation Error",
      runtime_error: "Runtime Error",
      time_limit_exceeded: "Time Limit Exceeded",
      service_error: "Execution Service Error",
    }[verdict];
  };
  const verdictColor = (result: SampleResult) => result.passed
    ? "text-emerald-500"
    : result.verdict === "service_error"
      ? "text-muted"
      : "text-amber-500";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-11 shrink-0 items-center justify-end border-b border-line px-3">
        {results && (
          <p
            className={`text-xs font-medium ${
              passedCount === results.length ? "text-emerald-500" : "text-amber-500"
            }`}
            aria-live="polite"
          >
            {passedCount} of {results.length} samples passed
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {running ? (
          <div className="px-4 py-5" role="status" aria-live="polite">
            <p className="text-sm font-medium text-foreground">Running sample tests</p>
            <p className="mt-1 text-xs leading-5 text-muted">Compiling and checking your code against the examples…</p>
          </div>
        ) : runError ? (
          <div className="px-4 py-5" role="alert">
            <p className="text-sm font-medium text-foreground">Execution Service Error</p>
            <p className="mt-1 text-sm leading-6 text-muted">{runError}</p>
          </div>
        ) : results && results.length > 0 ? (
          <>
            <div
              className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2"
              role="tablist"
              aria-label="Sample cases"
            >
              {results.map((result, index) => (
                <button
                  aria-controls="sample-result-panel"
                  aria-selected={selectedSample === index}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    selectedSample === index
                      ? "bg-hover text-foreground"
                      : "text-muted hover:bg-hover hover:text-foreground"
                  }`}
                  id={`sample-tab-${index}`}
                  key={`${result.name}-${index}`}
                  onClick={() => setSelectedSample(index)}
                  role="tab"
                  type="button"
                >
                  {result.name}
                  <span className={`ml-2 ${verdictColor(result)}`}>
                    {verdictLabel(result)}
                  </span>
                </button>
              ))}
            </div>
            {activeResult && (
              <div
                aria-labelledby={`sample-tab-${selectedSample}`}
                className="grid min-w-0 gap-3 p-4 sm:grid-cols-2"
                id="sample-result-panel"
                role="tabpanel"
              >
                <div className={`border border-line bg-surface px-3 py-2 text-xs font-semibold sm:col-span-2 ${verdictColor(activeResult)}`} aria-live="polite">
                  {verdictLabel(activeResult)}
                </div>
                {activeResult.error && (
                  <div
                    className={`border px-3 py-2.5 sm:col-span-2 ${activeResult.verdict === "wrong_answer" ? "border-line bg-surface" : "border-amber-500/30 bg-amber-500/5"}`}
                    role="alert"
                  >
                    <p className="mb-1 text-xs font-semibold text-muted">{activeResult.verdict === "wrong_answer" ? "Comparison" : "Execution details"}</p>
                    <pre className="max-h-32 max-w-full overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-muted">
                      {activeResult.error}
                    </pre>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    Expected output
                  </p>
                  <pre className="min-h-12 max-w-full overflow-auto border border-line bg-surface p-2.5 font-mono text-xs leading-5">
                    {activeResult.expectedOutput}
                  </pre>
                </div>
                <div className="min-w-0">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    Your output
                  </p>
                  <pre className="min-h-12 max-w-full overflow-auto border border-line bg-surface p-2.5 font-mono text-xs leading-5">
                    {activeResult.actualOutput === "" ? <span className="text-muted">(no output)</span> : activeResult.actualOutput}
                  </pre>
                </div>
              </div>
            )}
          </>
        ) : results ? (
          <div className="px-4 py-5" role="status">
            <p className="text-sm font-medium text-foreground">No sample results returned</p>
            <p className="mt-1 text-xs leading-5 text-muted">Run the samples again to retry execution.</p>
          </div>
        ) : (
          <div className="px-4 py-5">
            <p className="text-sm text-muted">Run your code to see how it handles the sample cases.</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Only the examples shown in this problem are sent for execution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const panelComponents: Record<PanelId, (props: IDockviewPanelProps) => React.ReactNode> = {
  problem: DescriptionPanel,
  editor: EditorPanel,
  results: ResultsPanel,
};

export function ProblemWorkspace({ problem }: { problem: WorkspaceProblem }) {
  const [sourceCode, setSourceCode] = useState(problem.starterCode);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "vs">("vs-dark");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [results, setResults] = useState<SampleResult[] | null>(null);
  const [selectedSample, setSelectedSample] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<PanelId>("problem");
  const apiRef = useRef<DockviewApi | null>(null);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.dataset.theme === "light" ? "vs" : "vs-dark";
      setEditorTheme(theme);
      monacoRef.current?.editor.setTheme(theme);
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const runSamples = useCallback(async () => {
    if (isExternalProblem(problem)) return;
    setRunning(true);
    setRunError(null);
    setResults(null);
    setSelectedSample(0);
    try {
      const response = await fetch("/api/run-samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: problem.slug, sourceCode }),
      });
      const payload = (await response.json()) as RunResponse;
      if (!response.ok) throw new Error(payload.error ?? "Sample execution failed.");
      if (!Array.isArray(payload.results)) {
        throw new Error("The execution service returned an invalid response.");
      }
      setResults(payload.results);
      if (window.matchMedia("(max-width: 1023px)").matches) {
        setMobilePanel("results");
      } else {
        apiRef.current?.getPanel("results")?.api.setActive();
      }
    } catch (reason) {
      setRunError(reason instanceof Error ? reason.message : "Could not run samples. Please try again.");
      if (window.matchMedia("(max-width: 1023px)").matches) {
        setMobilePanel("results");
      } else {
        apiRef.current?.getPanel("results")?.api.setActive();
      }
    } finally {
      setRunning(false);
    }
  }, [problem, sourceCode]);

  const resetLayout = useCallback(() => {
    localStorage.removeItem(layoutStorageKey);
    const api = apiRef.current;
    if (!api) return;
    api.clear();
    api.addPanel({
      id: "problem",
      component: "problem",
      title: "Problem description",
      minimumWidth: 300,
    });
    api.addPanel({
      id: "editor",
      component: "editor",
      title: "Code editor",
      position: { referencePanel: "problem", direction: "right" },
      minimumWidth: 320,
      minimumHeight: 180,
    });
    api.addPanel({
      id: "results",
      component: "results",
      title: "Testcase / Test Result",
      position: { referencePanel: "editor", direction: "below" },
      minimumWidth: 280,
      minimumHeight: 160,
    });
    requestAnimationFrame(() => editorRef.current?.layout());
  }, []);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    const api = event.api;
    apiRef.current = api;

    const addDefault = () => {
      api.clear();
      api.addPanel({
        id: "problem",
        component: "problem",
        title: "Problem description",
        minimumWidth: 300,
      });
      api.addPanel({
        id: "editor",
        component: "editor",
        title: "Code editor",
        position: { referencePanel: "problem", direction: "right" },
        minimumWidth: 320,
        minimumHeight: 180,
      });
      api.addPanel({
        id: "results",
        component: "results",
        title: "Testcase / Test Result",
        position: { referencePanel: "editor", direction: "below" },
        minimumWidth: 280,
        minimumHeight: 160,
      });
    };

    try {
      const serialized = localStorage.getItem(layoutStorageKey);
      if (serialized) {
        const candidate: unknown = JSON.parse(serialized);
        const candidatePanels =
          typeof candidate === "object" && candidate !== null && "panels" in candidate
            ? Object.keys((candidate as { panels?: object }).panels ?? {})
            : [];
        const expectedPanels = ["problem", "editor", "results"];
        const grid =
          typeof candidate === "object" && candidate !== null && "grid" in candidate
            ? (candidate as { grid?: { width?: number; height?: number } }).grid
            : undefined;
        const hasValidDimensions =
          !grid ||
          (typeof grid.width === "number" &&
            grid.width > 0 &&
            typeof grid.height === "number" &&
            grid.height > 0);

        if (
          hasValidDimensions &&
          candidatePanels.length === expectedPanels.length &&
          expectedPanels.every((id) => candidatePanels.includes(id))
        ) {
          api.fromJSON(candidate as Parameters<typeof api.fromJSON>[0]);
        } else {
          addDefault();
        }
      } else {
        addDefault();
      }
    } catch {
      localStorage.removeItem(layoutStorageKey);
      api.clear();
      addDefault();
    }

    api.onDidLayoutChange(() => {
      try {
        if (api.width > 0 && api.height > 0) {
          localStorage.setItem(layoutStorageKey, JSON.stringify(api.toJSON()));
        }
      } catch {
        /* Storage may be unavailable or full. */
      }
      requestAnimationFrame(() => editorRef.current?.layout());
    });
    requestAnimationFrame(() => editorRef.current?.layout());
  }, []);

  const contextValue = useMemo(
    () => ({
      problem,
      sourceCode,
      setSourceCode,
      editorTheme,
      running,
      runError,
      results,
      selectedSample,
      setSelectedSample,
      runSamples,
      resetLayout,
      editorRef,
      monacoRef,
    }),
    [
      problem,
      sourceCode,
      editorTheme,
      running,
      runError,
      results,
      selectedSample,
      runSamples,
      resetLayout,
    ]
  );

  const MobilePanel = panelComponents[mobilePanel];

  return (
    <WorkspaceContext.Provider value={contextValue}>
      <section className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col">
        <div className="problem-dockview min-h-0 flex-1 overflow-hidden border border-line bg-panel">
          <DockviewReact
            className="dockview-theme-codetrail"
            components={panelComponents}
            defaultTabComponent={WorkspaceTab}
            onReady={onReady}
          />
        </div>
        <div className="problem-mobile min-h-0 flex-1 flex-col overflow-hidden border border-line bg-panel">
          <div className="flex shrink-0 border-b border-line" role="tablist" aria-label="Workspace panels">
            {([
              ["problem", "Problem"],
              ["editor", "Code"],
              ["results", "Test results"],
            ] as const).map(([id, label]) => (
              <button
                aria-selected={mobilePanel === id}
                aria-controls="problem-mobile-panel"
                className={`flex-1 px-2 py-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  mobilePanel === id ? "border-b-2 border-accent text-foreground" : "text-muted"
                }`}
                id={`problem-mobile-tab-${id}`}
                key={id}
                onClick={() => {
                  setMobilePanel(id);
                  if (id === "editor") requestAnimationFrame(() => editorRef.current?.layout());
                }}
                role="tab"
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`problem-mobile-tab-${mobilePanel}`}
            className="min-h-0 min-w-0 flex-1 overflow-hidden"
            id="problem-mobile-panel"
            role="tabpanel"
          >
            <MobilePanel api={{} as never} containerApi={{} as never} params={{}} />
          </div>
        </div>
      </section>
    </WorkspaceContext.Provider>
  );
}
