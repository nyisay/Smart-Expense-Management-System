# Architecture

## Registration completion redirect

The user requested automatic navigation to Login after registration (2026-11-12). `registerAction` retains the existing validated/throttled service and generic new/existing-email outcome, then calls Next's fixed `/login?registered=1` redirect outside its error handler. Failed requests still return form feedback. JavaScript clients use router replacement; progressive forms receive HTTP 303. Registration does not establish a session. The root Toaster consumes the strictly matched, non-sensitive presentation flag to show the existing generic notice, then removes it using native history without reloading. No identity or credential enters the URL; the flag is not authentication proof. Login still uses its existing in-memory success intent and encrypted HttpOnly JWT flow.

## Account profile and session revocation (D-09)

`/app` remains the thin authenticated Settings route. `features/account/` owns strict Zod inputs, server-only persistence, Server Actions and presentation. Profile queries select only name/email/createdAt/profilePhotoId; bytes never enter client profile props. Actions obtain the persisted principal with requireUser and construct allowed inputs; posted user IDs/emails/credential versions cannot choose another account. Display-name updates compare the original name and owner ID in one transaction to reject stale forms, then revalidate the root layout so the shell/profile reflect the new name. No financial records are modified.

The additive `20261110000100_account_sessions` migration adds a nonnegative User.sessionVersion integer with default zero. Credentials return the version read with the verified password to the server-side Auth.js JWT callback. Tokens contain the user ID, session version and Auth.js lifecycle claims; session responses do not expose the version or hashes. The existing JWT strategy, encryption, HttpOnly cookie, expiry and per-operation authorization remain. The JWT callback now compares the token's version to the persisted version on every session read using features/auth/session-version.ts. Unversioned legacy tokens mean zero only; null, malformed and mismatched versions fail. Never reread the latest version to relabel a credential result or upgrade an old token.

Password changes reuse Argon2id and shared AuthThrottle counters (password-change action, five per user / 500 global per 15-minute window). After current-password verification, one conditional update matches owner ID, verified hash and version, replaces the hash and increments the version. This prevents two concurrent changes or a login race from turning old credentials into a current session. Existing logout clears the current cookie and redirects to login; other devices lose access at their next authenticated request. Previously rendered client content is not remotely erased. Email changes/account deletion remain deferred; private photo storage is accepted under D-14. The shared PasswordInput is reused across login, registration and three password-change fields without browser persistence.

Apply this migration before serving the new code. Development verification uses a separate disposable PostgreSQL instance on loopback port 55438 rather than the configured hosted database. No production migration or deployment is implied by the implementation approval.

## Private profile thumbnails (D-14)

D-14 supersedes the earlier photo-storage deferral only. `20261112000100_profile_photo` adds nullable User.profilePhoto (BYTEA) and profilePhotoId (UUID), constrained to paired nullability and a 65,536-byte cap. `features/account/photo.ts` reuses Sharp for MIME/signature agreement, static-frame and decoded-pixel limits, orientation, metadata stripping and centered 256px WebP. Only processed bytes persist. Owned conditional updates compare the expected revision; replacement rotates it and removal clears both fields. No new dependency or environment variable is needed.

`GET /api/account/photo` checks Auth.js and loads only that principal's photo, returning image/webp with private/no-store and nosniff (401 without a session, 404 without a photo). Query strings never select a user; revision is only a refresh hint. Cache Components requires Node and forbids redundant runtime exports. `UserAvatar` reuses installed Radix Avatar with initials fallback. Login explicitly selects credentials without photo bytes. Apply the additive migration before serving this code; verification uses disposable local PostgreSQL only.

## Whole-group history deletion (D-07)

The owner-confirmed Delete group action on `/groups` removes one complete group history: repayments, expenses (whose shares already cascade), participants and group, all inside the existing owned-group row lock/transaction. Server authentication, strict Zod input and owner predicates are mandatory. Existing Group.updatedAt serves as the confirmation revision; successful group mutations advance it monotonically using the database clock. A stale list/dialog is rejected instead of silently removing changed history. Group deletion revalidates the list/nested routes and returns success feedback. Personal transactions are never touched; no schema, migration or dependency is added.

