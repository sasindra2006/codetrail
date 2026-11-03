import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDatabase } from "@/lib/db";

const database = process.env.DATABASE_URL?.trim()
  ? drizzleAdapter(getDatabase(), { provider: "mysql" })
  : undefined;

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const authSecret = process.env.BETTER_AUTH_SECRET?.trim();
const baseURL = process.env.BETTER_AUTH_URL?.trim();

export const auth = betterAuth({
  ...(database ? { database } : {}),
  ...(authSecret ? { secret: authSecret } : {}),
  ...(baseURL ? { baseURL } : {}),
  emailAndPassword: { enabled: true },
  socialProviders: googleClientId && googleClientSecret
    ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
    : {},
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
