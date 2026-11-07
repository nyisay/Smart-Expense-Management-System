# Implementation tasks

Status legend: `[x]` complete, `[ ]` pending. Core MVP regression checks now include isolated Playwright at desktop/360px. Manual assistive-technology, representative real-receipt and production release checks remain open. See [MVP_REVIEW.md](MVP_REVIEW.md) for evidence and prioritized issues; FR references resolve to [REQUIREMENTS.md](REQUIREMENTS.md).

## Scoped setup — Authorized 2026-11-06

- [x] Verify installed Prisma 7 dependencies, PostgreSQL datasource, Prisma 7 generator and expected local connection settings without disclosing values.
- [x] Correct auto-discovered `prisma.config.ts` to use DIRECT_URL and add the server-only PrismaPg client singleton using DATABASE_URL.
- [x] Generate the model-free client; pass Prisma validation, TypeScript checking and targeted lint.
- [x] Verify successful SELECT 1 for application and direct connections. Both returned 1 after the user's password update on 2026-11-06. The initial model-free restriction was superseded by the subsequent foundation request.

## Phase 0 — Inspect and plan

- [x] Inspect existing source, dependencies, configuration, git state, and relevant installed Next.js guides.
- [x] Create the root agent workflow and six planning documents; preserve generated Next.js rules.
- [x] Record foundation authorization, revised model list, and confirmed MMK/0/Asia/Yangon in DECISIONS.md. D-04 is deferred until receipt feature work.

Exit: foundation scope is recorded and authorized. The separate phase 3 provider approval is now recorded in D-04.

## Phase 1 — Foundation and secure authentication

Depends on phase 0.

- [x] Verify compatible foundation dependencies from official docs, pin Prisma 7.10.1 packages together and lock auth/password/Zod dependencies.
- [x] Configure local PostgreSQL, server environment validation and secret-free setup instructions; add the nine requested domain models plus AuthThrottle, two reviewed/applied migrations and idempotent category seed.
- [x] Add focused test tooling/typecheck, exact MMK helpers and documented bounds, field lengths and eight-hour JWT session lifetime.
- [x] Implement registration, Argon2id, Credentials/JWT login/logout, shared throttling, owner checks, protected rendering, and CSRF/origin protections.
- [x] Add minimal public auth forms, protected account-ready shell, logout, errors and Suspense loading. Dashboard navigation/shadcn/ui styling remains phase 2 work.

Exit: FR-01 passes against PostgreSQL; migration/seed works on an empty development database; no secrets are committed; lint/typecheck/auth tests/build pass. Demonstrate two-user isolation and verify Auth.js plus Cache Components integration before expanding features.

## Phase 2 — Transactions and visualization (first product slice)

Depends on phase 1. Prioritize the end-to-end dashboard before OCR or groups.

- [x] Implement exact whole-kyat money helpers and boundary tests; timezone/currency constants are fixed.
- [x] Add calendar-date helpers and authorized income/expense create/view/edit/delete, type/category/date filters, inclusive date ranges, category checks, retry-safe creation and version conflict handling.
- [x] Build shadcn/ui transaction list/detail/form pages, mobile cards/desktop table, 20-record pagination, delete confirmation, validation feedback, and empty/loading/error/not-found states.
- [x] Keep the basic category seed and add an opt-in, idempotent 24-transaction sample seed restricted to development and the local database; reject production and remote targets before writes.
- [x] Add validation/PostgreSQL tests for transaction operations, unauthorized access, retries, conflicts, pagination and seed safety; extend real HTTP checks through create/edit actions and cross-user/cross-origin rejection.
- [x] Verify transaction desktop/360px layout, forms and confirmations through Playwright, axe and screenshot inspection. Manual assistive-technology assessment remains phase 5 work.
- [x] Implement authenticated PostgreSQL grouping and exact server-side totals for cards, category donut and zero-filled monthly trends, as requested in the dashboard milestone.
- [x] Build responsive Recharts/shadcn UI, keyboard-accessible category controls, exact-value tables/tooltips, shared date/category filters, shortcuts, recent transactions, and loading/empty/error states. Runtime values come from PostgreSQL, not fixtures.
- [x] Verify aggregation, empty datasets, date boundaries, category reconciliation, precision and ownership with unit/PostgreSQL tests; extend HTTP checks for dashboard security and post-mutation refresh.
- [x] Verify real donut clicks/hover, keyboard category toggles, shared date filters and desktop/360px chart layout with isolated Playwright; fix lost focus and tooltip stacking. Native capture itself remains unfixed.

