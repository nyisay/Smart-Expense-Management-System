# System audit — 2026-11-08

Follow-up: this audit preserves the original inspected baseline. The subsequent D-05 request authorizes monthly budgets, advanced analytics/filtering and rule-based insights; their implementation and fresh verification are recorded in PROGRESS/TASKS. Original missing-feature classifications for that subset should be read in that historical context. Other release findings remain open.

## Verdict and scope

The core MVP works in the executed local regression tests. It is not yet verified for a production launch. No critical application authorization, SQL injection or monetary-integrity defect was confirmed in the reviewed paths. That is a bounded audit result, not a penetration-test or security certification.

Reviewed repository HEAD `7c8dd5b` plus the existing uncommitted glassmorphism changes. Source inspection covered routes, Server Actions, Auth.js handlers, Prisma models/migrations, financial calculations, receipt processing, UI primitives and tests. Existing application/skill work was preserved. This task adds audit documentation and a handoff only; no features, dependencies, migrations, deployment or push were performed.

Accepted boundaries remain those in [DECISIONS.md](DECISIONS.md): MMK, whole kyat, Asia/Yangon, owner-managed participant labels, separate personal/group ledgers, JWT sessions and temporary local-only receipt processing. Missing wishlist features are not retroactively treated as breaches of previously approved scope. Recommendations require approval; see [ENHANCEMENT_ROADMAP.md](ENHANCEMENT_ROADMAP.md).

## Feature verification matrix

“Implemented and verified” means the stated path passed the tests/probes below in this checkout. It does not imply all devices, deployments, failure modes or data volumes were tested. “Implemented but not verified” means code exists but the relevant live evidence is missing. “Partially implemented” identifies an available subset. “Missing” means no matching product path was found. “Broken” applies to a reproduced failing behavior, not an entire otherwise working feature.

| Feature | Classification | Source and evidence |
| --- | --- | --- |
| Registration, email/password login, logout | Implemented and verified | `auth.ts`, `features/auth/{service,actions,password}.ts`; unit, HTTP lifecycle and real browser registration/login/logout pass. Error-field retention is separately broken below. |
| Protected routes and per-user authorization | Implemented and verified | `features/auth/session.ts`, protected layout, each public query/action; missing/deleted/expired/tampered principals and cross-user/group operations are tested. |
| Persistent income and expenses | Implemented and verified | `prisma/schema.prisma`, `features/transactions/store.ts`; PostgreSQL create/read/update/delete and browser refresh pass. Production backup/restore and cold-host restart are unverified. |
| Transaction CRUD and confirmations | Implemented and verified | `features/transactions/{actions,transaction-form,delete-button}.tsx`/`.ts`, `app/(protected)/transactions/`; stale versions, cancellation, confirmed deletion, repeated creations and retry identity are covered. |
| Type/category/date filtering and pagination | Implemented and verified | `features/transactions/{schemas,filters,store}`; combined inclusive filters, deterministic ordering, page clamping and 20-row pagination pass integration tests. |
| Transaction text search and amount filters | Missing | No search/amount predicate or control in transaction filter schema, form or store. Existing filters must not be described as text search. |
| Categories | Implemented and verified | `prisma/seed.ts` defines two income and four expense categories; selection/type validation and category foreign keys are exercised. User-created categories are absent by design. |
| Business dates and currency formatting | Implemented and verified | `lib/{dates,money}.ts`; valid/leap dates, inclusive boundaries, whole MMK and sums above JS safe integers are tested. |
| Income, expense and balance summaries | Implemented and verified | `features/dashboard/{store,aggregate,view}`; exact selected income minus selected expense reconciles with PostgreSQL and browser mutations. This is not a bank/opening balance. |
| Interactive category donut/drill-down | Implemented and verified | `features/dashboard/charts.tsx`; actual slice clicks, tooltip hover, keyboard category controls and filtered totals pass desktop/mobile tests. |
| Monthly spending trend and exact table | Implemented and verified | Same chart module and server aggregation; zero-filled monthly buckets, partial ranges and accessible exact values are covered. Only expense series exists. |
| Custom date ranges and category filters | Implemented and verified | `features/dashboard/filters.ts`, dashboard view/store; current month, six months, year-to-date and inclusive custom ranges up to 120 calendar months exist. These are not future enhancements. |
| Income-versus-expense chart, weekly/YoY views | Missing | No comparison series, weekly toggle or previous-year view in current aggregate DTO/chart UI. |
| Receipt format checks and editable confirmation | Implemented and verified | `features/receipts/{image,schemas,actions,service,upload-form}`; format/size/decode/privacy guards, uncertainty, failed replacement retention and explicit save/dashboard update pass mock-backed tests. |
| Real local OCR/vision extraction | Implemented but not verified in this audit | `features/receipts/provider.ts` implements local Ollama structured output. Current loopback probe returned `ECONNREFUSED`; no current real-inference benchmark ran. Prior two-synthetic-case results in MVP_REVIEW are historical, not representative accuracy evidence. |
| Unequal amount/percentage splits and bill editing | Implemented and verified | `features/groups/{calculations,schemas,store,forms}`; zero shares, deterministic remainder allocation, invalid sums, multiple bills and version conflicts pass. |
| Group balances, repayment suggestions and history | Implemented and verified | `features/groups/{calculations,view,store}`; partial/full/overpayments, recorded history, refresh and separation from personal dashboard pass. |
| Settlement correction, invitations/shared account access | Missing, intentionally deferred | Repayments are append-only; participants are owner-managed names. There is no invitation/login privilege for a guest and no payment execution. |
| Responsive design and core navigation | Implemented and verified within tested sizes | `components/ui/`, feature views, `app/globals.css`; Chromium 1366×900/360×800, keyboard paths, no horizontal overflow and axe checkpoints pass. Physical phones, Firefox/WebKit and screen readers remain unverified. |
| Light/dark theme | Partially implemented | Both palettes and forced-colors/reduced-transparency/motion styles are verified through test-driven class/media changes. No user-facing theme selector/system-preference persistence exists. |
| Registration error retention | Broken | A whitespace-only name passes browser `required`, then server rejects it. A fresh browser probe confirmed name/email/password inputs reset to empty. Core registration still succeeds with valid input. |
| Budgets, recurring entries, goals, CSV import/export, anomaly analysis | Missing | No models/actions/routes for these features were found. They remain proposals, not MVP completion claims. |

