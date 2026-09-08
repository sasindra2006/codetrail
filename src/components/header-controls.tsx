"use client";

import { useEffect, useRef, useState } from "react";

const profileItems = ["Profile", "Settings", "Sign out"];

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.68-1.42 1.42m-9.88 9.88-1.42 1.42" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function HeaderControls() {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeProfile);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", closeProfile);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    localStorage.setItem("codetrail-theme", nextTheme);
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <label className="hidden h-9 w-64 items-center gap-2 border border-line bg-panel px-3 text-muted outline-none transition-colors focus-within:border-line-strong focus-within:ring-2 focus-within:ring-accent/30 lg:flex">
        <SearchIcon />
        <span className="sr-only">Search CodeTrail</span>
        <input className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none" placeholder="Search algorithms, problems..." type="search" />
      </label>
      <span className="border border-line px-2.5 py-1 text-xs font-medium text-muted">
        <span className="hidden sm:inline">Learning mode</span>
        <span className="sm:hidden">Mode</span>
      </span>
      <button aria-label="Toggle color theme" className="grid size-9 place-items-center border border-line bg-panel text-muted outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/70" onClick={toggleTheme} type="button">
        <ThemeIcon />
      </button>
      <div ref={profileRef} className="relative">
        <button aria-controls="profile-menu" aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Open profile placeholder menu" className="grid size-9 place-items-center rounded-full border border-line-strong bg-panel text-xs font-semibold text-foreground outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent/70" onClick={() => setProfileOpen((open) => !open)} ref={profileButtonRef} type="button">
          C
        </button>
        {profileOpen ? (
          <div aria-label="Profile placeholder menu" className="absolute right-0 top-11 z-10 w-48 border border-line-strong bg-panel p-1 shadow-xl shadow-black/10" id="profile-menu" role="menu">
            <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Placeholder controls</p>
            {profileItems.map((item) => (
              <button className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground outline-none transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-accent/70" key={item} onClick={() => setProfileOpen(false)} role="menuitem" type="button">
                {item}
                <span className="text-xs text-muted">Placeholder</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
