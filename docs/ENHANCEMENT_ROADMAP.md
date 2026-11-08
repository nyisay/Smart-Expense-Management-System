# Enhancement roadmap — 2026-11-08

Implementation follow-up: the user subsequently authorized monthly category budgets, advanced dashboard analytics, advanced ledger filtering and rule-based insights under D-05. See TASKS/PROGRESS for current evidence; the proposal text below is the original audit baseline. This subset approval does not approve other release or future work.

Status: **D-05 subset implemented and verified; remaining proposals await approval**. This document alone does not authorize implementation, deployment or a dependency upgrade. See [DECISIONS.md](DECISIONS.md) for actual approval, [PROGRESS.md](PROGRESS.md) for follow-up verification, and [SYSTEM_AUDIT.md](SYSTEM_AUDIT.md) / [FEATURE_GAPS.md](FEATURE_GAPS.md) for the original fifteen-area audit.

Priorities: P0 is a confirmed critical security/data-integrity defect; P1 is release safety or essential verification; P2 is a high-value bounded improvement; P3 is optional future work. **No P0 defect was confirmed.** Fix any subsequently confirmed P0 before other work.

Sizes are relative engineering cost, not time/money commitments: S is a narrow change using current code; M spans layers/tests or a small approved model; L changes scheduling, accounting or import operations. All entries include acceptance criteria and risks. They are alternatives to select from, not a commitment to build the entire backlog. Keep the current stack and feature folders. Do not add services, libraries or generic frameworks unless a selected task requires them.

## P1 — Release safety and verification

### R01 — Guard every database-writing test entry point

**Description/value/size:** Reuse the existing local/test database guard for Node/PostgreSQL and HTTP suites. Prevent accidental writes to an unintended database. **S**; no product feature or new dependency.

**Dependencies:** Existing `tests/e2e/database.ts`; inspect import/fixture order in every database suite.

**Acceptance:** Disallowed host/database names and production targets fail before a connection/write. Test this with spies or an isolated process, never a real production connection. All existing local unit/HTTP/browser fixtures still pass and clean their exact identities. Pure configuration tests remain database-independent. Error text names the requirement without showing credentials.

**Risks:** A guard run after Prisma access is too late. Avoid broader fixture deletion and do not silently rewrite the developer's DATABASE_URL. A local database name alone does not establish safe operational use; retain explicit test documentation.

### R02 — Define response security policies and trusted-proxy behavior

**Description/value/size:** Close A-02 and verify safe HTTPS authentication at the intended edge. **M**; application policy can be a small change, but deployment verification is separate.

