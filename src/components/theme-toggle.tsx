"use client";


function SunIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.68-1.42 1.42m-9.88 9.88-1.42 1.42" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      <path d="M20.2 14.1A8 8 0 0 1 9.9 3.8 8 8 0 1 0 20.2 14.1Z" />
    </svg>
  );
}

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    localStorage.setItem("codetrail-theme", nextTheme);
  }

  return (
    <button
      aria-label="Toggle color theme"
      className="grid size-9 place-items-center border border-line bg-panel text-muted outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/70"
      onClick={toggleTheme}
      type="button"
    >
      <span className="theme-toggle-sun">
        <SunIcon />
      </span>
      <span className="theme-toggle-moon">
        <MoonIcon />
      </span>
    </button>
  );
}
