# Requirements

Status: database/authentication, transaction management and dashboard authorized and implemented on 2026-11-06. Receipt processing and group/settlement workflows remain planned. See [DECISIONS.md](DECISIONS.md) for accepted scope and deferred receipt processing decisions.

## Goal and boundaries

Make personal spending easy to understand through clear, accurate visualizations. Support manual bookkeeping, receipt-assisted expense entry, and unequal group bills in one small application. Persist financial records in PostgreSQL through Prisma; use Auth.js JWT sessions for email/password authentication.

Confirmed currency/reporting rules: MMK, whole kyat (0 decimal places), Asia/Yangon. The foundation uses owner-managed groups with named participants, one payer per group expense, and explicit owed shares; group records remain separate from personal transactions. Receipt metadata and Settlement models exist as requested, but extraction, image handling, group operations and settlement flows are not implemented. Local-only receipt OCR remains a future proposal.

Defer bank connections, exchange rates, budgets, recurring entries, exports, payment execution, settlement recording UI, invitations, shared group editing, email verification, password recovery, and paid AI integrations. A Settlement model is schema preparation for a recorded external repayment; it does not execute a payment. Do not describe a member balance as a payment made or a bank balance.

## Functional requirements and acceptance criteria

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

Select a JPEG or PNG receipt image, run local OCR, suggest amount, merchant, date, and expense category, and present an editable review form. Category inference is a transparent keyword heuristic with Other as fallback. OCR is assistance, not financial truth; every field remains editable.

Acceptance:
- A legible sample receipt produces candidate fields; missing or ambiguous fields are flagged for review rather than silently treated as correct.
- No transaction is saved before explicit confirmation. Correcting all four fields and confirming saves exactly those validated values as one expense.
- OCR failure, cancellation, and unreadable input preserve manual entry as a usable path. Slow OCR has progress and cancel/retry controls.
- Reject unsupported image types and enforce proposed limits of 10 MiB and 20 megapixels before OCR. Decode errors are handled safely; validate header signatures as well as declared MIME type.
- Receipt pixels and raw OCR text stay in the browser under the proposed design. Saving transmits only reviewed fields; release temporary image/worker resources on cancel or completion.
- Test a representative receipt set and document extraction limits; no promise of perfect OCR or universal language support.

### FR-05 Groups and unequal bill splits

The proposed MVP lets a signed-in owner create a group, name members (including one self member), and record bills with one payer and explicit per-member owed amounts. Members are labels, not accounts or invitees. The owner alone can read/manage the group. Support bill correction/deletion; defer deleting groups or members with history.

Acceptance:
- A 100.00 bill paid by A with shares A 20.00, B 30.00, C 50.00 yields balances A +80.00, B -30.00, C -50.00. Positive means is owed; negative means owes. All member balances sum to zero.
- Shares are nonnegative, at least one is positive, and their exact sum equals the bill total. Payer and every participant belong to the same group; each member appears at most once per bill.
- Group detail shows members, bills, and paid/owed/net totals. Zero-share participants and a payer with zero owed share are supported.
- Bill plus shares save atomically; invalid or failed writes leave neither an incomplete bill nor partial balances. Edits/deletions recompute balances correctly.
- Group bills never implicitly change personal transactions or dashboard totals. The interface states this separation.
- Unauthorized direct requests fail. Concurrent edits are rejected with a conflict instead of silently overwriting a newer bill.

## MVP completion

All FR acceptance criteria pass with a real PostgreSQL database, security and money edge cases have automated coverage, dashboard accessibility/responsiveness has been inspected, and the handoff documents working setup, verification evidence, and known limitations. No paid AI credentials are needed.
