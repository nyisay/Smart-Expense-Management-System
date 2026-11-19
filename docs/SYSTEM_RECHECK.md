# System recheck — 12 November 2026

## Scope

Rechecked the current repository's routes, user-facing labels, forms, rules and available automated suites to prepare [USER_GUIDE.md](USER_GUIDE.md). Verification uses a local production build, disposable PostgreSQL, synthetic accounts/records and mocked receipt-provider responses. The deployed website and real OCR accuracy are outside this run's verification scope. No feature or production data changes are part of this task.

## Executed checks

| Command | Observed outcome |
| --- | --- |
| `npm.cmd run build` | Passed; production build completed. |
| `npm.cmd run typecheck` | Passed. |
| `npm.cmd run lint` | Passed. |
| `npm.cmd test` | Passed: 77 unit/PostgreSQL tests. |
| `npm.cmd run test:http` | Passed: one authenticated HTTP lifecycle. |
| `npm.cmd run test:e2e -- --max-failures=1` | Passed: all 52 desktop/360px Chromium cases, 9.3 minutes. |

No failures were reported in these executed checks. All database writes targeted disposable loopback PostgreSQL on port 55438. Final User count was zero; verified isolated test processes and the disposable database were stopped after Playwright exited 0. No production account, financial record, provider inference, migration or deployment was changed. Application code was not modified during this documentation/recheck task.

## Feature evidence

| Feature | Implementation inspected | Verification coverage |
| --- | --- | --- |
| Registration, login and logout | `features/auth/actions.ts`, `service.ts`, `auth-form.tsx`; `auth.ts` | Registration redirect/303 with and without JavaScript, generic duplicate outcomes, password hashing, session cookies, native/server validation, logout and protection. |
| Personal transactions | `features/transactions/`; transaction routes | PostgreSQL CRUD, exact money, type/category/date/text/amount filters, pagination, retry/stale-version behavior and two-user isolation. |
| Dashboard and Analytics | `features/dashboard/`, `features/analytics/` | Aggregation, zero-filled months, selected-boundary dates, category drill-down, Line/Bar switching, exact tables, net/cumulative modes, comparisons and insights. |
| Monthly budgets | `features/budgets/` | Full-month personal totals, positive exact limits, no rollover, unbudgeted state, progress/thresholds, revision checks and isolation. |
| Receipt upload/review | `features/receipts/` | Image and provider-output validation, drag/drop, preview, uncertain fields, API failures, correction/confirmation and saved expenses reaching reports. Extraction responses are mocked. |
| Group splitting | `features/groups/` | Owner-managed participants, exact/percentage allocation, remainder handling, multiple/editable bills, net balances, repayments, history deletion and authorization. |
| Account settings | `features/account/` | Name changes, private validated thumbnail upload/removal, concurrent/stale changes, password changes and rejection of all old sessions. |
| Navigation and accessibility | Shared shell, date/Select primitives, dialogs, semantic styles | Desktop/360px navigation, focus/keyboard, overlays, reduced motion/transparency, forced colors, empty/error states, axe checks and screenshot cases. Automated checks complement manual review. |

## Remaining limits and follow-up

1. **Production receipt extraction remains unverified.** Mocked tests do not prove the configured hosted model/key/limits or real-receipt accuracy. The existing production investigation still needs runtime evidence.
2. **Navigation performance remains open.** Earlier read-only measurements showed remote Neon round-trip cost and duplicate/serial read opportunities. This recheck introduces no caching or performance fix; D-12 is still a proposal awaiting approval.
3. **Deployment/schema parity is not confirmed.** Current code includes the previously documented account-session and profile-thumbnail migrations. Apply required migrations to the intended database before serving the matching release; this task performs no hosted migration or deployment.
4. **Manual/device coverage is limited.** Other browsers, physical touch/drag gestures, manual assistive-technology testing and authenticated production flows are not certified by these Chromium tests.
5. **MVP boundaries remain.** No bank synchronization, money transfer, currency conversion, recurring transactions, CSV import/export, password recovery, email/account deletion or guest invitations. Individual repayment editing/deletion is unavailable. See [DECISIONS.md](DECISIONS.md) for accepted scope and [TASKS.md](TASKS.md) for open work.

## User documentation

The user guide covers registration through logout, every navigation page, money/date rules, meaningful chart definitions, receipt/provider privacy, independent monthly budgets, group examples, account/photo/password workflows, keyboard controls and troubleshooting. Instructions are based on implemented controls rather than planned enhancements. Owner installation/configuration stays in [SETUP.md](SETUP.md).
