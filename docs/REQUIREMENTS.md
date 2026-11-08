# Requirements

Status: the implemented MVP has local integration, isolated desktop/mobile Playwright and automated accessibility verification. Representative real-receipt and manual assistive-technology/deployment checks remain open; see [MVP_REVIEW.md](MVP_REVIEW.md) and [DECISIONS.md](DECISIONS.md).

## Goal and boundaries

Make personal spending easy to understand through clear, accurate visualizations. Support manual bookkeeping, receipt-assisted expense entry, and unequal group bills in one small application. Persist financial records in PostgreSQL through Prisma; use Auth.js JWT sessions for email/password authentication.

Presentation: the user subsequently requested a premium Dark Base/Frosted Glass workspace on 2026-11-08 (D-06), superseding the earlier light-default glass theme. Provide persisted appearance selection, a collapsible desktop sidebar and focus-managed mobile drawer, active links, profile/logout controls and no dead routes. Analytics and Settings reuse existing dashboard/account views. Preserve chart readability, exact data, responsive layouts, keyboard access and contrast; support reduced transparency/motion, no-blur fallbacks and forced colors. [UI_THEME.md](UI_THEME.md) records the design and verification approach.

Confirmed currency/reporting rules: MMK, whole kyat (0 decimal places), Asia/Yangon. Owner-managed groups use named participants, one payer per group expense and exact owed shares; group records remain separate from personal transactions. Receipt review saves only confirmed transaction fields. Recorded settlements represent money repaid outside the application.

Defer bank connections, exchange rates, recurring entries, exports, payment execution, invitations, shared group editing, email verification, password recovery, and paid AI integrations. Monthly budgets, advanced analytics/filtering and rule-based insights are authorized by D-05. Settlement recording does not execute a payment. Do not describe a member balance as a payment made or a bank balance.

## Functional requirements and acceptance criteria

### FR-06 Monthly category budgets

- An authenticated user can set, edit and remove a positive whole-MMK expense-category limit for an independent calendar month. No rollover or prorating; unset means unbudgeted.
- Show full-month personal spending, limit, remaining amount and overspend with exact numbers. Progress bars have a name and numeric value; overspend remains explicit beyond the visual 100% cap. Warn at 80% and distinguish reached/overspent limits.
- Group expenses/settlements never contribute. Confirmed receipt expenses contribute once through personal transactions. Removing a budget preserves transactions.
- Reject unauthenticated/cross-owner operations, income categories, invalid months/limits and stale edits, including removed/recreated row identities. A retried identical create does not duplicate the limit.

### FR-07 Advanced analytics and deterministic insights

- Show monthly income/expense bars and net cash-flow trend with exact accessible tables/tooltips and zero-filled months. Every section shares the dashboard's date/category predicates.
- Compare calendar months, aligned month-to-date or immediately preceding equal-length custom ranges under D-05. Include exact absolute changes and explicit period labels. Suppress conclusions for future-ending ranges and insufficient prior recorded history.
- Show largest selected expense category, expense change, and signed cash-flow savings rate `(income − expenses) / income`. Zero income and zero previous expense have explicit unavailable percentage states. Do not imply bank savings or complete history.
- Full-month budget notices share the aggregation snapshot and category scope. Partial/multi-month dashboard ranges link to full-month budgets without prorating or mixing totals. No external AI is required.

### FR-08 Advanced transaction filters

- Combine literal case-insensitive merchant/note search, inclusive exact minimum/maximum MMK, type, category and inclusive dates. Reject malformed, fractional, negative, reversed or excessive bounds; zero is a valid search boundary.
- Count and paginated records share the same owner/filter predicate and snapshot. Keep filters through pagination, detail, edit/cancel/save and deletion. Validate internal navigation destinations on the server.
- Empty and invalid filters have recovery links; responsive forms retain submitted valid filters. Search is at most 100 characters; pagination remains 20 records.

### FR-01 Authentication and isolation

Register with email/password, sign in, sign out, and retain a session across reloads until expiry. Store only a secure password hash. Password policy: 12–128 characters; normalize email consistently and enforce uniqueness. Use generic authentication failures, bounded attempts, and server-side authorization.

