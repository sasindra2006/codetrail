"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./brand-mark";
import { HeaderControls } from "./header-controls";
import { type IconName, NavigationIcon } from "./navigation-icon";

const navigationItems: ReadonlyArray<{
  label: string;
  href: string;
  icon: IconName;
}> = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Algorithms", href: "/algorithms", icon: "algorithms" },
  { label: "Problems", href: "/problems", icon: "problems" },
  { label: "Analytics", href: "/analytics", icon: "analytics" },
  { label: "AI Tutor", href: "/tutor", icon: "tutor" },
];

function Brand() {
  return (
    <Link
      aria-label="CodeTrail dashboard"
      className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      href="/dashboard"
    >
      <BrandMark />
      <span className="text-sm font-semibold tracking-tight text-foreground">
        CodeTrail
      </span>
    </Link>
  );
}

function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Navigation({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className={compact ? "flex gap-1 overflow-x-auto px-4 py-2" : "space-y-1"}
    >
      {navigationItems.map((item) => {
        const active = isNavigationItemActive(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 border text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/70 ${
              compact
                ? `shrink-0 border-transparent px-3 py-2 ${active ? "bg-panel text-foreground" : "text-muted hover:bg-hover hover:text-foreground"}`
                : `w-full px-3 py-2.5 text-left ${active ? "border-line-strong bg-panel text-foreground" : "border-transparent text-muted hover:border-line hover:bg-hover hover:text-foreground"}`
            }`}
            href={item.href}
            key={item.label}
          >
            <NavigationIcon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="flex h-16 items-center border-b border-line px-6">
        <Brand />
      </div>
      <div className="flex flex-1 flex-col px-3 py-6">
        <p className="px-3 pb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          Workspace
        </p>
        <Navigation />
      </div>
      <div className="border-t border-line px-6 py-5 text-xs leading-5 text-muted">
        Build fluency, one concept at a time.
      </div>
    </aside>
  );
}

function Header() {
  const pathname = usePathname();
  const currentSection =
    navigationItems.find((item) => isNavigationItemActive(pathname, item.href))
      ?.label ?? "Workspace";

  return (
    <>
      <header className="flex h-16 items-center justify-between gap-4 border-b border-line bg-surface px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3 md:hidden">
          <Brand />
          <span className="truncate border-l border-line pl-3 text-sm font-medium text-muted">
            {currentSection}
          </span>
        </div>
        <p className="hidden text-sm font-medium text-muted md:block">
          {currentSection}
        </p>
        <HeaderControls />
      </header>
      <div className="border-b border-line bg-surface md:hidden">
        <Navigation compact />
      </div>
    </>
  );
}

export function ApplicationShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface text-foreground">
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
