import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeTrail | Learn Data Structures & Algorithms",
  description:
    "A focused workspace for learning data structures and algorithms.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