Acceptance:
- Valid registration persists a user; duplicate normalized emails cannot create two accounts, including concurrent requests.
- Correct credentials sign in; wrong credentials fail without revealing whether the account exists. Expired, missing, or tampered sessions cannot access protected data or mutate it.
- Sign-out clears the current session cookie. Tokens and password hashes never reach client props or logs.
- User B cannot read, edit, delete, or infer user A's transactions, groups, bills, or chart data by changing IDs or invoking endpoints directly.
- Rate limits apply to registration and login across application instances. Authentication checks include the persisted user's existence.

### FR-02 Personal transactions

Create, view, list, edit, and delete income and expenses with amount, calendar date, category, optional merchant/source, and optional note. Filter by transaction type, inclusive date range and category; paginate at 20 entries per page while retaining filters. Categories are a small seeded, fixed list by transaction type, including Other; custom category management is deferred. Confirm destructive deletion and preserve a form on validation failure. MMK amounts must be whole kyat; calendar dates must be valid YYYY-MM-DD values from 1900 onward.

Acceptance:
- Valid entries survive reload and an application restart against the same database.
- Reject zero/negative amounts, excess currency precision, unsupported categories, invalid dates, and excessive text lengths on the server.
- Income cannot use an expense-only category. Editing/deleting an entry updates the list and detail routes; dashboard integration is deferred until that feature exists.
- Errors cause no partial writes; repeat submission of the same create request produces one record.
- Stale edit/delete versions fail without overwriting or deleting a newer record; another user's record is indistinguishable from an unavailable one.
- Sample financial seeding is opt-in, requires development mode and the local smart_expense_db target, and never changes existing entries on repeated runs.

### FR-03 Dashboard (primary feature)

Show total income, expenses, and net balance; an interactive expense-category donut; a monthly expense trend; and eight recent transactions for a shared inclusive date range (current calendar month by default). The user's dashboard request specifies monthly buckets, superseding the initial daily-trend proposal. Balance means selected-range income minus selected-range expense, not an opening or bank balance. Date and expense-category filters apply consistently to cards, both charts and recent transactions. Selecting an expense category therefore yields zero income and an expense-only balance; clearing it restores the full date-filtered dataset. Provide this-month, last-six-month and year-to-date shortcuts plus custom ranges of up to 120 calendar months.

Acceptance:
- A fixture containing income MMK 100,000 and expenses Food 30,000 + Travel 20,000 yields income 100,000, expense 50,000, and net 50,000; category and monthly totals both reconcile to 50,000.
- Include transactions on both selected boundary dates and exclude records outside the range. Monthly trends fill missing months with zero; default dates use Asia/Yangon and business dates do not shift with database timezone.
- Changing the range recomputes all summaries from the same authorized dataset; income never appears in the expense pie.
- Loading, empty, error, and populated states work. An empty pie shows an explanatory empty state rather than misleading slices.
- Provide currency/date labels, legends, readable tooltips, and an accessible textual/table equivalent. Information is not conveyed by color alone.
- Cards, controls, and charts work at 360px and desktop widths without horizontal page overflow. Exact totals remain available even if chart coordinates use approximate numbers.
- All data comes from the signed-in owner's PostgreSQL transactions. No hardcoded financial values or shared private cache may substitute for persisted records; group expenses and settlements remain separate.

### FR-04 Receipt-assisted expense entry

Upload a JPG, PNG or WebP receipt to the authenticated server, extract final total, merchant, calendar date, currency and expense category using local Ollama vision with structured JSON, and present an editable review form. The provider is behind a server-only extraction function seam. Extraction is assistance, not financial truth; every field remains editable. Do not invent values or silently select a fallback category/currency/date.

