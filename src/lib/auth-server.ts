import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession(requestHeaders?: Headers) {
  const resolvedHeaders = requestHeaders ?? await headers();
  if (!process.env.DATABASE_URL?.trim() || !process.env.BETTER_AUTH_SECRET?.trim()) return null;
  const { auth } = await import("@/lib/auth");
  return auth.api.getSession({ headers: resolvedHeaders });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
