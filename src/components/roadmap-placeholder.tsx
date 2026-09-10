export function RoadmapPlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="max-w-xl text-base leading-7 text-muted">{description}</p>
      <div className="mt-4 border border-line bg-panel px-5 py-4 text-sm leading-6 text-muted">
        This section is on the CodeTrail roadmap. Its learning tools will appear here as the workspace develops.
      </div>
    </section>
  );
}
