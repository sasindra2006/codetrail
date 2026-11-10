"use client";

import { Children, isValidElement, useState, type ComponentProps, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

function CopyButton({ code, label = "Copy code" }: { code: string; label?: string }) {
  const [feedback, setFeedback] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setFeedback("copied");
    } catch {
      setFeedback("failed");
    }
    window.setTimeout(() => setFeedback("idle"), 1800);
  }

  const text = feedback === "copied" ? "Copied" : feedback === "failed" ? "Copy failed" : label;
  return <button aria-live="polite" className="shrink-0 border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => void copy()} type="button">{text}</button>;
}

function safeUrl(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized.startsWith("#") || normalized.startsWith("/") || normalized.startsWith("./") || normalized.startsWith("../")) return normalized;
  try {
    const url = new URL(normalized);
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? normalized : "";
  } catch {
    return "";
  }
}

type CodeElementProps = { className?: string; children?: ReactNode };

function CodeBlock({ children }: { children: ReactNode }) {
  const child = Children.only(children);
  const codeProps = isValidElement<CodeElementProps>(child) ? child.props : undefined;
  const language = codeProps?.className?.match(/language-([^\s]+)/)?.[1] ?? "Code";
  const code = typeof codeProps?.children === "string" ? codeProps.children : "";

  return <div className="my-4 w-full min-w-0 max-w-full overflow-hidden border border-zinc-800 bg-[#09090b]">
    <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2">
      <span className="truncate text-[11px] font-medium text-zinc-400">{language}</span>
      <CopyButton code={code} />
    </div>
    <pre className="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words p-3 font-mono text-xs leading-5 text-zinc-100 [overflow-wrap:anywhere] [tab-size:2]"><code className="whitespace-pre-wrap [overflow-wrap:anywhere]">{codeProps?.children}</code></pre>
  </div>;
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mt-6 text-xl font-semibold leading-tight text-foreground first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 text-lg font-semibold leading-tight text-foreground first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-5 text-base font-semibold leading-6 text-foreground">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-4 text-sm font-semibold leading-6 text-foreground">{children}</h4>,
  p: ({ children }) => <p className="my-3 min-w-0 max-w-full break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere] first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-3 min-w-0 max-w-full list-disc space-y-1 pl-6 text-sm leading-6 text-foreground [overflow-wrap:anywhere]">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 min-w-0 max-w-full list-decimal space-y-1 pl-6 text-sm leading-6 text-foreground [overflow-wrap:anywhere]">{children}</ol>,
  li: ({ children, ...props }) => <li className="min-w-0 max-w-full break-words pl-1 marker:text-muted [overflow-wrap:anywhere]" {...props}>{children}</li>,
  blockquote: ({ children }) => <blockquote className="my-4 min-w-0 max-w-full break-words border-l-2 border-accent/60 pl-4 text-sm text-muted [overflow-wrap:anywhere]">{children}</blockquote>,
  hr: () => <hr className="my-5 border-line" />,
  a: ({ href, children }) => <a className="break-all text-accent underline decoration-accent/50 underline-offset-2 hover:decoration-accent" href={href}>{children}</a>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-muted">{children}</del>,
  code: ({ className, children, ...props }) => <code className={className ?? "break-all rounded-sm border border-line bg-panel px-1 py-0.5 font-mono text-[0.9em] text-accent"} {...props}>{children}</code>,
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => <div className="my-4 block w-full min-w-0 max-w-full overflow-x-auto border border-line [overscroll-behavior-x:contain]"><table className="w-max min-w-full border-collapse text-left text-sm">{children}</table></div>,
  thead: ({ children }) => <thead className="bg-hover text-xs uppercase tracking-wide text-muted">{children}</thead>,
  th: ({ children }) => <th className="max-w-64 border-b border-line px-3 py-2 font-semibold [overflow-wrap:anywhere]">{children}</th>,
  td: ({ children }) => <td className="max-w-64 border-b border-line px-3 py-2 align-top text-foreground [overflow-wrap:anywhere] last:border-b-0">{children}</td>,
  tr: ({ children }) => <tr className="even:bg-panel/60">{children}</tr>,
  input: (props: ComponentProps<"input">) => <input {...props} className="mr-2 accent-[var(--accent)]" disabled readOnly />,
};

export function TutorMarkdown({ content }: { content: string }) {
  return <div className="tutor-markdown w-full min-w-0 max-w-full text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
    <ReactMarkdown
      components={markdownComponents}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, trust: false, strict: "ignore" }] as never]}
      remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }] as never]}
      urlTransform={safeUrl}
    >{content}</ReactMarkdown>
  </div>;
}

export function TutorAnswerCopy({ content }: { content: string }) {
  return <CopyButton code={content} label="Copy answer" />;
}
