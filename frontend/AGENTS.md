# Repository Guidelines

## Project Structure & Module Organization
- Next.js App Router lives in `src/app` (routes like `dashboard`, `profile`, API handlers under `api/`).
- Shared UI and client logic go to `src/components`, `src/hooks`, `src/lib`, `src/utils`; TRPC routers live in `src/server/routers` and surface through `src/server/trpc.ts`.
- Theme primitives sit in `src/theme.ts`; domain types in `src/types`. Import with the `@/*` alias from `tsconfig.json`.
- Database models and seeds are in `prisma/` and depend on `DATABASE_URL`. Static assets belong in `public/`.

## Build, Test, and Development Commands
- `npm run dev` launches the Turbopack dev server on port 3100; load `.env` and start Postgres first.
- `npm run build` runs `prisma generate` then `next build`; treat it as the pre-push gate.
- `npm run start` serves the optimized build. `npm run lint` applies `eslint-config-next`.
- Database helpers: `npm run db:push` syncs the schema, `npm run db:seed` populates fixtures, `npm run db:reset` drops and re-seeds, `npm run db:studio` opens Prisma Studio.

## Coding Style & Naming Conventions
- Use strict TypeScript, two-space indentation, single quotes, and trailing commas. Components stay PascalCase; hooks stay camelCase with a `use` prefix.
- Put `use client` only on files that truly need it. Keep Mantine styling colocated with its component or hook.
- Prefer named exports under 400-line modules; rely on `npm run lint` to enforce `eslint.config.mjs`.

## Testing Guidelines
- No default test runner exists yet; include manual verification notes in PRs and add focused tests when you introduce a new dependency.
- Co-locate integration tests beside the affected feature (e.g., `src/app/project/__tests__`) and use `tsx` to execute ad-hoc runner scripts.
- Refresh `prisma/seed.ts` when schema changes so reviewers can reproduce your scenario quickly.

## Commit & Pull Request Guidelines
- Follow the existing log: short, imperative subjects such as `Add voting strategies`.
- Group related changes per commit, reference issues in the PR body, and list schema or seed adjustments explicitly.
- Before requesting review, run `npm run lint` and `npm run build`, attach screenshots for UI tweaks, and call out migrations or env changes.

## Environment & Security Tips
- Keep secrets in `.env` only; share sample values out of band. Use disposable Postgres instances for local work.
- Sanitize wallet data in `src/server/middleware.ts` and avoid long-term logging of credentials; limit `pino-pretty` logging to local debugging.
