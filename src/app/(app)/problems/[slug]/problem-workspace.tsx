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
import type { InternalProblem } from "@/lib/problems";

const DockviewReact = dynamic(
  () => import("dockview-react").then((module) => module.DockviewReact),
  { ssr: false }
);
const CodeEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-muted">
      Loading code editor…
    </div>
  ),
});

const layoutStorageKey = "codetrail-problem-workspace-layout-v1";
type PanelId = "problem" | "editor" | "results";
type SampleResult = {
  name: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error: string | null;
};
type RunResponse = { results?: SampleResult[]; error?: string };

type WorkspaceContextType = {
  problem: InternalProblem;
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
              <span className="border border-line-strong px-2 py-1 text-xs text-muted">
                {problem.difficulty}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Problem topics">
              {problem.topics.map((topic) => (
                <span className="border border-line px-2 py-1 text-xs text-muted" key={topic}>
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <button
            aria-label="Reset workspace layout"
            className="grid size-8 shrink-0 place-items-center border border-line bg-panel text-muted outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent"
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
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="text-sm font-semibold">Description</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted">
            {problem.statement}
          </p>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Constraints</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
            {problem.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Examples</h3>
          <div className="mt-3 space-y-3">
            {problem.samples.map((sample) => (
              <div className="border border-line bg-surface p-3" key={sample.name}>
                <p className="mb-3 text-xs font-medium text-muted">{sample.name}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Input</p>
                    <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-5">
                      {sample.input.trimEnd()}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Output</p>
                    <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-5">
                      {sample.expectedOutput.trimEnd()}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Explanation</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{problem.explanation}</p>
        </section>
      </div>
    </div>
  );
}

function EditorPanel() {
  const {
    sourceCode,
    setSourceCode,
    running,
    runSamples,
    editorTheme,
    editorRef,
    monacoRef,
  } = useWorkspace();

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-end gap-3 border-b border-line px-3">
        <span className="hidden select-none whitespace-nowrap text-[11px] text-muted sm:inline">
          C++17 · GNU G++17
        </span>
        <button
          className="inline-flex h-8 shrink-0 items-center gap-2 bg-accent px-3 text-xs font-semibold text-accent-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          disabled={running}
          onClick={runSamples}
          type="button"
        >
          {running ? "Running…" : "Run samples"}
        </button>
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
  const { results, runError, selectedSample, setSelectedSample } = useWorkspace();
  const activeResult = results?.[selectedSample];
  const passedCount = results?.filter((result) => result.passed).length ?? 0;

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
            {passedCount} / {results.length} passed
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {runError ? (
          <div className="px-4 py-5" role="alert">
            <p className="text-sm font-medium">Could not run samples</p>
            <p className="mt-1 text-sm leading-6 text-muted">{runError}</p>
          </div>
        ) : results ? (
          <>
            <div
              className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2"
              role="tablist"
              aria-label="Sample cases"
            >
              {results.map((result, index) => (
                <button
                  aria-selected={selectedSample === index}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSample === index
                      ? "bg-hover text-foreground"
                      : "text-muted hover:bg-hover hover:text-foreground"
                  }`}
                  key={result.name}
                  onClick={() => setSelectedSample(index)}
                  role="tab"
                  type="button"
                >
                  {result.name}
                  <span className={`ml-2 ${result.passed ? "text-emerald-500" : "text-amber-500"}`}>
                    {result.passed ? "Passed" : "Failed"}
                  </span>
                </button>
              ))}
            </div>
            {activeResult && (
              <div className="grid gap-3 p-4 sm:grid-cols-2" role="tabpanel">
                {activeResult.error && (
                  <div
                    className="border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 sm:col-span-2"
                    role="alert"
                  >
                    <p className="mb-1 text-xs font-semibold text-amber-500">Execution details</p>
                    <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-muted">
                      {activeResult.error}
                    </pre>
                  </div>
                )}
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    Expected output
                  </p>
                  <pre className="min-h-12 overflow-auto border border-line bg-surface p-2.5 font-mono text-xs leading-5">
                    {activeResult.expectedOutput.trimEnd()}
                  </pre>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    Your output
                  </p>
                  <pre className="min-h-12 overflow-auto border border-line bg-surface p-2.5 font-mono text-xs leading-5">
                    {activeResult.actualOutput || <span className="text-muted">No output</span>}
                  </pre>
                </div>
              </div>
            )}
          </>
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

export function ProblemWorkspace({ problem }: { problem: InternalProblem }) {
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
      apiRef.current?.getPanel("results")?.api.setActive();
    } catch (reason) {
      setRunError(reason instanceof Error ? reason.message : "Could not run samples. Please try again.");
    } finally {
      setRunning(false);
    }
  }, [problem.slug, sourceCode]);

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
                className={`flex-1 px-2 py-3 text-xs ${
                  mobilePanel === id ? "border-b-2 border-accent text-foreground" : "text-muted"
                }`}
                key={id}
                onClick={() => setMobilePanel(id)}
                role="tab"
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <MobilePanel api={{} as never} containerApi={{} as never} params={{}} />
          </div>
        </div>
      </section>
    </WorkspaceContext.Provider>
  );
}
