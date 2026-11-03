import { NextResponse } from "next/server";

type AuthMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function unavailable() {
  return NextResponse.json(
    { error: "Authentication is not configured. Set DATABASE_URL and BETTER_AUTH_SECRET on the server." },
    { status: 503 },
  );
}

async function handle(request: Request, method: AuthMethod) {
  if (!process.env.DATABASE_URL?.trim() || !process.env.BETTER_AUTH_SECRET?.trim()) return unavailable();
  const [{ auth }, { toNextJsHandler }] = await Promise.all([
    import("@/lib/auth"),
    import("better-auth/next-js"),
  ]);
  return toNextJsHandler(auth)[method](request);
}

export const GET = (request: Request) => handle(request, "GET");
export const POST = (request: Request) => handle(request, "POST");
export const PUT = (request: Request) => handle(request, "PUT");
export const PATCH = (request: Request) => handle(request, "PATCH");
export const DELETE = (request: Request) => handle(request, "DELETE");
