"use client";

import katex from "katex";
import { useState } from "react";
import type { ProblemContentBlock, ProblemSection, SampleCase } from "@/lib/problems";

const safeImageHosts = new Set([
  "images.unsplash.com",
  "images.githubusercontent.com",
  "user-images.githubusercontent.com",
]);

function isSafeImageSource(source: string) {
  try {
    const url = new URL(source);
    return url.protocol === "https:" && safeImageHosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function MathExpression({ latex, display = false }: { latex: string; display?: boolean }) {
  const markup = katex.renderToString(latex, {
    displayMode: display,
    throwOnError: false,
    strict: "ignore",
    trust: false,
    output: "htmlAndMathml",
  });

  // KaTeX emits its own constrained markup; source text is parsed with trust disabled.
  return (
    <span
      className={display ? "problem-math-display" : "problem-math-inline"}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      setFailed(true);
    }
  }

  return (
    <button
      className="shrink-0 border border-line px-2 py-1 text-[11px] text-muted outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent"
      onClick={copy}
      type="button"
    >
      {copied ? "Copied" : failed ? "Copy unavailable" : `Copy ${label}`}
    </button>
  );
}

function ProblemImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const [failed, setFailed] = useState(false);
  if (!isSafeImageSource(src)) {
    return <p className="my-3 border border-line bg-panel px-3 py-2 text-xs text-muted">Image source unavailable: {alt}</p>;
  }

  return (
    <figure className="my-4 min-w-0">
      {failed ? (
        <div className="grid min-h-24 place-items-center border border-line bg-panel px-4 text-xs text-muted" role="status">
          Image could not be loaded: {alt}
        </div>
      ) : (
        // The source is restricted to HTTPS and an explicit host allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt}
          className="mx-auto h-auto max-h-[32rem] max-w-full border border-line object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
          src={src}
        />
      )}
      {caption && <figcaption className="mt-2 text-center text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}

function renderInline(text: string) {
  const tokens = text.split(/(`[^`\n]+`|\$[^$\n]+\$|!\[[^\]]*\]\([^)]+\))/g);
  return tokens.map((token, index) => {
    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(token);
    if (image) {
      return <ProblemImage alt={image[1] || "Problem illustration"} key={index} src={image[2]} />;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code className="border border-line bg-panel px-1 py-0.5 font-mono text-[0.9em] text-foreground" key={index}>{token.slice(1, -1)}</code>;
    }
    if (token.startsWith("$") && token.endsWith("$")) {
      return <MathExpression key={index} latex={token.slice(1, -1)} />;
    }
    return token;
  });
}

function parsePlainText(statement: string): ProblemContentBlock[] {
  const lines = statement.split("\n");
  const blocks: ProblemContentBlock[] = [];
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join("\n") });
      paragraph = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = /^```([^\s`]*)\s*$/.exec(line);
    if (fence) {
      flushParagraph();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", code: code.join("\n"), language: fence[1] || undefined });
    } else if (line.trim() === "$$") {
      flushParagraph();
      const math: string[] = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== "$$") {
        math.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "math", latex: math.join("\n") });
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  return blocks;
}

function ContentBlocks({ blocks }: { blocks: ProblemContentBlock[] }) {
  return (
    <div className="space-y-3 text-sm leading-7 text-muted">
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <div className="overflow-hidden border border-line bg-panel" key={index}>
              {block.language && <p className="border-b border-line px-3 py-1 text-[11px] text-muted">{block.language}</p>}
              <pre className="max-w-full overflow-x-auto p-3 font-mono text-xs leading-5 text-foreground"><code>{block.code}</code></pre>
            </div>
          );
        }
        if (block.type === "math") return <MathExpression display key={index} latex={block.latex} />;
        if (block.type === "image") {
          return <ProblemImage alt={block.alt} caption={block.caption} key={index} src={block.src} />;
        }
        return <p className="whitespace-pre-line break-words" key={index}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}

export function ProblemStatement({ statement, sections }: { statement?: string; sections?: ProblemSection[] }) {
  if (sections?.length) {
    return (
      <div className="space-y-7">
        {sections.map((section, index) => (
          <section key={`${index}-${section.title}`}>
            <h2 className="mb-2 text-sm font-semibold text-foreground">{section.title}</h2>
            <ContentBlocks blocks={section.content} />
          </section>
        ))}
      </div>
    );
  }
  return <ContentBlocks blocks={parsePlainText(statement ?? "")} />;
}

export function ProblemExamples({ samples }: { samples: SampleCase[] }) {
  if (!samples.length) {
    return <p className="text-sm text-muted">No examples are available for this problem.</p>;
  }

  return (
    <div className="space-y-3">
      {samples.map((sample, index) => (
        <article className="min-w-0 border border-line bg-surface" key={`${index}-${sample.name}`}>
          <h3 className="border-b border-line px-3 py-2 text-xs font-semibold text-foreground">
            {sample.name || `Example ${index + 1}`}
          </h3>
          <div className="grid min-w-0 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {([ ["Input", sample.input], ["Output", sample.expectedOutput] ] as const).map(([label, value]) => (
              <section className="min-w-0" key={label}>
                <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                  <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</h4>
                  <CopyButton label={label.toLowerCase()} value={value} />
                </div>
                <pre className="max-w-full overflow-x-auto p-3 font-mono text-xs leading-5 text-foreground"><code>{value}</code></pre>
              </section>
            ))}
          </div>
          {sample.explanation && (
            <div className="border-t border-line px-3 py-3">
              <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">Explanation</h4>
              <ProblemStatement statement={sample.explanation} />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
