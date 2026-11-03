"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthLeftPanel } from "@/components/auth-left-panel";

export function MarketingLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/login" && pathname !== "/register") return children;

  return (
    <main className="auth-experience grid min-h-dvh bg-[#080a18] text-white md:grid-cols-[45fr_55fr]">
      <section className="auth-left-column relative min-w-0 overflow-hidden border-b border-white/10 bg-[radial-gradient(ellipse_at_12%_8%,rgba(59,66,145,0.22),transparent_44%),linear-gradient(135deg,#11132a_0%,#090b1b_58%,#0b0d20_100%)] px-6 py-5 sm:px-10 md:border-b-0 md:border-r md:px-8 md:py-5 lg:px-12 lg:py-7">
        <AuthLeftPanel />
      </section>
      <section className="auth-right-column relative flex min-w-0 items-center justify-center bg-[#080a18] px-4 py-8 sm:px-8 md:px-8 md:py-4 lg:px-12 lg:py-3">
        <div aria-hidden="true" className="auth-right-glow pointer-events-none absolute inset-0" />
        <div className="relative z-10 w-full max-w-[31rem]">{children}</div>
      </section>
    </main>
  );
}
