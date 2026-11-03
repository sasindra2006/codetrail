"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

export function HeaderControls() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && profileOpen) {
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
  }, [profileOpen]);

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setProfileOpen(false);
    }
  }

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    router.push(`/problems?search=${encodeURIComponent(value)}`);
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <form className="hidden h-9 w-64 items-center gap-2 border border-line bg-panel px-3 text-muted outline-none transition-colors focus-within:border-line-strong focus-within:ring-2 focus-within:ring-accent/30 lg:flex" onSubmit={search} role="search">
        <SearchIcon />
        <label className="sr-only" htmlFor="global-problem-search">Search problems</label>
        <input className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none" id="global-problem-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search problems..." type="search" value={query} />
        <button aria-label="Submit problem search" className="sr-only" type="submit">Search</button>
      </form>
      <ThemeToggle />
      <div className="relative" onBlur={handleBlur} ref={profileRef}>
        <button aria-controls="profile-menu" aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Open profile and settings menu" className="grid size-9 place-items-center rounded-full border border-line-strong bg-panel text-xs font-semibold text-foreground outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent/70" onClick={() => setProfileOpen((open) => !open)} ref={profileButtonRef} type="button">
          C
        </button>
        {profileOpen ? (
          <div aria-label="Profile and settings" className="absolute right-0 top-11 z-10 w-48 border border-line-strong bg-panel p-1 shadow-xl shadow-black/10" id="profile-menu" role="menu">
            <Link className="block px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-accent/70" href="/profile" onClick={() => setProfileOpen(false)} role="menuitem">Profile</Link>
            <Link className="block px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-accent/70" href="/settings" onClick={() => setProfileOpen(false)} role="menuitem">Settings</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