This explicitly approved operation is the exception to the earlier retained-history/group-deletion deferrals below. Individual repayment correction/deletion and individual member deletion remain deferred; deleting a bill still retains repayments. Removing a whole group never refunds or executes an external payment.

## Shared presentation shell (D-06)

`components/ui/select.tsx` is the official shadcn Radix/nova Select, using installed Radix/Lucide. `FormSelect` preserves named FormData, controlled drafts, optional empty selections, native required validity/focus and uncontrolled resets. Transactions, reporting, Analytics, receipt review, groups and calendar month captions share it. Radix's hidden native controls remain for submission; visible dropdowns are shadcn. Calendar navigation must not intercept caption pointer events. Back-to-dashboard links share a decorative ArrowLeft.

Date controls (D-11): `components/ui/date-picker.tsx` composes the official Calendar/Popover with existing inputs and buttons. Its day/month controls keep named ISO text inputs in FormData, server validation and controlled feature-state contracts. Dashboard/filter islands remain small client controls inside server views. `lib/calendar-input.ts` bridges ISO strings and timezone-aware calendar objects without importing React; storage, aggregations, authorization and the reporting timezone remain unchanged. The first client opening initializes the calendar; retained month state lets Radix keep it through the exit animation without current-time reads during prerender. Direct year entry avoids rendering thousands of year options. Existing shared Button was preserved when importing registry components.

Toast follow-up: the root layout mounts a single client `Toaster` inside Suspense. A small form-feedback hook observes action result objects and publishes generic success/error notices without changing server authorization or auth actions. Login success follows the existing login redirect using a short-lived in-memory UI intent; no extra authentication request, URL flag, cookie or persisted token is introduced. Receipt extraction adds only a UI-result `ok` flag; extraction/review/save boundaries remain unchanged. Installed Radix supplies notification behavior with no new package.

The protected layout retains its server-side `requireUser()` and Suspense boundary, then passes minimal profile fields and server-rendered page children to `components/application-shell.tsx`. The client shell owns only navigation collapse/drawer/profile interaction. Every existing data query/action still authorizes separately. No private data is moved into shared caching or browser storage.

`app/globals.css` owns the single Frosted Glass token set and responsive shell spacing (D-10). The root server layout emits data-theme=frosted; the frosted tokens are the CSS defaults, so no preference bootstrap, client theme component or browser storage is needed. Old smart-expense-theme values are ignored. The `.dark` class remains only to support existing dark-surface utility variants. Opaque no-blur/reduced-transparency, forced-color and print fallbacks remain. `/app` hosts profile/reporting/security settings; `/analytics` is the dedicated analysis route under D-13, superseding the former dashboard anchor. Database/API boundaries are unchanged.

## D-05 extension — Monthly planning and analytics

`/budgets?month=YYYY-MM` uses thin authenticated routes and `features/budgets/` for Zod schemas, server actions, owned persistence, exact progress and forms. Budget is additive: unique owner/category/month, BIGINT whole-MMK positive limit, optimistic version, expense-category composite foreign key and owner/month index. SQL constraints enforce positive bounded amounts, positive versions and first-of-month dates. Migration `20261108000100_monthly_budgets` preserves existing records.

Dashboard grouping still executes parameterized PostgreSQL SUM and serializes monetary values as strings. A RepeatableRead transaction obtains selected/prior aggregates, recent entries, earliest ledger date and applicable budget limits. Monthly cash flow and deterministic insight calculations use bigint. Recharts Number conversions affect only coordinates; tables, tooltips, percentages and accounting stay exact. Previous-period and full-month-budget rules live beside dashboard logic. No jobs or external insight provider are added.

Transaction list count and rows share one Prisma predicate/snapshot, including literal case-insensitive merchant/note search and bigint bounds. Navigation helpers reconstruct only known validated ledger filters. Mutation ownership/version checks remain unchanged. No authentication, provider or currency strategy changes.

