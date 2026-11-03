export type LocalPreferences = {
  displayName: string;
  learningGoal: "Build a steady practice habit" | "Strengthen algorithm fundamentals" | "Prepare for technical interviews";
};

export const defaultLocalPreferences: LocalPreferences = {
  displayName: "",
  learningGoal: "Build a steady practice habit",
};

const storageKey = "codetrail-local-preferences-v1";
let cachedRaw: string | null | undefined;
let cachedPreferences = defaultLocalPreferences;
const listeners = new Set<() => void>();

function parsePreferences(raw: string | null): LocalPreferences {
  if (!raw) return defaultLocalPreferences;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return defaultLocalPreferences;
    const candidate = value as Partial<LocalPreferences>;
    const allowedGoals = [
      "Build a steady practice habit",
      "Strengthen algorithm fundamentals",
      "Prepare for technical interviews",
    ] as const;
    return {
      displayName: typeof candidate.displayName === "string" ? candidate.displayName.slice(0, 60) : "",
      learningGoal: allowedGoals.includes(candidate.learningGoal as (typeof allowedGoals)[number])
        ? candidate.learningGoal as LocalPreferences["learningGoal"]
        : defaultLocalPreferences.learningGoal,
    };
  } catch {
    return defaultLocalPreferences;
  }
}

export function readLocalPreferences(): LocalPreferences {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === cachedRaw) return cachedPreferences;
    cachedRaw = raw;
    cachedPreferences = parsePreferences(raw);
    return cachedPreferences;
  } catch {
    return cachedPreferences;
  }
}

export function subscribeLocalPreferences(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      cachedRaw = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function serverLocalPreferences() {
  return defaultLocalPreferences;
}

export function writeLocalPreferences(preferences: LocalPreferences) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
    cachedRaw = JSON.stringify(preferences);
    cachedPreferences = preferences;
    listeners.forEach((listener) => listener());
    return true;
  } catch {
    return false;
  }
}
