# Feature gaps — 2026-11-08

Follow-up: D-05 subsequently authorizes monthly budgets, advanced cash-flow analytics, merchant/note and exact-amount filters, and rule-based insights. TASKS/PROGRESS track their current implementation and verification. The remaining inventory below preserves the original audit baseline and its separate approval gates.

This inventory distinguishes failed behavior, release verification gaps and optional product scope. It is based on the inspected source and fresh tests in [SYSTEM_AUDIT.md](SYSTEM_AUDIT.md), not documentation claims alone. Every recommendation ID resolves to the value, complexity, dependencies, acceptance criteria and risks in [ENHANCEMENT_ROADMAP.md](ENHANCEMENT_ROADMAP.md). Items outside the explicitly approved D-05 subset remain proposals.

## Existing features that should not be rebuilt

- Secure registration/login/logout and protected, owner-scoped server operations.
- Persistent income/expense CRUD, type/category/date filters, fixed categories and 20-row pagination.
- Exact MMK summaries, interactive category drill-down, monthly expense trends and custom date ranges.
- Temporary receipt validation, local vision adapter, editable corrections and explicit expense confirmation; mocked end-to-end flow is verified.
- Unequal amount/percentage group allocations, bill editing/deletion, net balances, repayment suggestions and recorded settlement history.
- Glassmorphism components, responsive layouts, light/dark palettes and reduced-motion/transparency/forced-colors support.

The entire live receipt feature should not be called broken because Ollama is stopped. Its current real-provider verification is blocked by `ECONNREFUSED`. Likewise, existing dark CSS is not a user-facing theme selector, and request idempotency is not duplicate-receipt detection.

## Missing or incomplete release requirements

| Gap | Evidence/current state | Priority and action |
| --- | --- | --- |
| Guard every database-writing test entry point | Playwright/benchmark guard exists; Node/PostgreSQL and HTTP suites create fixtures without the same target check. | P1 R01; prevent accidental remote/production fixture writes. |
| Public response/proxy security policy | Six relevant security headers absent on isolated production-built registration response. Production edge policy not configured/verified here. | P1 R02; define/test policies at app and intended edge. |
| Production persistence/recovery verification | Local migration status and role probe pass; runtime role retains schema CREATE. No clean-host install, real TLS/secret/proxy or backup/restore rehearsal. | P1 R03; operational release gate, not an extra dashboard feature. |
| Available and representative local receipt extraction | Adapter exists; live Ollama loopback connection refused during this audit. Prior two clean synthetic examples do not establish real-photo/language accuracy. | P1 R04 before advertising reliable live extraction; keep explicit review/manual fallback. |
| Manual accessibility/device verification | Ten Chromium cases and axe checkpoints pass; real screen readers, physical devices, zoom and Firefox/WebKit remain untested. | P1 R04 for release assessment; fix only observed failures. |
| Registration error retention | Whitespace-name rejection clears name/email/password in real browser probe. | P2 R05; retain non-sensitive input and identify invalid fields. |
| Truthful setup status | SETUP's Known boundaries still says implemented receipt/group workflows are absent. | P2 R06; reconcile current status with dated historical handoffs. |
| Development dependency advisories | Runtime audit clean; full audit has 13 tool-chain advisory entries. | P2 R07; compatible updates only, no forced major downgrades. |

No P0 issue was confirmed. These release gates are not a claim that every missing enhancement is essential to the MVP.

## Requested enhancement discovery

Costs are relative engineering scope, not monetary quotes or delivery promises. **S** is a small bounded change using current components, **M** spans validation/queries/UI/tests or a small approved model change, and **L** changes scheduling, accounting, import safety or external operations. No paid service is necessary for the recommended first enhancements.

