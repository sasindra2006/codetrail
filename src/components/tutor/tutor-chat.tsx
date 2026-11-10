"use client";

import { memo, useEffect, useRef, useState, type FormEvent } from "react";
import { internalProblems, type SupportedLanguage } from "@/lib/problems";
import { BrandMark } from "@/components/brand-mark";
import { TutorAnswerCopy, TutorMarkdown } from "@/components/tutor-markdown";

type MessageStatus = "complete" | "streaming" | "failed" | "interrupted" | "incomplete" | "cancelled" | "cancel_requested";
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; status?: MessageStatus; createdAt?: string };
type Conversation = { id: string; title: string; updatedAt?: string };
type TutorContext = { problemSlug: string; language: SupportedLanguage; includeEditorCode: boolean; editorCode: string; includeLatestSubmission: boolean; errorText: string };
type TutorChatProps = { variant?: "full" | "floating"; workspaceProblemSlug?: string; workspaceProblemTitle?: string; workspaceLanguage?: SupportedLanguage; getEditorCode?: () => string; workspaceErrorText?: string; open?: boolean; onClose?: () => void };

function TutorChat({ variant = "full", workspaceProblemSlug, workspaceProblemTitle, workspaceLanguage, getEditorCode, workspaceErrorText = "", open = true, onClose }: TutorChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [consented, setConsented] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(20);
  const [requestsUsed, setRequestsUsed] = useState(0);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [context, setContext] = useState<TutorContext>(() => ({ problemSlug: workspaceProblemSlug ?? "", language: workspaceLanguage ?? "cpp17", includeEditorCode: false, editorCode: "", includeLatestSubmission: false, errorText: workspaceErrorText }));
  const abortRef = useRef<AbortController | null>(null);
  const tempMessageCounter = useRef(0);
  const skipNextConversationLoadRef = useRef("");
  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const userStoppedRef = useRef(false);
  const activeRequestRef = useRef<{ conversationId: string; assistantId: string } | null>(null);
  const floatingInputRef = useRef<HTMLTextAreaElement | null>(null);

  async function refreshConversations(selectId?: string) {
    const response = await fetch("/api/tutor/conversations", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Could not load conversations.");
    setConversations(body.conversations);
    setConsented(body.consented);
    setConfigured(body.configured);
    setDailyLimit(body.dailyLimit);
    setRequestsUsed(body.requestsUsed);
    const target = selectId || activeId || (variant === "full" ? body.conversations[0]?.id ?? "" : "");
    if (target) setActiveId(target);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void (async () => {
      try { await refreshConversations(); }
      catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load the AI Tutor."); }
      finally { setLoading(false); }
      try {
        if (variant === "floating") return;
        const pending = sessionStorage.getItem("codetrail-tutor-context");
        if (pending) {
          const saved = JSON.parse(pending) as { problemSlug?: string; language?: SupportedLanguage; editorCode?: string };
          setContext((current) => ({ ...current, problemSlug: saved.problemSlug ?? current.problemSlug, language: saved.language ?? current.language, editorCode: saved.editorCode ?? "", includeEditorCode: false }));
          setContextOpen(true);
          sessionStorage.removeItem("codetrail-tutor-context");
        }
      } catch { sessionStorage.removeItem("codetrail-tutor-context"); }
    })(); }, 0);
    return () => window.clearTimeout(timer);
    // Initial bootstrap only; conversation changes are handled by the dedicated effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (variant === "floating" && open) window.setTimeout(() => floatingInputRef.current?.focus(), 0);
  }, [variant, open]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void (async () => {
      if (activeId && skipNextConversationLoadRef.current === activeId) { skipNextConversationLoadRef.current = ""; return; }
      if (!activeId) { setMessages([]); return; }
      try {
        const response = await fetch(`/api/tutor/conversations/${encodeURIComponent(activeId)}`, { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not open this conversation.");
        setMessages(body.messages);
        setError("");
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not open this conversation."); }
    })(); }, 0);
    return () => window.clearTimeout(timer);
  }, [activeId]);

  useEffect(() => {
    const container = messageScrollRef.current;
    if (container && shouldAutoScrollRef.current) container.scrollTop = container.scrollHeight;
  }, [messages, waiting]);

  async function stopGeneration() {
    userStoppedRef.current = true;
    const active = activeRequestRef.current;
    if (active) {
      try {
        await fetch(`/api/tutor/conversations/${encodeURIComponent(active.conversationId)}/messages/${encodeURIComponent(active.assistantId)}/cancel`, { method: "POST" });
      } catch { /* The stream abort below still stops the browser request. */ }
    }
    abortRef.current?.abort();
  }

  async function createConversation() {
    setError("");
    try {
      const response = await fetch("/api/tutor/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not create a conversation.");
      setConversations((current) => [body.conversation, ...current]);
      setMessages([]);
      skipNextConversationLoadRef.current = body.conversation.id;
      setActiveId(body.conversation.id);
      setMobileHistoryOpen(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create a conversation."); }
  }

  async function renameConversation(item: Conversation) {
    const title = window.prompt("Conversation name", item.title);
    if (!title?.trim()) return;
    try {
      const response = await fetch(`/api/tutor/conversations/${encodeURIComponent(item.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not rename conversation.");
      setConversations((current) => current.map((entry) => entry.id === item.id ? { ...entry, title: title.trim() } : entry));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not rename conversation."); }
  }

  async function deleteConversation(item: Conversation) {
    if (!window.confirm(`Delete “${item.title}” and its messages?`)) return;
    try {
      const response = await fetch(`/api/tutor/conversations/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not delete conversation.");
      const remaining = conversations.filter((entry) => entry.id !== item.id);
      setConversations(remaining);
      if (activeId === item.id) { setActiveId(remaining[0]?.id ?? ""); setMessages([]); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete conversation."); }
  }

  async function acceptNotice() {
    setConsentSaving(true); setError("");
    try {
      const response = await fetch("/api/tutor/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accepted: true, ageConfirmed: true }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not save your acknowledgement.");
      setConsented(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your acknowledgement."); }
    finally { setConsentSaving(false); }
  }

  async function sendMessage(text = draft, hintLevel?: "hint1" | "hint2" | "hint3" | "solution") {
    if (!text.trim() || waiting || !consented) return;
    setError(""); setWaiting(true); setDraft("");
    tempMessageCounter.current += 1;
    const tempUser = `pending-user-${tempMessageCounter.current}`;
    const tempAssistant = `pending-assistant-${tempMessageCounter.current}`;
    setMessages((current) => [...current, { id: tempUser, role: "user", content: text.trim() }, { id: tempAssistant, role: "assistant", content: "", status: "streaming" }]);
    let conversationId = activeId;
    let liveAssistantId = tempAssistant;
    let streamStarted = false;
    userStoppedRef.current = false;
    try {
      if (!conversationId) {
        const createResponse = await fetch("/api/tutor/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        const created = await createResponse.json();
        if (!createResponse.ok) throw new Error(created.error ?? "Could not create a conversation.");
        conversationId = created.conversation.id;
        skipNextConversationLoadRef.current = conversationId;
        setActiveId(conversationId);
        setConversations((current) => [created.conversation, ...current]);
      }
      const abortController = new AbortController();
      abortRef.current = abortController;
      const requestContext = variant === "floating" && workspaceProblemSlug && workspaceLanguage && getEditorCode
        ? {
            problemSlug: workspaceProblemSlug,
            language: workspaceLanguage,
            includeEditorCode: context.includeEditorCode,
            editorCode: context.includeEditorCode ? getEditorCode() : undefined,
            includeLatestSubmission: false,
            includeLatestRun: true,
            errorText: workspaceErrorText.trim().slice(0, 2_000) || undefined,
          }
        : {
            problemSlug: context.problemSlug || undefined, language: context.problemSlug ? context.language : undefined,
            includeEditorCode: context.includeEditorCode, editorCode: context.includeEditorCode ? context.editorCode : undefined,
            includeLatestSubmission: context.includeLatestSubmission, errorText: context.errorText.trim() || undefined,
          };
      const response = await fetch("/api/tutor/chat", { method: "POST", headers: { "Content-Type": "application/json" }, signal: abortController.signal, body: JSON.stringify({
        conversationId, message: text.trim(), hintLevel,
        context: requestContext,
      }) });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "The tutor request could not be started.");
      }
      if (!response.body) throw new Error("The browser could not open the tutor response stream.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotDone = false;
      const handleEvent = (chunk: string) => {
        const dataLine = chunk.replace(/\r\n/g, "\n").split("\n").find((line) => line.startsWith("data: "));
        if (!dataLine) return;
        const event = JSON.parse(dataLine.slice(6)) as { type: string; text?: string; message?: string; code?: string; status?: string; userMessageId?: string; assistantMessageId?: string };
        if (event.type === "start" && event.userMessageId && event.assistantMessageId) {
          streamStarted = true;
          liveAssistantId = event.assistantMessageId;
          activeRequestRef.current = { conversationId: conversationId!, assistantId: event.assistantMessageId };
          setMessages((current) => current.map((message) => message.id === tempUser ? { ...message, id: event.userMessageId! } : message.id === tempAssistant ? { ...message, id: event.assistantMessageId! } : message));
        } else if (event.type === "chunk" && event.text) {
          setMessages((current) => current.map((message) => message.id === liveAssistantId || message.id === tempAssistant ? { ...message, content: message.content + event.text } : message));
        } else if (event.type === "error") setError(event.message ?? (event.code === "output_limit" ? "Gemini reached its response limit. The answer below is partial; ask it to continue." : "The tutor could not complete this response."));
        else if (event.type === "done") {
          gotDone = true;
          setMessages((current) => current.map((message) => message.id === liveAssistantId || message.id === tempAssistant ? { ...message, status: event.status as ChatMessage["status"] } : message));
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";
        for (const block of blocks) handleEvent(block);
      }
      buffer += decoder.decode();
      buffer = buffer.replace(/\r\n/g, "\n");
      const finalBlocks = buffer.split("\n\n");
      buffer = finalBlocks.pop() ?? "";
      for (const block of finalBlocks) handleEvent(block);
      if (buffer.trim()) handleEvent(buffer);
      if (!gotDone) setMessages((current) => current.map((message) => message.id === liveAssistantId || message.id === tempAssistant ? { ...message, status: userStoppedRef.current ? "cancelled" : "interrupted" } : message));
      try { await refreshConversations(conversationId); } catch { /* The answer remains readable even if the sidebar refresh fails. */ }
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") {
        setMessages((current) => current.map((message) => message.id === liveAssistantId || message.id === tempAssistant ? { ...message, status: userStoppedRef.current ? "cancelled" : "interrupted" } : message));
      } else {
        if (streamStarted) setMessages((current) => current.map((message) => message.id === liveAssistantId || message.id === tempAssistant ? { ...message, status: "interrupted" } : message));
        else setMessages((current) => current.filter((message) => message.id !== tempUser && message.id !== tempAssistant));
        setError(reason instanceof Error ? reason.message : "The tutor could not complete this response.");
      }
    } finally { abortRef.current = null; activeRequestRef.current = null; setWaiting(false); }
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void sendMessage(); }
  const selectedProblem = internalProblems.find((problem) => problem.slug === context.problemSlug);

  if (variant === "floating") {
    const diagnostic = workspaceErrorText.trim();
    return <section aria-labelledby="floating-tutor-title" aria-modal="false" className={`fixed bottom-20 right-3 z-[1000] flex h-[min(34rem,65dvh)] w-[min(25rem,calc(100vw-1.5rem))] flex-col overflow-hidden border border-line-strong bg-panel shadow-2xl sm:bottom-24 sm:right-5 sm:h-[min(38rem,calc(100dvh-6rem))] ${open ? "" : "hidden"}`} hidden={!open} onKeyDown={(event) => { if (event.key === "Escape") { onClose?.(); } }} role="dialog">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
        <div className="min-w-0"><h2 className="truncate text-sm font-semibold text-foreground" id="floating-tutor-title">CodeTrail Tutor</h2><p className="mt-0.5 truncate text-[11px] text-muted">{workspaceProblemTitle} · {workspaceLanguage === "python3" ? "Python 3" : "C++17"}</p></div>
        <button aria-label="Close AI Tutor" className="grid size-8 shrink-0 place-items-center border border-line text-muted hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => onClose?.()} type="button">×</button>
      </header>
      {loading ? <div className="grid min-h-0 flex-1 place-items-center text-xs text-muted" role="status">Loading AI Tutor…</div> : !consented ? <div className="min-h-0 flex-1 overflow-y-auto p-4"><p className="text-sm font-semibold text-foreground">Before you start</p><div className="mt-2 space-y-2 text-xs leading-5 text-muted"><p>Your messages are saved in your CodeTrail account and sent to Google Gemini to generate replies. Do not include sensitive, confidential, or personal information.</p><p>Google may use prompts and responses from unpaid Gemini API usage to improve its products; human reviewers may process them. Google, not CodeTrail, controls its handling of submitted content. Your conversation is not private from the AI provider. <a className="text-accent underline" href="https://ai.google.dev/gemini-api/terms" rel="noreferrer" target="_blank">Read Google’s Gemini API terms</a>.</p><p>This Tutor is available only to people 18 or older and uses the configured Gemini model only.</p></div><label className="mt-4 flex items-start gap-2 text-xs leading-5 text-foreground"><input checked={consentChecked} className="mt-1 accent-[var(--accent)]" onChange={(event) => setConsentChecked(event.target.checked)} type="checkbox" /><span>I confirm that I am at least 18 years old and understand and agree to the data-use notice above.</span></label><button className="mt-3 h-9 border border-accent bg-accent px-3 text-xs font-semibold text-accent-foreground disabled:opacity-50" disabled={!consentChecked || consentSaving} onClick={() => void acceptNotice()} type="button">{consentSaving ? "Saving…" : "Continue"}</button>{error && <p className="mt-3 text-xs text-amber-500" role="alert">{error}</p>}</div> : <>
        <div className="shrink-0 border-b border-line px-3 py-2 text-[11px] leading-4 text-muted"><p>Attached: problem, official statement and constraints, language, latest saved run/submission summary{diagnostic ? ", and latest diagnostic output" : ""}. Test inputs and expected outputs are excluded.</p>{diagnostic && <details className="mt-1"><summary className="cursor-pointer text-amber-500">Review attached diagnostic</summary><pre className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px]">{diagnostic}</pre></details>}<label className="mt-2 flex items-center gap-2 text-foreground"><input checked={context.includeEditorCode} onChange={(event) => setContext((current) => ({ ...current, includeEditorCode: event.target.checked }))} type="checkbox" />Include my current editor code with each message</label></div>
        <div ref={messageScrollRef} aria-live="polite" className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-3" onScroll={(event) => { const node = event.currentTarget; shouldAutoScrollRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100; }}>
          {messages.length ? <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-3">{messages.map((message) => <article className={`w-fit min-w-0 max-w-full space-y-2 border p-3 ${message.role === "user" ? "ml-auto border-line-strong bg-hover" : "mr-auto border-line bg-surface"}`} key={message.id}><div className="flex min-w-0 items-center justify-between gap-2"><p className="min-w-0 break-words text-[10px] font-semibold uppercase tracking-wide text-muted">{message.role === "user" ? "You" : "Tutor"}{message.status === "streaming" ? " · Generating" : message.status === "interrupted" ? " · Interrupted" : message.status === "cancelled" ? " · Stopped" : message.status === "failed" ? " · Failed" : message.status === "incomplete" ? " · Partial" : ""}</p>{message.role === "assistant" && message.content && <TutorAnswerCopy content={message.content} />}</div>{message.content ? message.role === "assistant" ? <TutorMarkdown content={message.content} /> : <p className="min-w-0 max-w-full whitespace-pre-wrap break-words text-xs leading-5 text-foreground [overflow-wrap:anywhere]">{message.content}</p> : message.status === "streaming" ? <p className="text-xs text-muted" role="status">Thinking…</p> : null}</article>)}</div> : <div className="flex h-full min-h-24 items-center justify-center px-4 text-center"><p className="max-w-xs text-xs leading-5 text-muted">Ask about {workspaceProblemTitle ?? "this problem"}, your latest run, or a programming concept.</p></div>}
          {error && <p className="mt-2 border border-amber-500/30 p-2 text-xs text-amber-500" role="alert">{error}</p>}
        </div>
        <div className="shrink-0 border-t border-line bg-surface p-3">
          {!configured && <p className="mb-2 text-[11px] text-amber-500">AI Tutor is not configured.</p>}
          <form onSubmit={submit}><label className="sr-only" htmlFor="floating-tutor-message">Message the CodeTrail Tutor</label><div className="flex items-end gap-2 border border-line-strong bg-panel p-1.5 focus-within:border-accent"><textarea ref={floatingInputRef} className="max-h-28 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-2 py-1.5 text-xs leading-5 text-foreground outline-none placeholder:text-muted" disabled={waiting || !configured} id="floating-tutor-message" maxLength={4_000} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask about this problem…" rows={2} value={draft} /><button className="h-9 shrink-0 bg-accent px-3 text-xs font-semibold text-accent-foreground disabled:opacity-50" disabled={!draft.trim() || waiting || !configured} type="submit">Send</button>{waiting && <button aria-label="Stop response" className="h-9 shrink-0 border border-line px-2 text-xs text-foreground" onClick={() => void stopGeneration()} type="button">Stop</button>}</div></form>
          <p className="mt-1.5 text-[10px] leading-4 text-muted">Source code is not sent unless you enable sharing. {requestsUsed}/{dailyLimit} daily requests used.</p>
        </div>
      </>}
    </section>;
  }

  return <section className="relative mx-auto flex h-full min-h-0 min-w-0 w-full max-w-7xl flex-1 overflow-hidden border border-line bg-panel">
    <aside aria-label="Conversation history" className={`${mobileHistoryOpen ? "absolute inset-y-0 left-0 z-30 flex w-[min(20rem,88vw)] shadow-2xl" : "hidden"} min-h-0 shrink-0 flex-col border-r border-line bg-surface md:relative md:flex ${sidebarCollapsed ? "md:w-16" : "md:w-72"} transition-[width] duration-200`}>
      <div className={`flex h-16 shrink-0 items-center border-b border-line ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"}`}><button aria-label={sidebarCollapsed ? "Expand CodeTrail sidebar" : "Collapse CodeTrail sidebar"} className="flex min-w-0 items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => setSidebarCollapsed((value) => !value)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} type="button"><BrandMark />{!sidebarCollapsed && <span className="text-sm font-semibold text-foreground">CodeTrail</span>}</button>{!sidebarCollapsed && <button aria-label="Collapse conversation sidebar" className="hidden size-8 place-items-center text-muted hover:bg-hover md:grid" onClick={() => setSidebarCollapsed(true)} title="Collapse sidebar" type="button"><svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg></button>}<button aria-label="Close conversation history" className="border border-line px-2 py-1 text-xs md:hidden" onClick={() => setMobileHistoryOpen(false)} type="button">Close</button></div>
      <button className={`m-3 flex h-10 items-center justify-center gap-2 border border-line-strong text-sm font-medium text-foreground hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${sidebarCollapsed ? "mx-2 px-0" : ""}`} onClick={() => void createConversation()} type="button"><span aria-hidden="true">+</span>{!sidebarCollapsed && " New conversation"}</button>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3">{loading ? <p className="p-3 text-xs text-muted" role="status">Loading conversations…</p> : conversations.length ? conversations.map((item) => <div className={`mb-1 flex items-center border ${activeId === item.id ? "border-line-strong bg-panel" : "border-transparent hover:bg-hover"}`} key={item.id}><button aria-label={sidebarCollapsed ? item.title : undefined} aria-current={activeId === item.id ? "page" : undefined} className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => { setActiveId(item.id); setMobileHistoryOpen(false); }} title={item.title} type="button">{sidebarCollapsed ? <svg aria-hidden="true" className="mx-auto size-4" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4V5Z" /><path d="M8 9h8M8 12h5" /></svg> : item.title}</button>{!sidebarCollapsed && <><button aria-label={`Rename ${item.title}`} className="px-2 py-2 text-xs text-muted hover:text-foreground" onClick={() => void renameConversation(item)} type="button">Rename</button><button aria-label={`Delete ${item.title}`} className="px-2 py-2 text-xs text-muted hover:text-amber-500" onClick={() => void deleteConversation(item)} type="button">×</button></>}</div>) : <p className={`p-3 text-xs leading-5 text-muted ${sidebarCollapsed ? "sr-only" : ""}`}>Your saved conversations will appear here.</p>}</div>
      <div className={`shrink-0 border-t border-line p-3 text-[11px] leading-5 text-muted ${sidebarCollapsed ? "text-center" : ""}`} title={`${Math.max(0, dailyLimit - requestsUsed)} of ${dailyLimit} tutor requests remain today (UTC)`}>{sidebarCollapsed ? Math.max(0, dailyLimit - requestsUsed) : `${Math.max(0, dailyLimit - requestsUsed)} of ${dailyLimit} tutor requests remain today (UTC).`}</div>
    </aside>

    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><button aria-label="Open conversation history" className="border border-line px-2.5 py-2 text-sm md:hidden" onClick={() => { setSidebarCollapsed(false); setMobileHistoryOpen(true); }} type="button">☰</button><div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">Guided learning</p><h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">AI Tutor</h1></div></div><span className={`hidden shrink-0 border px-2 py-1 text-[11px] sm:inline ${configured ? "border-line text-muted" : "border-amber-500/40 text-amber-500"}`}>{configured ? "Gemini · configured model" : "Service not configured"}</span></header>

      {!consented ? <div className="m-auto max-w-2xl p-5 sm:p-10"><div className="border border-line-strong bg-surface p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Before you start</p><h2 className="mt-3 text-xl font-semibold">AI and data-use notice</h2><div className="mt-4 space-y-3 text-sm leading-6 text-muted"><p>Your messages are saved in your CodeTrail account and sent to Google Gemini to generate replies. Do not include sensitive, confidential, or personal information.</p><p>Google may use prompts and responses from unpaid Gemini API usage to improve its products; human reviewers may process them. Google, not CodeTrail, controls its handling of submitted content. Your conversation is not private from the AI provider. <a className="text-accent underline" href="https://ai.google.dev/gemini-api/terms" rel="noreferrer" target="_blank">Read Google’s Gemini API terms</a>.</p><p>This tutor is available only to people 18 or older. CodeTrail uses the configured Gemini model only and will not switch models when quota is exhausted.</p></div><label className="mt-5 flex items-start gap-3 text-sm leading-5 text-foreground"><input checked={consentChecked} className="mt-1 accent-[var(--accent)]" onChange={(event) => setConsentChecked(event.target.checked)} type="checkbox" /><span>I confirm that I am at least 18 years old and understand and agree to the data-use notice above.</span></label><button className="mt-5 h-10 border border-accent bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50" disabled={!consentChecked || consentSaving} onClick={() => void acceptNotice()} type="button">{consentSaving ? "Saving…" : "Continue to AI Tutor"}</button>{error && <p className="mt-3 text-sm text-amber-500" role="alert">{error}</p>}</div></div> : <>
        <div ref={messageScrollRef} aria-live="polite" className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 sm:py-8" onScroll={(event) => { const node = event.currentTarget; shouldAutoScrollRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 120; }}>
          {messages.length ? <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-5">{messages.map((message) => <article className={`w-fit min-w-0 max-w-[95%] space-y-3 border p-4 sm:max-w-[90%] ${message.role === "user" ? "ml-auto border-line-strong bg-hover" : "mr-auto border-line bg-surface"}`} key={message.id}><div className="flex min-w-0 items-center justify-between gap-4"><p className="min-w-0 break-words text-[11px] font-semibold uppercase tracking-wide text-muted">{message.role === "user" ? "You" : "CodeTrail Tutor"}{message.status === "streaming" ? " · Generating" : message.status === "interrupted" ? " · Interrupted" : message.status === "cancelled" ? " · Stopped" : message.status === "failed" ? " · Failed" : message.status === "incomplete" ? " · Partial response" : ""}</p>{message.role === "assistant" && message.content && <TutorAnswerCopy content={message.content} />}</div>{message.content ? message.role === "assistant" ? <TutorMarkdown content={message.content} /> : <p className="min-w-0 max-w-full whitespace-pre-wrap break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">{message.content}</p> : message.status === "streaming" ? <p className="text-sm text-muted" role="status">Thinking…</p> : message.role === "assistant" && (message.status === "failed" || message.status === "interrupted" || message.status === "cancelled" || message.status === "incomplete") ? <p className="text-sm text-muted">This response ended before a complete answer was saved. You can ask again.</p> : null}</article>)}<div ref={bottomRef} /></div> : <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center text-center"><div aria-hidden="true" className="grid size-12 place-items-center border border-line-strong bg-surface text-accent"><svg className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 0-4 12.74V20l4-2 4 2v-4.26A7 7 0 0 0 12 3Z" /><path d="M9 10h.01M15 10h.01M9.5 13.5c1.5 1.2 3.5 1.2 5 0" /></svg></div><h2 className="mt-4 text-lg font-semibold">Learn by working it through</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">Ask about a concept, compare approaches, or share a problem you’re solving. The tutor will guide you without jumping to a full answer.</p><div className="mt-6 grid w-full gap-2 text-left sm:grid-cols-2">{["Explain how a hash map works and when to use one.", "Walk me through Kadane’s algorithm with a small example.", "Compare BFS and DFS for graph traversal.", "Help me reason about time and space complexity."].map((prompt) => <button className="border border-line bg-surface p-3 text-sm leading-5 text-muted hover:border-line-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" key={prompt} onClick={() => void sendMessage(prompt)} type="button">{prompt}</button>)}</div></div>}
        </div>

        <div className="border-t border-line bg-surface p-3 sm:p-4">
          {error && <div className="mb-3 flex items-start justify-between gap-3 border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-500" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")} type="button">×</button></div>}
          {!configured && <p className="mb-3 text-xs text-amber-500">AI Tutor is not configured. Set GEMINI_API_KEY and GEMINI_MODEL on the server.</p>}
          <details className="mb-3" open={contextOpen} onToggle={(event) => setContextOpen(event.currentTarget.open)}><summary className="w-fit cursor-pointer text-xs font-medium text-muted hover:text-foreground">Optional CodeTrail context</summary><div className="mt-3 grid gap-3 border border-line p-3 sm:grid-cols-2"><label className="text-xs text-muted sm:col-span-2">Problem<select aria-label="Problem context" className="mt-1 block h-9 w-full border border-line bg-panel px-2 text-sm text-foreground" onChange={(event) => setContext((current) => ({ ...current, problemSlug: event.target.value }))} value={context.problemSlug}><option value="">No problem context</option>{internalProblems.map((problem) => <option key={problem.slug} value={problem.slug}>{problem.title}</option>)}</select></label>{context.problemSlug && <label className="text-xs text-muted">Selected language<select aria-label="Context language" className="mt-1 block h-9 w-full border border-line bg-panel px-2 text-sm text-foreground" onChange={(event) => setContext((current) => ({ ...current, language: event.target.value as SupportedLanguage }))} value={context.language}><option value="cpp17">C++17</option><option value="python3">Python 3</option></select></label>}<label className="flex items-center gap-2 text-xs text-foreground"><input checked={context.includeLatestSubmission} disabled={!context.problemSlug} onChange={(event) => setContext((current) => ({ ...current, includeLatestSubmission: event.target.checked }))} type="checkbox" />Include my latest full submission verdict</label><label className="flex items-center gap-2 text-xs text-foreground sm:col-span-2"><input checked={context.includeEditorCode} disabled={!context.problemSlug || !context.editorCode} onChange={(event) => setContext((current) => ({ ...current, includeEditorCode: event.target.checked }))} type="checkbox" />Include current editor code in this request</label>{context.includeEditorCode && <textarea aria-label="Editor code to share" className="min-h-28 border border-line bg-panel p-2 font-mono text-xs text-foreground sm:col-span-2" maxLength={20_000} onChange={(event) => setContext((current) => ({ ...current, editorCode: event.target.value }))} value={context.editorCode} />}<label className="text-xs text-muted sm:col-span-2">Compiler/runtime error (optional, share only if you choose)<textarea className="mt-1 block min-h-16 w-full border border-line bg-panel p-2 text-xs text-foreground" maxLength={2_000} onChange={(event) => setContext((current) => ({ ...current, errorText: event.target.value }))} placeholder="Paste a relevant error message" value={context.errorText} /></label>{selectedProblem && <p className="text-[11px] leading-4 text-muted sm:col-span-2">The server supplies the official problem statement and constraints. Hidden tests are never attached.</p>}</div></details>
          <div className="mb-2 flex flex-wrap items-center gap-1.5" aria-label="Explicit hint requests">{([["hint1", "Hint 1"], ["hint2", "Hint 2"], ["hint3", "Hint 3"], ["solution", "Full solution"]] as const).map(([level, label]) => <button className="border border-line px-2.5 py-1.5 text-[11px] text-muted hover:bg-hover hover:text-foreground disabled:opacity-50" disabled={waiting || !messages.some((message) => message.role === "user")} key={level} onClick={() => void sendMessage(`Please give me ${label === "Full solution" ? "the full solution" : `Hint ${label.slice(-1)}`} for my current question.`, level)} type="button">{label}</button>)}</div>
          <form onSubmit={submit}><label className="sr-only" htmlFor="tutor-message">Message the DSA tutor</label><div className="flex items-end gap-2 border border-line-strong bg-panel p-2 focus-within:border-accent"><textarea className="min-h-11 max-h-36 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted" disabled={waiting || !configured} id="tutor-message" maxLength={4_000} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask about an algorithm or problem…" rows={2} value={draft} /><button className="inline-flex h-10 shrink-0 items-center gap-2 bg-accent px-3 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50" disabled={!draft.trim() || waiting || !configured} type="submit"><svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 12 20 4l-5 16-3-7-8-1Zm8 1 4-5" /></svg><span className="hidden sm:inline">Send</span></button>{waiting && <button className="h-10 shrink-0 border border-line px-3 text-sm text-foreground hover:bg-hover" onClick={() => void stopGeneration()} type="button">Stop</button>}</div></form>
          <p className="mt-2 text-[11px] leading-4 text-muted">Sent to Google Gemini. Unpaid API usage may be used to improve Google products and may be reviewed. Do not share sensitive information. · {requestsUsed}/{dailyLimit} daily requests used</p>
        </div>
      </>}
    </div>
    {mobileHistoryOpen && <button aria-label="Close conversation history" className="absolute inset-0 z-20 bg-black/50 md:hidden" onClick={() => setMobileHistoryOpen(false)} type="button" />}
  </section>;
}

export default memo(TutorChat);
