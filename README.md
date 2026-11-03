# CodeTrail

CodeTrail is a DSA learning workspace built with Next.js, React, TypeScript, and Tailwind CSS.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. Use a MySQL URL in the form `mysql://<user>:<password>@<host>:3306/<database>`. Generate a unique secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Database/auth routes return an unavailable response until the database and session secret are configured; the rest of the app can still build.
3. Create the MySQL database named in your connection URL.
4. Generate the Better Auth Drizzle schema and the combined SQL migration, then apply it:

   ```bash
   npm run auth:generate-schema
   npm run db:generate
   npm run db:migrate
   ```

   Review and commit the generated files under `src/lib/db/auth-schema.ts` and `drizzle/`. The auth schema is generated from the Better Auth configuration; profile and preference tables are defined in `src/lib/db/schema.ts`.
5. Start the app with `npm run dev`.

## Authentication setup

Email/password signup and login use Better Auth. To enable Google sign-in, set the server-only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Add this authorized redirect URI in Google Cloud Console:

```text
http://localhost:3000/api/auth/callback/google
```

Use `https://<your-domain>/api/auth/callback/google` in production and set `BETTER_AUTH_URL` to that origin. Generate a unique `BETTER_AUTH_SECRET` for each environment. Never expose database or OAuth secrets in `NEXT_PUBLIC_` variables.

The dashboard, analytics, profile, settings, and tutor areas require a valid session. Problem browsing and algorithm visualization remain available without signing in. Profile and preference UI still uses browser storage in this milestone; the database tables are prepared for the next persistence milestone.

## Useful commands

```bash
npm run dev
npm run lint
npm run db:generate
npm run db:migrate
```