| Requested capability | Actual status | User value / recommendation | Complexity and cost drivers | Dependencies | Roadmap |
| --- | --- | --- | --- | --- | --- |
| Monthly category budgets/progress | Missing | High for users who actively plan spending; add after comparison/search/export demand is confirmed. | M; Budget model, monthly uniqueness, exact progress and corrections. | Approved budget semantics/model; current expense aggregates. | P2 R13 |
| Recurring income/expenses | Missing | Useful for stable bills, but defer automatic creation. A manual repeat-entry shortcut is a cheaper alternative to validate demand. | L for scheduling/retries/time rules; S for an approved repeat-entry shortcut. | Hosting scheduler decision, occurrence identity and timezone policy. | P3 R19 |
| Savings goals | Missing | Moderate; useful only with an explicit contribution/progress definition. Dashboard balance does not prove savings. | M; goals/contributions and exact totals. | Approved goal model and contribution semantics. | P3 R20 |
| Spending anomaly detection | Missing | Low confidence with a small ledger; defer until enough complete historical periods exist. | M; deterministic baselines, exclusions, explanatory UI and sparse-data tests. | Historical data, agreed thresholds; no paid AI needed. | P3 R21 |
| Smart categorization suggestions | Partially implemented | Receipt extraction already suggests a category. Manual merchant-history suggestions are optional. | M; owner-scoped history matching, ambiguity and correction UX. | User-confirmed category history; no auto-save. | P3 R22 |
| Expense insights/recommendations | Partially implemented | Existing breakdown/trend supports exploration; exact savings-rate and prior-period facts add high value without another AI provider. | M; zero-income, negative net and partial-period comparisons. | Stable shared filters and comparison rules. | P2 R11 |
| Receipt duplicate detection | Missing | Useful warning against accidental repeat entry. Do not block legitimate identical purchases. | M; bounded owner/date/merchant/amount lookup and override flow. | Current transactions; approved warning semantics, no image retention. | P2 R14 |
| Transaction search/advanced filters | Partially implemented | Type/category/date filters exist. Text search and amount bounds are missing and valuable as ledgers grow. | M; bounded Zod query, count/list predicate, URL state and pagination tests. | Current owner-scoped list; profile before adding search indexes. | P2 R08 |
| CSV import/export | Missing | Export provides immediate portability; import creates considerably more integrity risk. Build export first. | M export; L import due staging, mappings, duplicates and rollback. | Shared filters; spreadsheet-safe output; approved import policy. | P2 R12 / P3 R26 |
| Group settlement history | Implemented and verified | Do not rebuild. A safe correction/reversal workflow is a separate, useful proposal. | None for existing history; M for corrections and linkage. | Explicit D-03 append-only change approval for corrections. | P2 R17 |
| Dashboard customization | Missing | Low priority. Limited visible-panel preferences may help later; avoid a drag-and-drop dashboard engine. | M; small preferences UI, hydration and accessibility. | Proven demand; existing fixed dashboard remains default. | P3 R23 |
| Approaching-budget notifications | Missing | Conditional value after budgets. Start with derived in-app notices rather than email/push jobs. | S for in-app thresholds; external delivery is separate scope. | R13 and agreed threshold/dismissal rules. | P3 R24 |
| Dark/light theme | Partially implemented | Palettes are verified; a small accessible selector is useful and cheap. | S; system/light/dark state and initial-render consistency. | Existing semantic tokens; preference-only storage policy. | P2 R16 |
| Currency preferences | Missing by explicit MMK decision | Low current value; keep MMK until a real multicurrency requirement justifies changing accounting. | L for real multicurrency; display locale is a different, smaller option. | D-02/schema approval, exponents and explicit conversion policy. | P3 R25 |
| Data backup/export | User export missing; backup/restore unverified | Operational backup/restore is essential before production. CSV is not a restorable system backup. | M for a documented backup/restore rehearsal and user CSV export separately. | Chosen host, restricted roles, backup retention/encryption and restore target. | P1 R03 / P2 R12 |

## Visualization gaps and ordering

1. **Monthly income versus expense comparison (R10):** highest next-chart value, using current SQL groups and exact totals. No new model or chart library.
2. **Savings-rate/prior-period facts (R11):** explain cash-flow changes, with unavailable rather than invented values for zero income or insufficient comparable data.
3. **Budget versus actual (R13):** useful only after budgets exist. Never use group bills in personal budget totals.
4. **Merchant spending (R15):** optional ranked bars/table with explicit handling of blank/inconsistent merchant names.
5. **Weekly and year-over-year views (R27):** add only when the selected range/history makes them meaningful. Avoid adding several similar charts to the default dashboard.
6. **CSV export (R12):** a filtered-data action, not another chart. Keep amounts/dates exact and prevent spreadsheet formula interpretation in untrusted text.

Category drill-down, monthly expense trends and custom date ranges are implemented and verified. They need discoverability/context improvements, not replacement implementations. All proposed views must preserve the existing shared date/category scope and selected-balance definition. If a comparison requires all categories, show that explicitly rather than silently ignoring a filter.

## Practical UX gaps

- Registration loses typed name/email on server rejection (R05).
- Other pages lack the dashboard's full navigation; detail back links discard list query context. Group error summaries are not consistently linked to field descriptions or first-error focus (R09).
- The 360px dashboard is readable but long; reducing filter chrome can shorten the path to the first chart without hiding balances or labels (R09).
- Dark styling has no discoverable user control (R16).
- Settlement corrections are unavailable; users should not be told to invent an external repayment to undo a typo (R17).
- Existing chart/table/keyboard and motion/transparency fallbacks should remain intact. Screen-reader and zoom findings must come from actual checks, not visual assumptions (R04).

## Deliberate boundaries, not newly found defects

JWT stolen-token revocation, password recovery, email verification, bank balances, payment execution, collaboration/invitations, receipt image storage and currency conversion are outside the accepted MVP. Group history pagination, cursor pagination and global transfer-count optimization have not been built. Only address these after an actual scale/product need or an approved security decision; do not turn this MVP into an enterprise platform.
