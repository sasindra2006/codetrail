import { ApplicationShell } from "@/components/application-shell";

export default function Home() {
  return (
    <ApplicationShell>
      <section className="flex max-w-2xl flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400">
          Learning workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Your algorithm practice, organized.
        </h1>
        <p className="max-w-xl text-base leading-7 text-zinc-400">
          CodeTrail brings your DSA learning into one focused workspace. Choose a
          section from the navigation to begin when those learning tools are ready.
        </p>
      </section>
    </ApplicationShell>
  );
}
