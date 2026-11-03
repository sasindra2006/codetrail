# CodeTrail

## Product

CodeTrail is a DSA learning platform focused on:

- algorithm visualization
- DSA problem practice
- complexity analysis
- learning analytics
- AI tutoring

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- MySQL
- Next.js API routes
- Recharts
- Monaco Editor

## Engineering Rules

- Inspect existing files before modifying them.
- Never invent existing code or project structure.
- Do not add dependencies without justification.
- Keep components focused and reusable.
- Separate algorithm logic from visualization logic.
- Prefer maintainable architecture over shortcuts.
- Do not implement future features prematurely.
- Preserve existing project decisions unless there is a technical reason to change them.
- Run lint and build after meaningful changes.

## Development Strategy

Build CodeTrail incrementally.

Do not attempt to implement the entire application at once.

The development order is:

1. Application shell
2. Dashboard
3. Algorithm engine
4. Algorithm visualization
5. Problem practice
6. Database
7. Analytics
8. AI features
9. Online code execution

AI functionality comes later.

## UI Direction

CodeTrail should feel like a professional developer/productivity platform.

Prefer:

- dark UI
- near-black surfaces
- subtle borders
- strong visual hierarchy
- clean typography
- generous spacing
- restrained use of accent colors
- subtle animations
- responsive layouts
- accessible interactions

Avoid:

- excessive gradients
- excessive rounded cards
- unnecessary animations
- emoji-based UI
- generic AI-dashboard aesthetics

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
