# Progress and handoff

## 2026-11-06 — Dashboard and visualization milestone

Authorized scope: visualization-first dashboard using Recharts/shadcn, income/expense/balance cards, interactive expense-category donut, monthly expense trend, date ranges, recent transactions and aggregation/security tests. The explicit monthly request supersedes the initial daily-trend proposal. MMK/0/Asia/Yangon, personal-ledger accounting and the Prisma schema are unchanged.

Implemented protected `/dashboard`, now the root/sign-in landing page, with account/transaction navigation. Existing shadcn cards, forms, buttons and badges support responsive chart panels and exact summary values. Recharts 3.10.1 is pinned for the donut and monthly bars. Added readable currency/date labels, exact custom tooltips, keyboard-accessible category buttons, category totals, a scrollable exact monthly table, skeleton/pending/error/empty states and recent owned transaction links. The default is the current calendar month; shortcuts cover the last six calendar months and year to date. Custom inclusive ranges are bounded to 120 calendar months.

The public query resolves the persisted authenticated user. A server-only Prisma query groups that owner's date/category-filtered transactions in PostgreSQL and returns text sums; exact bigint folding derives cards, expense categories and zero-filled monthly buckets. Recent records are fetched in the same RepeatableRead snapshot. SQL date parameters are validated calendar strings; authoritative money remains serialized integer strings. Only chart coordinates use approximate numbers. No hardcoded financial data, runtime demo fixtures, shared private cache or group/settlement totals feed these charts.

Clicking a category or its accessible button updates the dashboard URL and filters every card/chart/recent record. The UI explains that an expense-only category has zero income and an expense-only balance, with a clear/reset option. View all preserves dates/category on the transaction list. Create/edit/delete actions now revalidate the dashboard, and transactions/account pages link back to it.

Verification after implementation: typecheck, full ESLint, production build, all 23 unit/PostgreSQL tests and the expanded HTTP lifecycle test pass (24 tests total). New coverage verifies default/leap-month ranges, empty results, zero-filled gaps, category/month reconciliation, inclusive/partial month boundaries, category drill-down, unknown/missing principals, cross-owner isolation and exact sums above JavaScript's safe-integer range. HTTP checks verify anonymous dashboard rejection, persisted amounts/recent records, category filtering, invalid ranges, cross-user isolation and fresh totals after transaction mutations. Existing auth and transaction regression tests continue to pass. Temporary fixtures were cleaned up.

Updated TASKS, REQUIREMENTS, ARCHITECTURE, DECISIONS, STANDARDS, SETUP, README and agent scope. Live hover, keyboard/screen-reader and desktop/360px visual verification remain explicitly manual: browser discovery returned "The browser access host is unavailable". Server-rendered data, filter URLs and accessibility alternatives were exercised without claiming a live chart/browser pass.

Next work requires a separate request: receipt processing (D-04), group/settlement flows, or further UX refinement. No migrations, deployment, credential changes or production sample seeding were performed.

## 2026-11-06 — Transaction-management milestone

Authorized scope: responsive transaction create/view/edit/delete, category/type/date filtering, pagination, shadcn/ui, local samples and validation/authorization tests. Dashboard charts remain excluded. Existing Prisma schema/migrations and MMK/0/Asia/Yangon rules are unchanged.

Implemented protected `/transactions`, `/transactions/new`, `/transactions/[id]` and edit routes, linked from `/app`. Official shadcn/ui Radix/nova components support desktop tables, mobile cards, forms, badges and accessible delete confirmation. Added empty/loading/error/not-found states, validation messages, pending controls and controlled form values. Form retry keys and expected versions stay stable across failed action rerenders. Dates are real YYYY-MM-DD values from 1900 onward, stored at UTC midnight; the form's default date is today in Asia/Yangon. Formatting remains exact for the full supported bigint money range.

Every public query/action derives identity from requireUser; internal server-only store operations validate inputs/principals and constrain financial reads/writes by owner. Matching type/category checks, owner/version predicates, conflict responses and create retry keys protect correctness. Filtered count/rows share a RepeatableRead snapshot, sorted by date/creation/ID with 20 records per page; pagination retains URL filters. Mutations revalidate transaction routes. Auth session reads explicitly wait for a real request to keep Auth.js cryptography outside Cache Components prerendering.