**Dependencies:** Chosen hosting/proxy arrangement, canonical origin and current Next/Auth.js behavior. Follow [Auth.js deployment guidance](https://authjs.dev/getting-started/deployment) for trusted forwarded headers.

**Acceptance:** Verify frame protection, nosniff, referrer policy and an appropriate permissions policy on public responses. Introduce a CSP compatible with hydration, charts and uploads; use a staged policy where needed. Confirm Secure/HttpOnly/SameSite cookies and rejection of hostile forwarded-host/protocol/origin inputs at the actual trusted edge. Set and test HSTS only on the intended production HTTPS host. Record policies and public-response assertions without exposing secrets.

**Risks:** A nonce-based CSP can affect rendering/caching and requires a decision rather than a blind template. HSTS preload/includeSubDomains can affect other services. Edge and app policies can conflict. No deployment is authorized by this entry.

### R03 — Rehearse clean installation, least privilege and backup/restore

**Description/value/size:** Prove recoverable persistent data before release. **M**; operational work, not another product module.

**Dependencies:** Approved deployment host, isolated restore database, runtime/migration roles and backup retention/encryption policy.

**Acceptance:** On a clean authorized environment, run pinned dependency installation, Prisma client generation, reviewed migration replay and category seeding, then build/start checks. Runtime credentials cannot create/alter schema; migration credentials remain separate. Restore a protected backup into an isolated database and verify ownership, exact amounts, group share triggers and repayments. Confirm real TLS/proxy/secrets, pool/concurrency limits and server availability. Document recovery ownership and an agreed recovery objective. Never restore over existing data during verification.

**Risks:** Dumps contain sensitive data; CSV is not a system backup. Local combined-role tests do not prove production privileges. Cold builds need the existing font network source. Infrastructure/destructive steps require separate approval.

### R04 — Verify receipt runtime and manual accessibility on intended devices

**Description/value/size:** Establish evidence for live receipt extraction and inclusive real-world operation. **M**; test/verification scope before making reliability claims.

**Dependencies:** Local-only Ollama/vision model running on the same trusted deployment host; representative non-sensitive receipts, intended languages, real devices and assistive technologies.

**Acceptance:** Start the approved runtime through a separately authorized setup task if needed. Run the optional synthetic benchmark, then an agreed real-receipt corpus including poor images, ambiguous totals/dates and relevant languages. Record field accuracy/uncertainty, failures, latency and memory against agreed targets without committing images/raw OCR. Verify no auto-save and correct confirmed expense totals. Exercise screen readers, keyboard/zoom, physical phones and Firefox/WebKit through auth, entries, charts, receipt review and groups. Document limitations and fix only observed defects.

**Risks:** Current Ollama probe returns `ECONNREFUSED`. A tiny clean synthetic benchmark does not prove photo/language accuracy. Timeout does not prove underlying inference cancellation. Hosting the app elsewhere requires a D-04 deployment/provider decision; do not expose local Ollama publicly.

## P2 — Select bounded improvements after release gates

### R05 — Retain registration input and explain field errors

**Description/value/size:** Fix reproduced name/email loss after server validation failures. **S**.

**Dependencies:** Existing AuthForm and server Zod errors; no schema or authentication strategy change.

**Acceptance:** Add a failing browser regression for whitespace-name rejection before the fix. Name/email remain available after errors and the relevant field is identified accessibly. Define password clearing deliberately; no credential persistence or logging. Successful registration/login, generic duplicate outcomes, throttling and password-manager support remain unchanged.

**Risks:** Do not expose account existence, echo passwords into action state or reset controlled values on every rerender.

### R06 — Reconcile setup instructions with verified capabilities

**Description/value/size:** Remove contradictory absence claims and distinguish historical checks from current status. **S**.

**Dependencies:** Current source, this audit and dated PROGRESS entries.

**Acceptance:** SETUP accurately describes temporary receipt extraction, owner-managed group/repayment history and remaining absent capabilities. Label manual repetitions versus automated verification and current Ollama prerequisites. Preserve prior decision history; validate commands/links without credentials.

**Risks:** Do not turn historical or mocked evidence into live-provider/production readiness claims.

### R07 — Resolve development-tool advisories compatibly

**Description/value/size:** Reduce developer/CI supply-chain exposure. **M**, dependent on upstream compatibility.

**Dependencies:** Compatible fixes in ESLint/shadcn dependency chains; version-change approval where material.

**Acceptance:** Review advisory reachability and candidate lockfile changes. Rerun runtime/full audits, lint, types, build and regressions. No unexplained downgrade or new runtime dependency. If no compatible upstream fix exists, document the remaining exposure rather than claiming remediation.

**Risks:** `npm audit fix --force` currently proposes incompatible major changes. Runtime audit is already clean; do not destabilize working code just to lower a count.

### R08 — Add transaction text search and bounded amount filters

**Description/value/size:** Find merchant/note records in a growing personal ledger. **M**; extends existing filters rather than building a search service.

**Dependencies:** Current owner-scoped transaction store, Zod schema, URL filter form and pagination.

**Acceptance:** Define bounded text matching and exact optional min/max amounts. The same combined predicate drives count/list; changing filters resets page, and page links retain all filters. Empty, invalid-range and two-owner tests pass. Literal/wildcard behavior is documented. Use current PostgreSQL queries; add an index only after profiling demonstrates need.

**Risks:** Broad contains searches can scan many rows. Avoid float amounts, malformed query parameters or inconsistent count/list predicates.

### R09 — Preserve navigation context and improve form error access

**Description/value/size:** Reduce backtracking and make long mobile flows easier to correct. **M**.

**Dependencies:** Current route links, dashboard navigation, form feedback and Cache Components behavior.

**Acceptance:** A small shared navigation/active-location treatment works across core protected pages. Returning from transaction details restores validated list filters/page. Keyboard users can reach main content and linked field errors without duplicate visible targets. Mobile filters can use less space without hiding exact summaries or chart alternatives. Browser tests cover focus, failed-form retention and client navigation.

**Risks:** Do not add a navigation framework, accept arbitrary return URLs or introduce duplicate main IDs/focus loss in retained pages. Do not hide essential data just to shorten screenshots.

### R10 — Add monthly income-versus-expense comparison

**Description/value/size:** Highest-value next visualization: show cash-flow direction alongside spending. **M**; reuse existing SQL groups and Recharts.

**Dependencies:** Current dashboard aggregate DTO, exact money and shared date/category rules; no new table/library.

**Acceptance:** Show monthly income and expense series plus an exact table/legend/tooltips. Both series reconcile with selected cards, including zero months, large amounts, empty data and partial date boundaries. Category-filtered income remains consistent with current semantics, or the UI explicitly requests clearing the category for an overall comparison. Ownership and mutation-refresh tests pass at desktop/360px and by keyboard.

**Risks:** Silently ignoring category filters creates conflicting totals. Do not relabel selected-range net as bank balance or use floating-point labels.

### R11 — Add exact cash-flow insights and aligned period comparisons

**Description/value/size:** Explain changes with a small set of deterministic facts, including an optional savings-rate indicator. **M**; no AI service.

**Dependencies:** R10 or equivalent monthly income buckets; an approved partial-period comparison definition.

**Acceptance:** Define savings rate as selected net divided by selected income and label its cash-flow meaning. Zero income or an expense-only category produces unavailable rather than infinity/misleading percentages. Handle negative net. Prior-period changes compare aligned periods and disclose incomplete history; zero baselines show an absolute change or unavailable percentage. Exact arithmetic and shared filters remain authoritative.

**Risks:** Income minus expense is not proof money was saved. Avoid advice based on incomplete dates or claiming a rounded chart value is an exact financial result.

### R12 — Export the filtered personal ledger as CSV

**Description/value/size:** Give users portable, reviewable data. **M**; build before import.

**Dependencies:** Shared authorized transaction filters, a documented export size/streaming policy and safe download handling.

**Acceptance:** Export the defined full filtered set, not silently just the visible page. Preserve MMK integer amounts, type, date and text; quote delimiters/newlines correctly. Protect untrusted spreadsheet text against formula interpretation using a tested documented policy; quotes alone are insufficient, as explained by [OWASP CSV guidance](https://community.owasp.org/attacks/CSV_Injection). Test cross-user rejection, empty sets, limits and hostile text. Exclude tokens, password hashes and receipt pixels. Do not retain server-side export files by default.

**Risks:** CSV injection, sensitive downloads, memory use and unexpected truncation. A ledger CSV cannot restore users/groups/constraints or replace R03 backups.

### R13 — Add monthly category budgets with actual spending progress

**Description/value/size:** Help users act on the category breakdown. **M**; optional next feature after core comparison/search/export.

**Dependencies:** Approved Budget model/month/rollover rules, current personal expense aggregation and MMK decision.

**Acceptance:** One owner/category/month budget with exact whole-kyat values and clear unset/zero rules. Progress and overspend use the same dates/expenses, update after edits/deletes, exclude group records and never divide by zero. Enforce owner access and uniqueness, test month boundaries and empty accounts. Keep notification delivery outside the first slice.

**Risks:** A selected partial range is not automatically a complete monthly actual. Schema/definition approval is required; do not create a general planning engine.

### R14 — Warn about possible duplicate reviewed receipts

**Description/value/size:** Reduce accidental double entry while allowing genuine repeated purchases. **M**.

**Dependencies:** Owner-scoped existing transactions and approved merchant/date/amount warning rules; no image retention.

**Acceptance:** Before final save, show likely matches within a bounded lookup and allow explicit override. A different user's purchase never appears. Same submission retries still create one record; legitimate identical purchases can be saved intentionally. Corrections and unknown fields do not produce fabricated certainty. Test false positives and changed review fields.

**Risks:** Merchant/date/amount similarity is not proof of an identical receipt. Persistent image hashes would be a separate privacy/data decision, not an automatic addition.

### R15 — Add ranked merchant spending analysis

**Description/value/size:** Show where spending concentrates without another dashboard full of charts. **M**.

**Dependencies:** Current merchant fields, approved grouping/normalization and shared owner/date/category scope.

**Acceptance:** Provide a bounded ranked bar/table view, with a clearly labeled unspecified merchant and documented case/whitespace treatment. Totals reconcile to selected expenses; display exact values and owner-only drill-down. Do not merge distinct businesses based on guessed identity.

**Risks:** Inconsistent manual/receipt merchant strings can fragment or wrongly combine results. Prefer explainable rules over a new ML/provider dependency.

### R16 — Expose an accessible light/dark/system preference

**Description/value/size:** Make existing verified palettes user-selectable. **S**.

**Dependencies:** Current `.dark` styles and an approved preference-only persistence/initial-render approach.

**Acceptance:** Keyboard-operable labeled control supports explicit modes and system preference; no hydration mismatch or unreadable first paint. Charts follow the same palette. Reload persistence contains only display preference, never auth tokens or receipt suggestions. Retain high-contrast and reduced-motion/transparency behavior.

**Risks:** Theme flashes and server/client disagreement. A small client control is sufficient; no theme-management dependency is required by default.

### R17 — Add auditable settlement correction, not duplicate history

**Description/value/size:** Correct entry mistakes without inventing a money transfer. Existing repayment history already works. **M**.

**Dependencies:** Explicit approval to extend D-03's append-only behavior, including a correction/reversal model linked to the original record.

**Acceptance:** Owner-authorized, explicitly confirmed corrections preserve the original history, derive net balances exactly once and are retry/concurrency safe. Distinguish an administrative correction from a real external repayment. Test typo correction, overpayments, bill edits/deletion and personal-dashboard isolation.

**Risks:** Editing/deleting history or treating a reversal as actual cash movement can mislead users. Do not work around the current limit by asking users to record repayments that did not happen.

### R18 — Profile large ledgers before optimizing queries or rendering

**Description/value/size:** Establish scale evidence and fix only measured bottlenecks. **M**, conditional implementation.

**Dependencies:** Disposable test data, agreed dataset sizes/device/query budgets and current build manifests.

**Acceptance:** Measure deep transaction pages, group list/detail/form loaders, dashboard grouping, duplicate principal reads, browser transfer and low-end blur cost. If needed, page history separately while computing balances over the entire authorized ledger. Verify plan/index changes and stale/concurrent behavior. Define the measured improvement; keep filters/totals unchanged.

**Risks:** Full group loading and offset pagination have known limits, but no production slowdown is proven. Avoid production load tests, global private caches, premature indexes or blanket memoization/lazy-loading.

## P3 — Optional; defer until demand/data justifies cost

### R19 — Recurring entries

**Description/value/size:** Reduce repeated bookkeeping for regular bills. **L** for automation; validate demand with an approved **S** manual repeat-entry shortcut first.

**Dependencies:** Approved scheduling/hosting approach, end-of-month/timezone policy and unique occurrence identity.

**Acceptance:** One occurrence per owner/schedule/date, including retries and downtime catch-up. Preview, pause/stop and distinguish future plans from actual transactions. Editing one occurrence does not silently rewrite history. Test month ends/leap years and authorization.

**Risks:** Duplicate/premature entries, scheduler operations and expanding accounting semantics. Do not add queues or a paid scheduler before a real need.

### R20 — Savings goals

**Description/value/size:** Track deliberate targets and contributions. **M**.

**Dependencies:** Approved owner-scoped goal/contribution model and progress definition.

**Acceptance:** Exact targets/contributions, achievable/over-target/zero states, controlled corrections and owner isolation. Goal contributions do not silently create another expense or claim that dashboard net is deposited savings.

**Risks:** Double counting or misleading cash availability. A target indicator is simpler than a new account/transfer ledger.

### R21 — Explainable spending anomaly flags

**Description/value/size:** Highlight unusual spending when enough history exists. **M**; deterministic rules first.

**Dependencies:** Agreed minimum complete history and category/period baseline rules.

**Acceptance:** Suppress flags for insufficient/zero baselines; explain the comparison and allow dismissal. Handle one-off purchases, partial months and changed categories. Test false positives, exact thresholds and owner isolation. Never save/edit transactions based on a flag.

**Risks:** Sparse data and normal irregular purchases produce misleading warnings. Do not add a paid AI model or present financial advice as fact.

### R22 — Suggest manual categories from confirmed merchant history

**Description/value/size:** Extend the receipt-only suggestion capability to manual entry. **M**.

**Dependencies:** Sufficient owner-confirmed category history and clear merchant matching rules.

**Acceptance:** Suggest only from the user's matching history and valid transaction-type categories. Ambiguous matches remain unselected. The user can change/reject a suggestion before explicit save. Test changed merchant, conflicting history and cross-user isolation.

**Risks:** Repeating past errors or mixing business names. Do not auto-save or silently recategorize historical transactions.

### R23 — Limited dashboard panel preferences

**Description/value/size:** Let established users hide/reorder a small fixed set of panels. **M**.

**Dependencies:** Proven demand, approved preference persistence and R16-style initial-render handling.

**Acceptance:** Fixed default layout remains usable; preferences can be reset, preserve keyboard operation and never alter aggregate filters/amounts. Do not hide required chart/table alternatives.

**Risks:** Extra UI state, hydration complexity and inaccessible drag interactions. Avoid a general dashboard builder.

### R24 — In-app budget threshold notices

**Description/value/size:** Warn when a user's agreed threshold is reached. **S** for derived in-app notices; external delivery is separate scope.

**Dependencies:** R13; approved threshold, comparison period and dismissal semantics.

**Acceptance:** Exact thresholds use the current budget/actual definition and update after transaction corrections. Unset/zero budgets behave deliberately. Notices are contextual, accessible and do not repeat unnecessarily. No email/push infrastructure in the first slice.

**Risks:** Alert fatigue and exposing spending details in notifications. Email/push later needs consent, delivery/security decisions and scheduling.

### R25 — Real currency preferences/multicurrency

**Description/value/size:** Support genuinely different financial currencies only if demand warrants it. **L**; MMK remains current scope.

**Dependencies:** Explicit D-02/schema/data-migration approval, currency exponents and immutable/manual or approved sourced conversion rules. Locale/display preference is a separate smaller request.

**Acceptance:** Separate native currency totals and preserve one currency per group. Use exact minor-unit/decimal arithmetic for each supported exponent. Never add mixed-currency amounts without an explicit rate/date/base-currency definition. Test conversions, rounding and old MMK data migration without loss.

**Risks:** A currency dropdown over MMK amounts would mislabel money. Conversion providers and historic rate changes add operational/accounting cost; defer them.

### R26 — Previewed, bounded CSV import

**Description/value/size:** Help users migrate existing ledgers after export is established. **L**.

**Dependencies:** R12, approved input format/category mapping and duplicate/import-batch semantics.

**Acceptance:** Size/row/text limits, Zod validation, exact MMK/date rules and an editable preview precede any save. Report row errors without partial surprise writes. Explicitly confirm batches and ensure retries cannot duplicate them. Test malformed quoting, duplicates, mixed currencies, authorization and rollback. Do not interpret formulas as executable input.

**Risks:** Imported bad data can overwhelm useful charts. Avoid arbitrary column mapping engines or automatic silent coercion in the first import slice.

### R27 — Weekly or year-over-year comparison views

**Description/value/size:** Improve short-range or mature-history analysis when monthly spending alone is insufficient. **M** overall; a bounded weekly toggle may be **S**.

**Dependencies:** R10/R11 comparison definitions; useful historical coverage. Weekly reporting needs an explicit week-start convention; YoY needs a genuinely comparable prior year.

**Acceptance:** Zero-filled weekly buckets obey selected inclusive dates and Asia/Yangon business dates. YoY discloses missing history, aligns partial periods/leap dates and handles zero baselines without infinity. Totals reconcile with cards and exact tables. Show an appropriate single view rather than adding several redundant charts.

**Risks:** Week/year boundary errors and misleading sparse-history comparisons. Do not manufacture insights from missing data.

## Recommended order and approval boundary

1. **Next bounded task: R01.** Add the common test-target gate and refusal regressions, then run existing checks. No architecture/dependency change is needed.
2. Resolve **R02–R04** as separately reviewable release-policy/verification tasks. Production infrastructure and external service changes still require explicit approval.
3. Fix **R05–R07** without expanding product scope. Compatible upstream remediation may remain blocked until a suitable release exists.
4. **First product enhancement: R10**, monthly income versus expense. Then select **R08** search or **R12** export based on actual user need. Do not launch every P2 proposal as one milestone.
5. Consider R11/R13 and other P2 entries only after the first addition is verified. Keep P3 entries deferred unless user demand/data changes their value.

Stop after this audit. No enhancement is complete or in progress merely because it appears here. Await the user's approval for the selected next task.