Status: the local MVP is covered by integration and isolated desktop/mobile Playwright checks. The native capture mismatch is not fixed; the separately requested browser runner supplies automated UI evidence. See [MVP_REVIEW.md](MVP_REVIEW.md), [DECISIONS.md](DECISIONS.md) and [SETUP.md](SETUP.md) for scope, evidence and remaining gates.

## Runtime and structure

One Next.js App Router application, one PostgreSQL database, strict TypeScript, Tailwind v4. Retain the existing Next.js 16.4.5 Cache Components and partial-prefetch configuration. Prisma CLI, Client and PostgreSQL adapter are pinned together at 7.10.1; the existing major is retained rather than moving to the Prisma 8 release candidate. Auth.js uses pinned next-auth 5.0.0-beta.32.

Routes render UI; feature modules own behavior. Server-only PrismaPg uses DATABASE_URL and a development global singleton. Prisma CLI loads DIRECT_URL from prisma.config.ts. The local migration URL normalizes localhost to IPv4 because this PostgreSQL instance does not accept IPv6 connections. No separate backend, generic repository framework, queues or client auth state store.

```text
app/                        # public auth pages, protected shell, Auth.js handlers
features/auth/              # Zod schemas, service, password hashing, throttles, actions, form
features/account/           # owned profile edits, current-password changes, settings presentation
features/transactions/      # schemas, owner-scoped store, session wrappers, actions, forms
features/dashboard/         # filters, PostgreSQL aggregation, exact summaries, Recharts views
features/analytics/         # dedicated analysis view and interactive chart-mode selection
features/receipts/          # image validation, local/cloud Ollama, suggestions, explicit review/save
features/groups/            # exact allocations, owned group ledger, balances, forms/actions
components/ui/              # shadcn/ui primitives and small shared controls
lib/                        # server env, Prisma singleton, exact money, ownership queries
prisma/                     # schema, migrations, fixed category seed
tests/                      # unit/PostgreSQL checks; http/ for real Auth.js lifecycle
types/                      # Auth.js session augmentation
```

shadcn/ui is initialized with the official CLI's Radix/nova preset and Tailwind v4 tokens. Its existing primitives support transaction and dashboard UI. Recharts 3.10.1 is pinned for the dashboard's client-side donut and monthly bar chart. Installed Next.js guides for mutations, data security and authentication with Cache Components govern framework integration.

## Input validation boundaries

Existing feature schemas remain the source of truth. Server Actions construct allowed fields and resolve the authenticated user; server-only stores validate payloads and enforce ownership before financial operations. Route/query inputs are validated before use. Native form constraints supplement these checks without being trusted as authorization.

| Boundary | Zod source |
| --- | --- |
| Registration and login | `features/auth/schemas.ts`, used by authentication services |
| Profile/password changes | `features/account/schemas.ts`, used by the owned account store |
| Transaction CRUD, dates, money and filters | `features/transactions/schemas.ts` with `lib/dates.ts` and exact `lib/money.ts` parsing |
| Dashboard/Analytics filters | `features/dashboard/filters.ts`, shared authenticated reporting loader/store |
| Budget month/limits/revisions | `features/budgets/schemas.ts`, owned budget store |
| Group participants, bills, shares and repayments | `features/groups/schemas.ts` and `calculations.ts`, owned group store |
| Receipt image/provider/configuration/review | `features/receipts/image.ts`, `provider.ts` and `schemas.ts` |
| Server configuration and Prisma connection | `lib/env.ts`; Prisma initialization reuses `databaseUrlSchema` and returns only a safe variable-name error |

