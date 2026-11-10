import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

function removeRedundantLeadHeadings(markdown: string) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) index += 1;
    if (!/^#{1,6}\s+(?:description|instructions)\s*#*\s*$/i.test(lines[index] ?? "")) break;
    index += 1;
  }

  return lines.slice(index).join("\n").trimStart();
}

function safeUrlTransform(url: string) {
  const transformed = defaultUrlTransform(url);
  if (transformed.startsWith("http://") || transformed.startsWith("https://")
    || transformed.startsWith("mailto:") || (transformed.startsWith("/") && !transformed.startsWith("//"))
    || transformed.startsWith("#")) return transformed;
  return "";
}

export function ExerciseMarkdown({ children }: { children: string }) {
  return (
    <div className="exercise-markdown break-words text-sm leading-7 text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrlTransform}
        components={{
          h1: ({ children: content }) => <h2 className="mb-3 mt-6 text-lg font-semibold first:mt-0">{content}</h2>,
          h2: ({ children: content }) => <h2 className="mb-3 mt-6 text-base font-semibold first:mt-0">{content}</h2>,
          h3: ({ children: content }) => <h3 className="mb-2 mt-5 text-sm font-semibold">{content}</h3>,
          p: ({ children: content }) => <p className="mb-3 last:mb-0">{content}</p>,
          ul: ({ children: content }) => <ul className="mb-4 list-disc space-y-1 pl-6">{content}</ul>,
          ol: ({ children: content }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{content}</ol>,
          blockquote: ({ children: content }) => <blockquote className="my-4 border-l-2 border-accent pl-4 text-muted">{content}</blockquote>,
          code: ({ children: content, className }) => className
            ? <code className="font-mono text-xs">{content}</code>
            : <code className="border border-line bg-surface px-1 py-0.5 font-mono text-[0.9em]">{content}</code>,
          pre: ({ children: content }) => <pre className="my-4 max-w-full overflow-x-auto border border-line bg-surface p-3 font-mono text-xs leading-5">{content}</pre>,
          a: ({ children: content, href }) => <a className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent" href={href} rel="noreferrer noopener" target="_blank">{content}</a>,
          hr: () => <hr className="my-5 border-line" />,
        }}
      >
        {removeRedundantLeadHeadings(children)}
      </ReactMarkdown>
    </div>
  );
}