Acceptance:
- A legible sample receipt produces candidate fields; missing or ambiguous fields are flagged for review rather than silently treated as correct.
- No transaction is saved before explicit confirmation. Correcting fields and confirming saves exactly those validated values as one owner-scoped expense, with retry-safe creation and dashboard refresh.
- API failures, invalid structured responses and unreadable input have safe errors, retry and a manual-entry link. Slow extraction has an announced pending state and a 120-second deadline; no fabricated progress percentage.
- Reject unsupported MIME types, mismatched signatures, corrupt/animated images, uploads above 10 MiB and decoded images above 20 megapixels on the server. Strip metadata and send only decoded/re-encoded pixels to loopback Ollama.
- No persistent pixels, raw OCR, unconfirmed metadata or sensitive logging. Upload/extraction/confirmation all require persisted authentication; provider settings are server-only. Reloading clears unsaved review state; SPA navigation may temporarily retain client form state under Cache Components. No tokens or suggestions are stored in localStorage/sessionStorage or server persistence before confirmation.
- Invalid/ambiguous dates, totals and categories become null with review notices. Unknown/non-MMK currencies clear the amount; saving requires explicit MMK confirmation and positive whole kyat, with no implicit currency conversion.
- Explicit receipt labels MMK/MMKs/MKKS, Ks/Ks., kyat/kyats and ကျပ်/က်ပ္ normalize to MMK. Recognize Myanmar digits, valid comma/space thousands groups and one/two zero decimal places without rounding; reject malformed/ambiguous grouping, nonzero fractions and unknown currencies. Manual transaction input remains strict whole-kyat digits.
- Show a collapsible browser-only selected-image preview for comparing printed fields. Revoke preview URLs when replaced/deactivated; do not upload a preview through image optimization or persist it. Explain that failed replacement extraction retains the previous review.
- Automated extraction tests use mocks, including ambiguous/missing output, failures and a corrected expense reaching real PostgreSQL/dashboard totals. Benchmark real non-sensitive receipts separately; no promise of perfect OCR or universal language support.

### FR-05 Groups and unequal bill splits

The MVP lets a signed-in owner create a group, add up to 50 named participants including guests and exactly one self member, record multiple bills with one payer, and allocate uneven shares as exact whole-kyat amounts or percentages. Members are labels managed by the owner; they do not gain account access. The owner alone can read/manage the group. Support bill correction/deletion and recording completed external repayments; defer group/member deletion, invitations and settlement correction/deletion.

Acceptance:
- An MMK 100 bill paid by A with shares A 20, B 30, C 50 yields balances A +80, B -30, C -50. Positive means is owed; negative means owes. All member balances sum to zero.
- Shares are nonnegative, at least one is positive, and their exact sum equals the bill total. Payer and every participant belong to the same group; each member appears at most once per bill.
- Group detail shows members, bills, and paid/owed/net totals. Zero-share participants and a payer with zero owed share are supported.
- Bill plus shares save atomically; invalid or failed writes leave neither an incomplete bill nor partial balances. Edits/deletions recompute balances correctly.
- Group bills never implicitly change personal transactions or dashboard totals. The interface states this separation.
- Unauthorized direct requests fail. Concurrent edits are rejected with a conflict instead of silently overwriting a newer bill.
- Percentage inputs allow at most two decimal places and must sum to exactly 100.00%. Multiply total by integer basis points, floor each share, then assign leftover kyat by descending fractional remainder and ascending canonical participant UUID for ties. For MMK 101 at 50/25/25%, exact saved shares are 51/25/25. Zero-share participants never receive an arbitrary rounding charge.
- Show paid, owed, repayments sent/received and net = paid − owed + sent − received, computed from every current bill and each recorded settlement exactly once. Suggest deterministic debtor-to-creditor repayments from these nets; suggestions never write financial records.
- Explicitly confirm an external repayment with distinct same-group sender/receiver and a positive whole-kyat amount/date. Group/member/bill/repayment create retries must not duplicate records; changed payloads using an existing retry key fail. Overpayments are allowed as records of actual events and may reverse balances.
- Editing/deleting bills preserves recorded repayments; recomputed balances may therefore reverse direction. Repayments are append-only in the MVP and the UI states this before confirmation. There is no money transfer or personal transaction side effect.

## MVP completion

All FR acceptance criteria pass with a real PostgreSQL database, security and money edge cases have automated coverage, dashboard accessibility/responsiveness has been inspected, and the handoff documents working setup, verification evidence, and known limitations. No paid AI credentials are needed.