Kept the six basic seeded categories. Added an optional 24-entry local sample seed for an existing account, gated by NODE_ENV=development, ALLOW_DEV_SEED=true, DEV_SEED_EMAIL and a localhost smart_expense_db URL. It uses deterministic owner/submission keys, skips duplicates and never modifies existing entries. It is not part of build/startup/migrations. Tests ran it only for a disposable test account and removed those rows afterward; no production data was seeded.

Verification: TypeScript, full ESLint, production build, 16 unit/PostgreSQL tests and one real HTTP lifecycle test pass. Coverage includes validation, money/date boundaries, CRUD, unauthenticated/cross-owner operations, category matching, retry races, stale edits/deletes, filter boundaries, pagination, sample production refusal/idempotence, and actual create/edit Server Actions plus signed-out/cross-origin rejection. Existing authentication checks still pass. The HTTP harness now supplies matching forwarded-host/protocol headers to simulate the trusted proxy correctly; no origin protection was relaxed.

Updated TASKS, REQUIREMENTS, ARCHITECTURE, DECISIONS, SETUP, README and agent scope. SETUP documents seed commands and transaction verification. Browser automation discovery reported its access host unavailable, so live desktop/360px visual and keyboard checks remain explicitly pending; responsive structure and server-rendered forms were checked by code and HTTP tests. No screenshots or manual browser pass are claimed.

Next work requires a separate request: dashboard aggregation/charts, receipt processing or group/settlement flows. No model migration, deployment, data reset or actual credential disclosure was needed.

## 2026-11-06 — Database and authentication foundation implemented

Current scope: the user authorized database models, migration, email/password authentication and protected routes, explicitly excluding dashboard and receipt features. They confirmed MMK / 0 decimals / Asia/Yangon. D-01–D-03 are recorded for this foundation; receipt-processing decisions remain deferred.

Implemented User, Category, Transaction, Receipt, Group, GroupMember, GroupExpense, ExpenseShare, Settlement and supporting AuthThrottle. Added exact BIGINT/whole-kyat rules, owner/same-group foreign keys, indexed access paths, amount checks and deferred share-total constraints. Generated/applied two additive migrations to the initially empty local database; seeded fixed categories. Prisma CLI/Client/adapter are pinned at 7.10.1. The schema engine's localhost IPv6 failure was isolated: IPv4 succeeds, IPv6 times out. CLI configuration now normalizes only local migration hostnames to IPv4 without altering credentials.

Added Auth.js Credentials/JWT with Argon2id, Zod schemas, generic registration/login errors, database-backed throttling, secure cookie configuration, safe projections, owner-scoped query helpers and repeated persisted-user checks. Public /register and /login and protected /app are implemented; / redirects to /app. Existing Cache Components settings are retained. Added .env.example and a missing local auth secret/origin without displaying secrets; real .env remains ignored. No localStorage auth, dashboard, receipt OCR/image handling, financial feature mutations or group/settlement UI.

Verification: migrations and category seed succeed; migration status is up to date; Prisma validation/client generation, TypeScript, full ESLint and production build pass. Six unit/PostgreSQL tests and one production HTTP lifecycle test pass, covering exact money, password hashing/rejection, concurrent duplicate registration, atomic throttles, ownership isolation, foreign keys, share rollback, protected routing, CSRF, secure/encrypted cookies, callback restrictions, tampered/expired JWTs, logout and deleted users. Tests remove their own uniquely named user/financial fixtures. Cold build initially required elevated network access for the starter's Google Fonts; the subsequent build passed with existing font downloads cached.

Updated requirements, architecture, decisions, standards, tasks and agent instructions; added SETUP.md with commands, official sources and a manual checklist plus a domain glossary. Final source/document secret-value scan found no actual environment secrets, .env is untracked/ignored, and relative documentation links resolve. Manual browser keyboard/mobile and real production TLS/proxy checks remain unchecked, not claimed as performed. JWT logout does not revoke a stolen token immediately; sessions can refresh up to the configured eight-hour lifetime per access. Auth.js is pinned to its documented v5 beta channel.

Next eligible work: a separately requested transaction/dashboard product slice. Receipt processing needs D-04 resolution. No services were provisioned, no production deployment or data reset occurred, and no secrets were staged or committed.

## 2026-11-06 — Password update verified

The user's password update resolved authentication. SELECT 1 returned 1 through the application Prisma singleton using DATABASE_URL and through the direct PostgreSQL connection using DIRECT_URL. Both read-only checks passed; credentials were not displayed or changed by the agent.