`lib/validation.ts` shares bounded integer-scalar validation for pagination and transaction/group/budget revisions. Validate the input type and decimal-digit string before Number conversion, then enforce integer/range bounds. This avoids the broader JavaScript coercion performed by [Zod coercion](https://zod.dev/api#coercion), including booleans/arrays/null becoming integers. Financial amounts continue through exact string/bigint schemas. Existing route, API, auth, provider, currency and database-model decisions remain unchanged; no client cache is introduced.

## Current routes

| URL | Behavior |
| --- | --- |
| `/` | Redirect to `/dashboard`; successful login also lands there |
| `/register` | Public registration form; generic duplicate outcome |
| `/login` | Public email/password sign-in |
| `/app` | Protected profile, reporting preferences, password/security settings and POST sign-out |
| `/dashboard` | Protected financial overview, shared date/category filters, charts and recent records |
| `/analytics` | Protected cash-flow explorer, clipped month/category drill-down, comparisons and insights |
| `/transactions` | Owner-scoped list, URL filters, 20-row pagination |
| `/transactions/new` | Income/expense creation with retry key |
| `/receipts/new` | Protected temporary upload, selected Ollama extraction and editable confirmation |
| `/groups`, `/groups/new` | Owner-scoped group list and retry-safe creation with one self label |
| `/groups/[groupId]` | Participants, all bills/shares, repayment history, balances and suggested repayments |
| `/groups/[groupId]/members/new` | Add a named participant/guest |
| `/groups/[groupId]/expenses/new` | One-payer bill with exact amount or percentage shares |
| `/groups/[groupId]/expenses/[expenseId]/edit` | Atomic bill/share replacement with expected version |
| `/groups/[groupId]/settlements/new` | Confirm and record an external repayment |
| `/transactions/[id]` | Owned transaction detail and delete confirmation |
| `/transactions/[id]/edit` | Owned transaction correction with version check |
| `/api/auth/[...nextauth]` | Auth.js GET/POST protocol handlers, built-in CSRF |

The protected layout reads the session inside Suspense; every data-access wrapper/action also authorizes independently. requireUser waits for a real request before Auth.js runs cryptographic operations. No shared caching of private data. The group detail includes a confirmed bill-delete action; whole-group deletion is supported under D-07, while individual member deletion and repayment correction/deletion remain deferred.

Transaction queries/actions resolve the session on the server and call an internal server-only store with that user ID. The store validates inputs with Zod, rejects missing/deleted principals, applies owner predicates to every financial operation, validates category/type pairs, and serializes amounts/dates for UI. Store principal arguments are for trusted server callers/tests, never request-supplied identity. Create/update/delete are exposed only through authenticated Server Actions with Next.js origin checks. There is no financial REST API.

List count and page rows use one RepeatableRead snapshot, newest business date/creation time/ID first. Filters run before offset pagination; out-of-range pages clamp to the last available page. Each create form has a UUID submission key: a replay with identical persisted fields returns the same record, while changed content returns a conflict. Updates and confirmed deletions match id, ownerId and version atomically; edits increment version. Mutations revalidate transaction routes before redirecting.

## Dashboard aggregation and interaction

Dashboard and Analytics share `getReportingData`, which resolves the persisted principal and validates date/category inputs before using the existing owner-scoped store. `ReportingFilters` renders route-aware date/category controls and presets; sidebar links retain only reporting filters between these two routes. Analytics adds chart modes through a small client explorer. The shared cash-flow helper calculates cumulative net with bigint and serializes exact strings; only chart coordinates use Number. Month links and chart clicks constrain drill-down to the selected date boundaries, including partial months. Tables provide keyboard-accessible month links and exact running totals. Both report routes remain request-authorized Server Components without new API endpoints or financial caches. Transactions, confirmed receipts and budgets invalidate `/analytics` alongside the existing overview. Group operations do not enter personal reports.

The shared reporting query derives the current user through requireUser; its server-only store verifies the principal and validates inclusive date/category inputs with Zod. Parameterized Prisma.sql groups the user's Transaction rows by type, category and calendar month in PostgreSQL. SUM is cast to text to retain arbitrarily large integer aggregates; validated calendar strings are cast directly to SQL dates to avoid session-timezone shifts. One RepeatableRead transaction also fetches the latest eight matching entries and fixed expense category labels.

A small pure server aggregation derives income, expenses, balance, category totals and zero-filled month buckets from the grouped result. All authoritative values serialize as integer strings. Cards, donut, trend and recent entries use exactly the same owner/date/category predicate and snapshot. Only Recharts coordinates use approximate numbers; currency labels, tooltips, percentages and accessible tables retain exact values. No demo seed or hardcoded transaction values feed runtime charts.

The default is the current calendar month in Asia/Yangon. Shortcuts cover this month, month to date, the current and previous five calendar months through today, and year to date; custom ranges are bounded to 120 calendar months for a readable, bounded chart. Clicking a donut slice or its keyboard-accessible category button navigates to a category-filtered URL on the current report route; every section updates together. An expense-only category has zero income and a negative selected-range balance. Clicking the selected category again or clearing the filter restores all categories. Matching transaction links use the same date/category filters on the transaction list. Transaction mutations also revalidate `/dashboard` and `/analytics`.

Initial navigation has a skeleton, category transitions announce pending updates, and zero-expense ranges show meaningful empty charts with exact zero tables. Group expenses/settlements remain outside personal dashboard accounting. The original daily-trend proposal is superseded by the user's explicit monthly-trend request; no separate daily chart was added.

Only the GET filter form is keyed by the selected filters, preserving the chart component and keyboard focus across category transitions. Pending category buttons use aria-disabled plus the existing selection guard; actual disabled controls would drop focus. Tooltips stack above the decorative donut label. Fresh creation forms use their server draft UUID as a React key to prevent successful cached drafts from reusing a submission identity; failed actions keep the same mounted controlled form and expected version.

## Database model

IDs are opaque UUIDs. Business dates use PostgreSQL date; created/updated timestamps are timezone-aware instants. The schema and two committed SQL migrations are authoritative for exact fields, indexes and constraints.

| Model | Relationships and purpose |
| --- | --- |
| User | Unique normalized email, display name, Argon2id hash; owns personal Transactions, Receipts and Groups |
| Category | Fixed seeded income/expense categories; stable key; composite id/type key enforces Transaction type consistency |
| Transaction | Owner, Category, exact positive amount, MMK, business date, optional merchant/note, optional same-owner Receipt, retry key and version |
| Receipt | Owner-linked metadata only: optional suggested merchant, amount, date and category; no pixels, storage URL or raw OCR text |
| Group | Owner-managed named group; MMK; contains members, expenses and settlements |
| GroupMember | Named participant without account permissions; same-group composite key, normalized unique name and at-most-one self-member index |
| GroupExpense | One same-group payer, amount, date, retry key/version; owns ExpenseShares |
| ExpenseShare | Unique member per expense; same-group member and expense foreign keys; nonnegative owed amount |
| Settlement | Same-group sender/recipient, positive amount, date and retry key; records an external repayment and never moves money |
| AuthThrottle | HMAC-derived key, atomic attempt counter, expiry; shared login/registration limits |

User deletion and referenced member/category/group deletion are restricted while financial history exists. Expense deletion cascades its shares. Transaction/Receipt composite foreign keys reject cross-owner attachment; payer, share and settlement composite keys reject cross-group membership. A settlement cannot target its sender. Amount bounds/signs, positive versions, normalized emails and names are database-checked. Owner/date and foreign-key indexes support the planned queries.

Deferred constraint triggers require share totals to equal their GroupExpense amount at commit. Parent-row locking serializes validation; an incomplete expense or mismatched share update rolls back. Group creation atomically adds exactly one self label; the database enforces at most one. Bill creation/correction and all shares use one database transaction.

Retry keys are unique per owner/group. Personal transaction, group expense and settlement retries compare persisted payloads before returning an existing result. Group/member creation uses stable client form UUIDs as identity, scoped to the authenticated owner/group when replayed. Expense edits/deletes require an expected version.

## Group ledger and exact allocation

Only the authenticated owner manages a group; participants/guests are named labels without login privileges. Server queries/actions derive the owner from requireUser; the server-only store verifies the persisted user and scopes group reads by id/ownerId. Every mutation locks that owned Group row before membership checks and ledger writes. This serializes operations within a group, handles concurrent create retries and avoids conflicting lock order during bill/share replacement. Payer/share/settlement members must all belong to that group; existing composite foreign keys provide an additional boundary.

Money stays bigint/string in MMK. Amount shares are nonnegative whole kyat and sum exactly to a positive total. Percentages are parsed as integer basis points with up to two decimals and sum to 10000. Allocate floor(total × weight / 10000), then distribute the remaining kyat by descending remainder, ascending canonical member UUID on ties. The same pure function validates server input and previews exact amounts in React. Only allocated amounts persist; percentage-created bills reopen as exact amount splits. Maximum 50 participants; blank/unselected sharing can be represented by zero.

Group detail reads the owner-scoped members, expenses/shares and repayments in one RepeatableRead transaction. A pure calculator derives paid, owed, sent, received and net = paid − owed + sent − received; all nets must sum to zero. A deterministic debtor/creditor matching pass creates advisory "who owes whom" amounts without writes. It does not claim a globally optimal number of transfers. Histories are loaded in full for this MVP; move aggregation/pagination to PostgreSQL when group histories grow large.

Repayment confirmation records a positive completed external transfer between distinct participants, with a stable group submission key. Overpayments are allowed as actual recorded events and may reverse net balances. Editing/deleting a bill replaces/removes its shares but preserves repayment history. Individual settlements remain append-only; D-07 permits their removal only with the entire confirmed group history. No bill or repayment calls personal transaction creation or revalidates financial dashboard data; dashboard accounting remains unchanged. Group mutations revalidate /groups.

## Currency, dates, and accounting

The user confirmed MMK / 0 decimals / Asia/Yangon. Currency is an enum with one value across financial models; changing the currency requires a separate reviewed schema/data migration, not an environment toggle. Store kyat as PostgreSQL BIGINT / Prisma bigint. Parse whole-unit decimal strings, enforce 1 through 9,000,000,000,000,000 kyat for positive amounts, allow zero only for shares, and serialize bigint as strings. Financial calculations never use floating point. A future chart may convert bounded coordinates only after exact aggregation; authoritative totals/labels stay exact.

Calendar input dates must not shift with UTC conversion. Transaction, group bill and repayment forms use validated calendar strings from 1900 onward and UTC-midnight database values; the default date is today in Asia/Yangon. Personal Transactions and group expenses remain separate ledgers. Member net = paid expenses - owed shares + outgoing settlements - incoming settlements. All member nets must sum to zero. A recorded settlement adjusts obligations, not personal dashboard income/expenses or verified bank balances.

## Authentication and authorization

Registration and Credentials authorize use Zod; emails are trimmed/lowercased, names are trimmed and limited to 80 characters, passwords are 12–128 characters without trimming. Argon2id uses 19 MiB memory, two iterations and one lane, with random salts. Unknown users incur password verification against a dummy hash. Duplicate registration has the same public success result; a database unique constraint handles concurrent requests.

Fixed 15-minute windows allow five attempts per email/action and 500 total per action across processes, stored as atomic PostgreSQL counters with HMAC keys. Expired counters are cleaned opportunistically. These limits protect the minimal foundation; tune deployment abuse policy deliberately.

Auth.js issues encrypted JWTs in HttpOnly, SameSite=Lax, Path=/ cookies; Secure and the __Secure- prefix apply on HTTPS. Production requires HTTPS AUTH_URL. JWT session lifetime is eight hours and can refresh on session access. Tokens contain the user ID, session version and Auth.js lifecycle claims; password hashes never enter tokens or client results. Logout uses POST and clears the current cookie. A successful password change increments the persisted version and revokes all previous sessions on their next authenticated request (D-09); there is no individual-device session inventory. Each JWT refresh and protected query checks the persisted user; deleted users lose access.

requireUser() reads auth(), verifies the user in PostgreSQL, and returns a safe projection. Every public data helper/action derives ownerId there and scopes queries by both record ID and owner (or the owning Group). Category data is fixed/read-only. Transaction writes use owner/version predicates; future group/settlement writes must enforce equivalent checks. Knowing an ID is never authorization.

Server Actions use Next.js origin checks; direct Auth.js POST routes use its CSRF mechanism. Callback destinations are restricted to the canonical origin and /dashboard, /app or /login; the dashboard is the default signed-in destination. Authentication logging is generic; configuration validation reports names of invalid variables, not values. No authentication tokens are stored in localStorage or sessionStorage.

## Receipt and deployment boundaries

Receipt extraction uses authenticated Server Actions and the existing origin checks. The image limit is 4,000,000 bytes (4 MB); the action body limit is 4,400,000 bytes to allow multipart/review overhead below Vercel's 4.5 MB ceiling (D-08). Shared client/server constants align accepted MIME types, byte limit and validation text; native client validity blocks oversized uploads before transmission, while server validation remains authoritative. Sharp 0.35.5 is a direct dependency for full decoding, signature/MIME agreement, 20-megapixel and single-frame limits, metadata stripping and a maximum 2400px side before inference. No image is written to disk or PostgreSQL. Existing AuthThrottle counters also bound receipt extraction attempts.

The server-only ReceiptExtractor accepts prepared bytes and expense category IDs/names. Its Ollama adapter selects server configuration using RECEIPT_PROVIDER, defaulting to ollama-local. Local mode retains loopback HTTP only, rejected cloud model suffixes, Zod-derived JSON-schema output, default gemma3:4b and a 120-second timeout. Optional ollama-cloud pins HTTPS to https://ollama.com/api/chat, authenticates with a private OLLAMA_API_KEY, requires an explicit vision-capable API model name, ignores OLLAMA_BASE_URL and times out after 60 seconds. Cloud currently lacks structured-output enforcement: omit format, prompt for the same JSON schema and strictly validate complete JSON (optionally one JSON code fence). Both modes send base64 prepared pixels, use non-streaming uncached requests, reject redirects and bound responses to 64 KiB. Incomplete/invalid responses and upstream errors become sanitized review-safe messages. No automatic retries, provider SDK, client key or silent provider fallback is added. The client receives only a public boolean for the selected mode's privacy/loading text.

Zod checks all output and blanks uncertain/invalid fields. Currency never defaults to MMK; unsupported/unknown currency also blanks amount. React holds editable suggestions only in memory. A separately authenticated action validates explicit confirmation/currency and delegates to the existing owned EXPENSE creation path with a stable per-review UUID retry key. It ignores submitted identity by constructing only allowed fields, revalidates transactions/dashboard, and redirects to the saved transaction. Reviewed transaction fields are the sole persistence; Receipt metadata remains unused. No schema/migration change. Mock transport/service tests and real HTTP confirmation cover this boundary; real OCR quality is a manual prerequisite.

Image retention, shared group-account access and payment execution remain absent.

Receipt precision follow-up: normalize only explicit kyat aliases to the existing MMK value. Receipt-only numeric normalization maps Myanmar digits, validates comma/space grouping and removes one/two zero decimal places using strings before the existing bigint parser. It never rounds fractions, repairs unclear digits or changes manual-entry money rules. The concise local model prompt names kyat labels and an exact grouping example; the output contract and uncertainty checks are unchanged. A client-side, collapsible image preview uses a temporary object URL, revoked on replacement/effect cleanup, with a keyboard-scrollable region for long receipts. Preview pixels never pass through Next image optimization or browser storage. Cache Components may retain an unsaved selected File in browser memory until the draft is replaced/reloaded; successful save invalidates the draft. Existing review fields remain unchanged until replacement extraction succeeds.

No hosting provider is selected or provisioned. Production TLS, trusted reverse proxy configuration, backups/restores and secrets management require verification before a separately authorized launch. Tests simulate HTTPS cookie behavior over loopback and cannot prove browser TLS or production infrastructure. SETUP.md records manual checks and official sources.