## Confirmed findings

### A-01 — Registration errors erase non-sensitive input — P2

`features/auth/auth-form.tsx:14` uses `useActionState` with uncontrolled inputs at lines 43–59. Reproduction: open `/register`, enter a whitespace-only name with a valid synthetic email/password, submit, and observe the server validation message. The browser probe reported `nameCleared`, `emailCleared` and `passwordCleared` all true. No account was created because validation fails first.

Preserve name/email after errors and identify the invalid field. Password clearing should be an explicit policy; never persist credentials to browser storage or logs. Add a regression to `tests/e2e/mvp.spec.ts`. See R05.

### A-02 — Application response security policies are absent — P1 release gate

The production-built isolated HTTPS `/register` response did not contain CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS or X-Content-Type-Options. `next.config.ts` has no header policy and no middleware/proxy file supplies one. This confirms an application-level hardening gap; it does not prove a production proxy will omit them, or establish an exploitable XSS vulnerability.

Agree on frame protection, nosniff/referrer policy and a compatible CSP; verify the eventual public edge as well as the app. Apply HSTS only on the intended production HTTPS origin. Do not introduce nonce rendering changes or break Cache Components without evaluating the tradeoff. `auth.ts:13` also sets `trustHost: true`; forwarded headers must come through a trusted, sanitizing proxy, consistent with [Auth.js deployment guidance](https://authjs.dev/getting-started/deployment). See R02.

### A-03 — Database-test target protection is inconsistent — P1

`tests/e2e/database.ts` rejects remote/non-test database targets. The browser runner and optional receipt benchmark use it. The PostgreSQL suites (`tests/auth.test.ts`, `transactions.test.ts`, `dashboard.test.ts`, `receipts.test.ts`, `groups.test.ts`) and `tests/http/auth.test.ts` instead import Prisma and create fixtures without that target gate. `tests/environment.test.ts` tests the guard but does not install it in other test processes.

Those suites would attempt writes against whichever DATABASE_URL they receive if credentials permit. This is a confirmed harness safety gap from source inspection; no remote/production write was attempted. The audit used the existing local database. Reuse one test-target gate before database access; keep exact-fixture teardown. See R01.

### A-04 — Setup boundaries contradict the implemented app — P2

`docs/SETUP.md:199` says receipt OCR and group/settlement workflows are absent. Actual receipt/group code and the same guide's earlier sections show they exist. The distinction must be temporary extraction versus retained images, and owner-managed groups versus collaboration. Manual checkboxes and older handoffs also need clear dates/evidence labels. No historical architectural decision should be silently rewritten. See R06.

### A-05 — Development dependency advisories remain — P2

Fresh runtime audit reports zero advisories. Full audit reports 13 development-only advisories: two low and eleven moderate, with no high/critical. The direct advisory sources are [deepmerge prototype poisoning](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) and [minimatch denial of service](https://github.com/advisories/GHSA-g3hv-75wg-m249), propagated through tool dependencies. Counts describe npm's affected dependency entries, not thirteen independent CVEs.

npm's proposed fixes cross major versions (`shadcn` 1.0.0 / `eslint-config-next` 15.5.29), so no forced fix/downgrade was applied. This is not evidence of a vulnerable production request path. See R07.

## Functional, security and integrity review

| Area | Verified source behavior | Remaining limits/risk |
| --- | --- | --- |
| Passwords/sessions | Argon2id: 19,456 KiB, time cost 2, parallelism 1; dummy verification for absent users. Eight-hour Auth.js JWT session, HttpOnly/SameSite=Lax cookie, Secure and `__Secure-` naming on HTTPS. No token browser-storage use found. | Logout does not immediately revoke a stolen JWT; password recovery, verification and session management are absent, as accepted in D-01. Auth.js beta remains deliberately pinned. |
| Authorization/IDOR | Public actions/queries resolve `requireUser`; stores verify persisted principal and owner predicates. Group writes lock the owned group and validate every referenced member. `lib/owned-data.ts` also scopes its foundational reads. | No bypass confirmed in tested operations. This does not replace testing a future API, proxy configuration or new entry point. Do not trust a submitted owner ID. |
| Validation/SQL injection | Server Zod schemas bound identifiers, money, dates, text and confirmations. Prisma query builders and tagged/`Prisma.sql` raw queries bind parameters; no unsafe raw API or HTML injection sink was found in application source. | Browser HTML validation is only a subset: whitespace names/leading-zero money can pass the browser and fail safely on server. Improve feedback rather than relaxing server rules. |
| Database consistency | Composite owner/member/group/category keys, restrictive deletes, unique retry keys, positive ranges/versions and deferred share-total triggers exist in the two SQL migrations. Applied status and integrity tests pass. | Migration status alone does not prove absence of all schema drift. New installations need the SQL integrity migration, generated client and category seed. No destructive reset was run. |
| Money/rounding | PostgreSQL BIGINT, bigint calculations and string serialization; positive entries capped at 9,000,000,000,000,000 whole kyat. Percentage basis points plus deterministic largest remainders preserve totals. SQL SUM casts to text. | Chart coordinates intentionally use approximate numbers; exact labels/tables remain authoritative. No currency conversion, fractional kyat or opening balance. |
| Dates | PostgreSQL DATE, validated YYYY-MM-DD, UTC conversion for date-only storage and Asia/Yangon reporting defaults. Inclusive owner-scoped bounds and zero months tested. | Weekly boundaries, comparison alignment and recurrence dates need explicit definitions before adding them. Actual multi-timezone browser and cold restart exercises remain unperformed. |
| Duplicates/accounting | Repeated identical submission keys return the existing transaction/bill/repayment; changed payloads conflict. Edits are versioned and dependent shares are atomic. Group entries never create personal transactions. | A separately entered duplicate or a second receipt review has a new key and may create another expense. Idempotency is not semantic receipt deduplication. |
| Group settlements | Net = paid − owed + sent − received; net sums zero. Bill corrections retain repayments. Suggestions are read-only and reconcile balances. | Suggestions do not guarantee globally minimal transfer count. No settlement correction, shared editing or transfer execution. Histories/groups load without pagination. |
| Upload/privacy | MIME/signature/Sharp decoding, 10 MiB/20MP/static-image limits, orientation, metadata stripping and bounded resize. Local-only provider, no redirects, 120-second deadline, 64 KiB output and Zod validation. No pixels/raw OCR persist. | Host logs/dumps, concurrent decoding/inference resource use, actual model cancellation and representative language/photo accuracy need operational testing. Model prompts do not guarantee correctness. |
| Abuse limits | Database-backed fixed-window per-action limits: five per normalized login/registration email or receipt user, 500 globally per action per 15 minutes. Auth.js CSRF and Server Action origin protections are exercised. | No IP/edge request-size/concurrency policy is configured in this repo. Valid-request bursts or deliberate global-limit exhaustion require a staging threat/load assessment; no DoS was executed. |
| States/feedback | Skeletons, empty/invalid filter states, generic errors, pending/confirmation states, not-found handling and controlled financial forms exist. Receipt errors retain corrected fields. | Registration reset is reproduced. Group errors are centralized; linked error focus/descriptions and screen-reader behavior need improvement/manual testing. |

The per-request authorization pattern matches [OWASP's authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). Server-only feature boundaries and minimal serialized results also align with [Next.js data-security guidance](https://nextjs.org/docs/app/guides/data-security). No authorization checks should be removed to reduce query counts.

## Visualization and UX assessment

- Summary cards, category donut, expense bars and recent entries use the same owner/date/category predicate and RepeatableRead snapshot. Expense categories and monthly totals reconcile. Selecting an expense category intentionally sets matching income to zero and changes the selected balance; UI explains this accepted rule.
- Four seeded expense categories suit the current donut; no new “Other” grouping or chart library is needed. Stable category colors, actual-value tooltips and text/table alternatives exist. A monthly table supports long ranges that become dense in a small chart.
- Income-versus-expense comparison is the strongest next chart: SQL already returns both types, but the aggregation currently discards monthly income buckets. Extend the existing pipeline after approval; keep a single predicate/snapshot. Savings-rate/previous-period insights come next, with zero-income and partial-period rules.
- Category drill-down and custom ranges already exist. Improve their discoverability and retain list filters/page when returning from details; current detail back links target bare `/transactions`. Weekly, merchant and YoY views are conditional additions, not requirements for the current dashboard to function.
- Desktop/mobile screenshots were inspected again: dashboard hierarchy, totals, legends, forms and group repayment balances are readable without page overflow. Mobile dashboard is long; prioritize compact preset controls or collapsible filters while keeping summaries/charts discoverable. Keep data above decorative effects.
- Dashboard navigation exists, but other feature pages mainly offer local back links. A consistent small navigation/active-location treatment, a safe skip-to-content path, and contextual return links would reduce backtracking. Do not build a navigation framework.
- Form labels, focus styling, larger coarse-pointer controls, explicit destructive confirmations, live feedback and reduced-motion/transparency/forced-colors styles exist. Dark styles are testable but not user-selectable. Manual screen-reader, zoom, real phone and Firefox/WebKit assessment remains open; axe is not a WCAG certification.

These opportunities map to R08–R18/R27 in the roadmap. No chart, navigation or form behavior was changed during this audit.

## Performance and configuration

Transaction reads use 20-row offset pagination, deterministic sorting and owner/date/category indexes. COUNT and rows share a snapshot. Dashboard performs SQL grouping rather than transferring the complete ledger; month output is bounded to 120 and recent transactions to eight. Group detail and group list remain unbounded; even member/repayment forms call the full `getGroup` loader. These are confirmed implementation limits, not measured production slowdowns.

Build inspection deduplicated client-reference-manifest chunk paths and gzip-compressed their files locally:

| Route | Referenced chunks | Raw KiB | Gzip KiB |
| --- | --- | --- | --- |
| Login | 3 | 66 | 24 |
| Dashboard | 6 | 540 | 160 |
| Transactions | 4 | 66 | 24 |
| Receipt upload | 4 | 73 | 26 |
| Groups | 4 | 62 | 23 |

These are manifest-referenced subsets, not total initial network transfer: bootstrap/runtime, HTML/RSC, fonts, caching and negotiated compression differ. Total emitted static JavaScript is about 1,239 KiB across 26 files for the entire build. No Lighthouse/Web Vitals, throttled device profile, load test or production query plan was measured. Recharts is client-rendered on the dashboard; do not add memoization, virtualization, indexes or lazy-loading machinery without a measured bottleneck (R18).

Prisma 7.10.1 CLI/client/adapter match. Runtime uses DATABASE_URL; migrations use DIRECT_URL with the existing local IPv4 normalization. Next 16.4.5 Cache Components, React 19.3.0 and Auth.js 5.0.0-beta.32 remain unchanged. `.env` is ignored and only `.env.example` is tracked; scans found no client-exposed secret variable or receipt logging path. Actual variable values were not printed. The runtime PostgreSQL role is not superuser, CREATE ROLE, CREATE DATABASE or BYPASSRLS, but does have public-schema CREATE. Production must review separate runtime/migration privileges.

Clean-host installation/client generation, production TLS/forwarded-header handling, secret rotation, connection pooling/concurrency, host availability and backup/restore remain release gates. Cold builds still depend on Google Fonts access. A local Ollama service on the deployment host is required under D-04; a laptop's loopback endpoint is not reachable from a separate hosted application.

## Commands and observed results

Commands used `npm.cmd` in Windows PowerShell. No skipped or historical test is counted as a pass here.

| Command/check | Current result |
| --- | --- |
| `npm.cmd run typecheck` | Pass, exit 0 |
| `npm.cmd run lint` | Pass, exit 0 |
| `npm.cmd test` | Pass: 40 Node unit/PostgreSQL cases, zero skips/failures |
| `npm.cmd run build` | Pass: production build, 20 generated page entries; build also checks TypeScript |
| `npm.cmd run test:http` | Pass: one production HTTP lifecycle case, zero skips/failures |
| `npm.cmd run test:e2e` | Pass: ten Chromium cases, five flows at desktop and 360px, zero skips/failures |
| `npm.cmd exec -- prisma validate` | Pass |
| `npm.cmd exec -- prisma migrate status` | Two migrations applied; up to date |
| `npm.cmd audit --omit=dev --json` | Exit 0; zero runtime advisories |
| `npm.cmd audit --json` | Exit 1; 13 development advisories (2 low, 11 moderate) |
| Targeted isolated browser diagnostic | Registration input reset reproduced; six response security policy headers absent on `/register` |
| Read-only database role probe | Privilege flags above verified without role/credential disclosure |
| `GET http://127.0.0.1:11434/api/version` | Blocked for real extraction: `ECONNREFUSED` |
| `npm.cmd run test:receipt:local` | Not run: local provider unavailable; no accuracy pass claimed |

Total executed regression cases: **51** (40 unit/database + one HTTP + ten browser). Most “unit” files also use real PostgreSQL; they are not database-independent pure-unit suites. Browser/HTTP receipt calls use synthetic fixtures and mock Ollama, with no paid API. The isolated browser uses ephemeral HTTPS/auth secrets, not personal browser tabs. No new automated tests were added: this task identifies missing coverage instead of implementing changes.

## Tests still needed

1. `tests/e2e/mvp.spec.ts`: failing registration/login preserves email/name; error focus/descriptions are useful; no credential storage/logging. First case must reproduce A-01 before its fix.
2. Shared test-entry safety tests: every database-writing suite refuses remote/production targets before connecting or writing; valid local fixture runs still pass. The existing guard test alone does not establish that integration (A-03).
3. Security policy integration/browser cases: actual public headers, embedding/frame refusal, hostile forwarded-host/protocol handling behind the chosen proxy, cookie flags and CSP compatibility with hydration/charts/uploads.
4. Browser pagination/date edges: 21+ records, page/filter changes, inclusive boundaries in multiple browser timezones and return-to-filtered-list context. Database pagination/date tests already exist; browser coverage is narrower.
5. Staging error/load exercises: database outage/recovery, concurrent upload decode/inference, actual timeout/cancellation, expired session during a dirty form and cookie refresh near expiry. Do not load-test a shared production database.
6. Group UI edge cases: multiple payers across several bills, overpayment, bill deletion retaining repayments, stale edits in two tabs and the 50-member boundary. Existing pure/database/HTTP tests cover many of these; they are not all browser scenarios.
7. Representative receipt corpus, intended languages and poor images with explicit field accuracy/uncertainty, latency and memory observations; manual screen-reader/cross-browser/physical-device/zoom checks; clean-host migration/restore rehearsal.
8. For each approved enhancement, add only its meaningful ownership, exact-money/date/filter and UI acceptance regressions listed in the roadmap. Do not create tests for features not approved for implementation.

## Decision and next task

No P0 defect was confirmed. Address P1 test-target safety and release verification before a deployment approval. Suggested next bounded code task is **R01: reuse the existing database-target guard across all database-writing test suites**. It needs no new dependency or product architecture change. First visualization enhancement after release gates is R10, monthly income-versus-expense comparison. Both remain proposals; work stops here awaiting approval.