Exit: FR-02 and FR-03 pass, including exact reconciliation, date boundaries, edit/delete refresh, restart persistence, responsive inspection and two-user chart isolation. Applicable automated checks and production build pass.

Transaction/dashboard core browser flows pass isolated Chromium checks. Receipt and group work are also implemented; remaining manual and release verification is tracked below.

## Phase 3 — Receipt review

Depends on phase 2 and D-04 approval. D-04 is now accepted; server-side local Ollama supersedes browser OCR.

- [x] Record the user's local Ollama approval and document temporary server upload, no retention, exact MMK and explicit review boundaries.
- [x] Implement authenticated image validation/decoding, bounded local JSON-schema extraction with a replaceable provider seam, null/uncertainty handling and an editable review with explicit confirmation using the existing transaction creation path.
- [x] Verify validation, mocked provider failures/ambiguity, no save before confirmation, corrected values, ownership, retry safety and dashboard refresh with unit/PostgreSQL/HTTP tests; pass typecheck/lint/build.
- [ ] Benchmark representative non-sensitive real receipts, intended languages and resource use. Local Ollama is now available; two generated English receipts pass five field checks each (46.5/29.3 seconds), which does not close this representative-data gate.
- [x] Verify desktop/360px receipt upload, uncertainty, mocked failures, confirmation and preservation of corrected fields using Playwright/axe and screenshot inspection. Full manual assistive-technology coverage remains pending.

Exit: FR-04 automated criteria pass; explicit confirmation is the sole save step; no paid AI credentials or remote image processing is required. Real recognition and browser checks remain open until observed.

## Phase 4 — Unequal bill groups

Depends on phase 2 and D-03 approval; may follow phase 3 for a simple sequential workflow.

- [x] Implement owner-managed groups, one self label, named participants/guests, bill forms and exact amount/percentage shares with deterministic largest-remainder rounding. Keep MMK and existing schema.
- [x] Show bill/share and repayment histories, paid/owed/sent/received/net balances and deterministic "who owes whom" suggestions; support atomic versioned bill correction/deletion while preserving history.
- [x] Record explicitly confirmed external repayments with retry-payload checks; keep all group records separate from personal transactions/dashboard totals.
- [x] Test exact/percentage/zero/invalid splits, rounding, multiple expenses, repayments/overpayments, limits, retry races, stale edits, same-group and owner authorization, and dashboard isolation with unit/PostgreSQL and real HTTP form/Flight checks.
- [x] Verify core group desktop/360px UI, percentage preview, invalid-total correction, consecutive guest creation, repayments and refresh using the subsequently requested isolated Playwright runner. This is actual browser evidence rather than HTTP alone; the previous native capture mismatch is not claimed fixed.

Exit: FR-05 core automated/browser acceptance passes; exact totals, rounding and repayments reconcile and personal chart totals are unaffected. Manual assistive-technology and broad device/browser assessment remain phase 5 work.

## Phase 5 — MVP verification and handoff

Depends on phases 1–4.

- [x] Run local cross-feature acceptance against PostgreSQL: 40 Node tests, one HTTP lifecycle and eight Playwright cases, with WCAG scans, narrow-screen charts, validation and error recovery.
- [x] Record lint/typecheck/build, schema/migration checks, runtime/development audit results and the two-case local-model benchmark in MVP_REVIEW/PROGRESS; document setup and known limits.
- [ ] Complete manual screen-reader/inclusive-user checks, representative real receipts, physical phones and Firefox/WebKit assessment. Automated scans do not certify WCAG conformance.
- [ ] Confirm deployment/runtime compatibility and production security settings before any separately authorized launch. Do not provision hosting or publish as part of planning.

Exit: every MVP acceptance criterion has evidence, unresolved blockers are explicit, and the user receives a reviewable MVP. Deployment remains separately authorized.
