import { betterAuth } from "better-auth";

// The Better Auth CLI uses this database-independent config to generate its
// Drizzle tables without requiring a running MySQL server or credentials.
export const auth = betterAuth({
  emailAndPassword: { enabled: true },
  socialProviders: {},
});
