import type { Metadata } from "next";
import "./globals.css";

const themeInitializationScript = `(() => {
  try {
    const savedTheme = localStorage.getItem("codetrail-theme");
    const theme = savedTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    // Keep the dark CSS defaults if browser storage is unavailable.
  }
})();`;

export const metadata: Metadata = {
  title: "CodeTrail | Learn Data Structures & Algorithms",
  description:
    "A focused workspace for learning data structures and algorithms.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