The current `prisma.config.ts` had a literal connection URL passed to `env(...)`, causing Prisma validation to fail. Restored `env("DIRECT_URL")`; subsequent Prisma validation and TypeScript checking both pass. The duplicate `prisma7.config.ts` is no longer present. No application models or migrations were created. Local connection verification is complete; broader architecture approval is still pending.

## 2026-11-06 — Connection recheck

Both application-singleton and direct SELECT 1 checks still fail with PostgreSQL 28P01 (password authentication failed). Both connection variables still match the expected local target. No environment values or credentials were displayed or changed.

`prisma7.config.ts` had reappeared with the original invalid environment-key lookup, and this installed CLI selects it ahead of `prisma.config.ts`. Replaced the duplicate configuration with a re-export of the canonical DIRECT_URL configuration, preserving both entry-point paths. Prisma validation and TypeScript checking pass after this correction. No models or migrations were created; credential reconciliation remains the blocker.

## 2026-11-06 — Local Prisma 7 configuration verification

State: the user explicitly authorized local PostgreSQL/Prisma configuration and a server-only client, without application models or migrations. This does not approve the broader pending product architecture.

Verified installed Prisma CLI, Client and PostgreSQL adapter versions are all 7.10.1. Both connection variables match the requested local host, port, database and role; values and credentials were not printed. The PostgreSQL schema and `prisma-client` generator were already correct and remain unchanged, including the ignored `app/generated/prisma` output path.

Renamed `prisma7.config.ts` to auto-discovered `prisma.config.ts`, replacing a connection URL incorrectly used as an environment key with `env("DIRECT_URL")`. Added `lib/prisma.ts` using DATABASE_URL, PrismaPg, a server-only guard, and development global caching. Added only the `server-only` runtime dependency; preserved existing user changes. Generated the model-free client locally; no migrations or application models were created.

Checks: Prisma validation and generation pass; `tsc --noEmit --incremental false` and targeted ESLint checks pass. The development singleton cache was confirmed at runtime. Application SELECT 1 through the singleton reached PostgreSQL but failed with PostgreSQL code 28P01 (password authentication failed). The DIRECT_URL connection independently failed with the same code. Connectivity is not verified as successful. Initial probe-runner module-loading errors were isolated from the database result; the final probe used the actual singleton with the server-only server condition resolved explicitly.

Next action: reconcile the local PostgreSQL role password with both ignored connection variables, then rerun SELECT 1. No credentials or database roles were changed. No application build was run for this scoped configuration task; broader architecture approval remains pending.

## 2026-11-05 — Planning initialized

State: documentation complete; architecture approval pending. No application features implemented.

Inspected root source/configuration, package manifests, existing AGENTS.md, git status, and installed Next.js project-structure, mutation, data-security, and Cache Components authentication guides. Verified the generated Next.js agent-block markers in `node_modules/next/dist/server/lib/generate-agent-files.js`.

Baseline: Next.js/React starter with strict TypeScript, Tailwind v4, ESLint, npm lockfile, root App Router and default landing page. No Prisma schema, PostgreSQL setup, authentication, receipt extraction, financial models, charts, application tests, or feature folders. Required additional libraries are not declared. The working tree was clean before documentation edits. Existing Cache Components/partial-prefetch configuration needs attention during authenticated implementation.

Delivered: root AGENTS.md workflow (preserving the generated block), plus REQUIREMENTS, ARCHITECTURE, STANDARDS, TASKS, PROGRESS and DECISIONS under docs/. Requirements include measurable chart, authentication, receipt review, exact-money and unequal-split acceptance criteria. Architecture proposes schema, routes, ownership, and data flow; tasks sequence a dashboard-first MVP.

Verification: reviewed the seven-file documentation diff and relative Markdown links; confirmed the generated Next.js block is unchanged and no application/configuration/dependency files were modified. No application build, lint or tests were run for this documentation-only task; application readiness has not been established.

Open decisions: D-01 single-app structure/auth foundation; D-02 exact minor units plus one currency and reporting timezone; D-03 owner-managed group labels and separate ledger; D-04 browser OCR with no retained image. Details and alternatives are in DECISIONS.md. These are proposals, not accepted architecture.

Next action: obtain the user's approval/revisions and currency/timezone choices, then record them before starting phase 1. No database was connected, packages installed, secrets generated, services provisioned, or migration executed.

## Future handoff entries

Append date, task/FR IDs, observed changes, checks actually run and their outcomes, blockers/decisions, and the next eligible task. Keep historical evidence concise and update the current state when a phase changes.
