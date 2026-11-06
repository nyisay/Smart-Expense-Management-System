# Implementation tasks

Status legend: `[x]` complete, `[ ]` pending. Foundation, transactions and dashboard are implemented. Local Ollama receipt extraction/review was approved on 2026-11-07 (D-04). FR references resolve to [REQUIREMENTS.md](REQUIREMENTS.md).

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
- [ ] Complete manual desktop/360px visual and keyboard checks from SETUP.md. Browser automation host was unavailable during implementation; structural responsive UI and HTTP rendering checks are covered.
- [x] Implement authenticated PostgreSQL grouping and exact server-side totals for cards, category donut and zero-filled monthly trends, as requested in the dashboard milestone.
- [x] Build responsive Recharts/shadcn UI, keyboard-accessible category controls, exact-value tables/tooltips, shared date/category filters, shortcuts, recent transactions, and loading/empty/error states. Runtime values come from PostgreSQL, not fixtures.
- [x] Verify aggregation, empty datasets, date boundaries, category reconciliation, precision and ownership with unit/PostgreSQL tests; extend HTTP checks for dashboard security and post-mutation refresh.
- [ ] Complete live donut clicks, hover/tooltips, keyboard navigation and desktop/360px chart layout checks from SETUP.md. The browser access host was unavailable; these are not claimed as passed.

Exit: FR-02 and FR-03 pass, including exact reconciliation, date boundaries, edit/delete refresh, restart persistence, responsive inspection and two-user chart isolation. Applicable automated checks and production build pass.

Transaction and dashboard milestones: implementation and automated checks are complete. Manual browser visual/interaction checks remain explicitly pending. Receipt and group/settlement work require a separate request.

## Phase 3 — Receipt review

Depends on phase 2 and D-04 approval. D-04 is now accepted; server-side local Ollama supersedes browser OCR.

- [x] Record the user's local Ollama approval and document temporary server upload, no retention, exact MMK and explicit review boundaries.
- [x] Implement authenticated image validation/decoding, bounded local JSON-schema extraction with a replaceable provider seam, null/uncertainty handling and an editable review with explicit confirmation using the existing transaction creation path.
- [x] Verify validation, mocked provider failures/ambiguity, no save before confirmation, corrected values, ownership, retry safety and dashboard refresh with unit/PostgreSQL/HTTP tests; pass typecheck/lint/build.
- [ ] Benchmark non-sensitive real printed receipts, recording correctness, runtime/model, language, latency and resource use. Local Ollama is unavailable in the implementation environment; no real OCR quality claim is made.
- [ ] Complete manual desktop/360px, keyboard, errors and review-state preservation checks in SETUP.md.

Exit: FR-04 automated criteria pass; explicit confirmation is the sole save step; no paid AI credentials or remote image processing is required. Real recognition and browser checks remain open until observed.

## Phase 4 — Unequal bill groups

Depends on phase 2 and D-03 approval; may follow phase 3 for a simple sequential workflow.

- [ ] Implement owner-managed groups/member labels, bill forms, exact explicit shares, atomic writes and optimistic edit conflicts.
- [ ] Show bill history and paid/owed/net balances; support bill correction/deletion while preserving membership history.
- [ ] Test same-group constraints, mismatched share totals, zero shares, retries, rollback, concurrent updates and cross-owner access.

Exit: FR-05 passes; net balances sum to zero, the 20/30/50 example passes, and personal chart totals remain unaffected by group bills.

## Phase 5 — MVP verification and handoff

Depends on phases 1–4.

- [ ] Run the cross-feature acceptance path against real PostgreSQL; check accessibility, narrow-screen charts, validation and error recovery.
- [ ] Record lint, typecheck, tests and production-build results; document startup, migrations, configuration, backup/restore responsibilities and known limitations.
- [ ] Confirm deployment/runtime compatibility and production security settings before any separately authorized launch. Do not provision hosting or publish as part of planning.

Exit: every MVP acceptance criterion has evidence, unresolved blockers are explicit, and the user receives a reviewable MVP. Deployment remains separately authorized.
