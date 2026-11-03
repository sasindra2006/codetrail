"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  readLocalPreferences,
  serverLocalPreferences,
  subscribeLocalPreferences,
  writeLocalPreferences,
  type LocalPreferences,
} from "@/lib/local-preferences";
import { ThemeToggle } from "@/components/theme-toggle";

const learningGoals: LocalPreferences["learningGoal"][] = [
  "Build a steady practice habit",
  "Strengthen algorithm fundamentals",
  "Prepare for technical interviews",
];

function AccountNotice() {
  return (
    <div className="border border-line bg-surface p-4">
      <p className="text-sm font-medium text-foreground">No account is connected</p>
      <p className="mt-1 text-sm leading-6 text-muted">These preferences are saved only in this browser. Sign-in and cloud sync are not available yet.</p>
    </div>
  );
}

function PreferenceForm({ heading }: { heading: string }) {
  const preferences = useSyncExternalStore(subscribeLocalPreferences, readLocalPreferences, serverLocalPreferences);
  const [saveError, setSaveError] = useState(false);

  return (
    <div className="border border-line bg-panel p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
      <label className="mt-5 block max-w-xl text-xs font-medium text-muted" htmlFor="display-name">
        Display name
        <input
          autoComplete="nickname"
          className="mt-2 h-11 w-full border border-line-strong bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
          id="display-name"
          maxLength={60}
          onChange={(event) => { setSaveError(!writeLocalPreferences({ ...preferences, displayName: event.target.value })); }}
          placeholder="How should CodeTrail address you?"
          value={preferences.displayName}
        />
      </label>
      <label className="mt-5 block max-w-xl text-xs font-medium text-muted" htmlFor="learning-goal">
        Learning focus
        <select
          className="mt-2 h-11 w-full border border-line-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
          id="learning-goal"
          onChange={(event) => { setSaveError(!writeLocalPreferences({ ...preferences, learningGoal: event.target.value as LocalPreferences["learningGoal"] })); }}
          value={preferences.learningGoal}
        >
          {learningGoals.map((goal) => <option key={goal} value={goal}>{goal}</option>)}
        </select>
      </label>
      <p aria-live="polite" className={`mt-4 text-xs ${saveError ? "text-amber-500" : "text-muted"}`} role="status">{saveError ? "Browser storage is unavailable; preferences were not saved." : "Changes save in this browser as you make them."}</p>
    </div>
  );
}

export function ProfilePage() {
  const preferences = useSyncExternalStore(subscribeLocalPreferences, readLocalPreferences, serverLocalPreferences);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-7">
      <header className="border-b border-line pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Your workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Manage the local preferences used by this browser.</p>
      </header>
      <div className="flex items-center gap-4 border border-line bg-panel p-5">
        <div aria-hidden="true" className="grid size-12 place-items-center border border-line-strong bg-surface text-lg font-semibold text-foreground">{preferences.displayName.trim().charAt(0).toUpperCase() || "C"}</div>
        <div>
          <p className="font-medium text-foreground">{preferences.displayName.trim() || "Local CodeTrail profile"}</p>
          <p className="mt-1 text-xs text-muted">No account or email address connected</p>
        </div>
      </div>
      <PreferenceForm heading="Profile and learning focus" />
      <AccountNotice />
      <Link className="w-fit text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href="/settings">Open settings</Link>
    </section>
  );
}

export function SettingsPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-7">
      <header className="border-b border-line pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Workspace controls</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Set display and learning preferences for this browser.</p>
      </header>
      <section className="border border-line bg-panel p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted">Choose the color theme used across CodeTrail.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3"><ThemeToggle /><span className="text-xs text-muted">Use the theme button to switch between dark and light mode.</span></div>
      </section>
      <PreferenceForm heading="Learning preferences" />
      <AccountNotice />
      <Link className="w-fit text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href="/profile">View profile</Link>
    </section>
  );
}
