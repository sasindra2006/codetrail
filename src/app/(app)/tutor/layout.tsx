import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth-server";

export default async function TutorLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return children;
}
