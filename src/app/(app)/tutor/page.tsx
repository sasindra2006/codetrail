"use client";

import { useState, type FormEvent } from "react";
import type { ReactNode } from "react";

export type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

function SendIcon() {
  return <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 12 20 4l-5 16-3-7-8-1Zm8 1 4-5" /></svg>;
}

function CopyCode({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("error");
    }
  }
  return <button className="border border-line px-2 py-1 text-[11px] text-muted hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={copy} type="button">{status === "copied" ? "Copied" : status === "error" ? "Copy unavailable" : "Copy code"}</button>;
}

function renderMessage(content: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const codePattern = /```([^\n`]*)\n([\s\S]*?)```/g;
  let position = 0;
  let match: RegExpExecArray | null;
  while ((match = codePattern.exec(content)) !== null) {
    if (match.index > position) parts.push(<p className="whitespace-pre-wrap break-words text-sm leading-6" key={`text-${position}`}>{content.slice(position, match.index)}</p>);
    parts.push(
      <div className="overflow-hidden border border-line bg-surface" key={`code-${match.index}`}>
        <div className="flex items-center justify-between border-b border-line px-3 py-2"><span className="text-[11px] text-muted">{match[1] || "Code"}</span><CopyCode code={match[2]} /></div>
        <pre className="max-w-full overflow-x-auto p-3 font-mono text-xs leading-5 text-foreground"><code>{match[2]}</code></pre>
      </div>,
    );
    position = match.index + match[0].length;
  }
  if (position < content.length) parts.push(<p className="whitespace-pre-wrap break-words text-sm leading-6" key={`text-${position}`}>{content.slice(position)}</p>);
  return parts;
}

function Conversation({ messages }: { messages: TutorMessage[] }) {
  if (!messages.length) return null;
  return <div className="flex w-full max-w-3xl flex-col gap-5 text-left">{messages.map((message) => <article className={`max-w-[90%] border p-4 ${message.role === "user" ? "self-end border-line-strong bg-hover text-foreground" : "self-start border-line bg-panel text-muted"}`} key={message.id}><p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">{message.role === "user" ? "You" : "Tutor"}</p><div className="space-y-3">{renderMessage(message.content)}</div></article>)}</div>;
}

export default function TutorPage() {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messages: TutorMessage[] = [];

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setError("The AI Tutor service is not configured yet. Your question has not been sent.");
  }

  return (
    <section className="mx-auto flex min-h-[min(72vh,760px)] w-full max-w-5xl flex-col border border-line bg-panel">
      <header className="border-b border-line px-5 py-5 sm:px-7">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Guided learning</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">AI Tutor</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Work through DSA questions with step-by-step guidance. Tutor responses are unavailable until an AI service is configured.</p>
      </header>

      <div className={`flex min-h-0 flex-1 flex-col items-center px-5 py-8 ${messages.length ? "justify-start overflow-y-auto" : "justify-center text-center"}`}>
        <Conversation messages={messages} />
        {!messages.length ? <>
        <div className="grid size-12 place-items-center border border-line-strong bg-surface text-accent">
          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 0-4 12.74V20l4-2 4 2v-4.26A7 7 0 0 0 12 3Z" /><path d="M9 10h.01M15 10h.01M9.5 13.5c1.5 1.2 3.5 1.2 5 0" /></svg>
        </div>
        <h2 className="mt-5 text-base font-semibold text-foreground">Your conversation starts here</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">Ask about an algorithm, a complexity trade-off, or an approach to a problem. Your question will stay in this box until the tutor service is available.</p>
        <span className="mt-5 border border-line px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">Service not configured</span>
        </> : null}
      </div>

      <form className="border-t border-line bg-surface p-4 sm:p-5" onSubmit={submitQuestion}>
        <label className="sr-only" htmlFor="tutor-question">Your DSA question</label>
        <div className="flex items-end gap-2 border border-line-strong bg-panel p-2 focus-within:border-accent">
          <textarea
            className="min-h-12 max-h-40 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted"
            id="tutor-question"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            onChange={(event) => { setDraft(event.target.value); setError(null); }}
            placeholder="Ask a question about algorithms or problem solving…"
            rows={2}
            value={draft}
          />
          <button className="inline-flex h-10 shrink-0 items-center gap-2 bg-accent px-3 text-sm font-semibold text-accent-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50" disabled={!draft.trim()} type="submit">
            <SendIcon /><span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">Nothing is sent while the AI service is unavailable.</p>
        {error && <p className="mt-2 text-sm text-amber-500" role="alert">{error}</p>}
      </form>
    </section>
  );
}
