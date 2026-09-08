import type { ReactNode } from "react";

export type IconName =
  | "dashboard"
  | "algorithms"
  | "problems"
  | "analytics"
  | "tutor";

const iconPaths: Record<IconName, ReactNode> = {
  dashboard: <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />,
  algorithms: <path d="m8 5-5 7 5 7M16 5l5 7-5 7M14 3l-4 18" />,
  problems: <path d="M6 3h12v18H6V3Zm3 5h6m-6 4h6m-6 4h4" />,
  analytics: <path d="M4 19V5m0 14h16M8 16v-4m4 4V7m4 9v-6" />,
  tutor: <path d="M12 3a7 7 0 0 0-4 12.74V20l4-2 4 2v-4.26A7 7 0 0 0 12 3Zm-3 9 2-2 2 2 3-3" />,
};

export function NavigationIcon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}
