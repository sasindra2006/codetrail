import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";
import { type IconName, NavigationIcon } from "./navigation-icon";

const navigationItems: ReadonlyArray<{ label: string; icon: IconName }> = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Algorithms", icon: "algorithms" },
  { label: "Problems", icon: "problems" },
  { label: "Analytics", icon: "analytics" },
  { label: "AI Tutor", icon: "tutor" },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <span className="text-sm font-semibold tracking-tight text-zinc-100">
        CodeTrail
      </span>
    </div>
  );
}

function Navigation({ compact = false }: { compact?: boolean }) {
  return (
    <nav
      aria-label="Primary navigation"
      className={compact ? "flex gap-1 overflow-x-auto px-4 py-2" : "space-y-1"}
    >
      {navigationItems.map((item, index) => {
        const active = index === 0;

        return (
          <button
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 border text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${
              compact
                ? `shrink-0 border-transparent px-3 py-2 ${active ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`
                : `w-full px-3 py-2.5 text-left ${active ? "border-zinc-700 bg-zinc-800 text-zinc-50" : "border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200"}`
            }`}
            key={item.label}
            type="button"
          >
            <NavigationIcon name={item.icon} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 md:flex">
      <div className="flex h-16 items-center border-b border-zinc-800 px-6">
        <Brand />
      </div>
      <div className="flex flex-1 flex-col px-3 py-6">
        <p className="px-3 pb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Workspace
        </p>
        <Navigation />
      </div>
      <div className="border-t border-zinc-800 px-6 py-5 text-xs leading-5 text-zinc-500">
        Build fluency, one concept at a time.
      </div>
    </aside>
  );
}

function Header() {
  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-5 sm:px-8">
        <div className="md:hidden">
          <Brand />
        </div>
        <p className="hidden text-sm font-medium text-zinc-300 md:block">Dashboard</p>
        <span className="border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400">
          Learning mode
        </span>
      </header>
      <div className="border-b border-zinc-800 bg-zinc-950 md:hidden">
        <Navigation compact />
      </div>
    </>
  );
}

export function ApplicationShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
