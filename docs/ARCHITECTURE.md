# Architecture

Status: foundation, transactions, dashboard and local receipt extraction/review. Group/settlement flows are not implemented. See [DECISIONS.md](DECISIONS.md) for scope and [SETUP.md](SETUP.md) for commands and verification.

## Runtime and structure

One Next.js App Router application, one PostgreSQL database, strict TypeScript, Tailwind v4. Retain the existing Next.js 16.4.5 Cache Components and partial-prefetch configuration. Prisma CLI, Client and PostgreSQL adapter are pinned together at 7.10.1; the existing major is retained rather than moving to the Prisma 8 release candidate. Auth.js uses pinned next-auth 5.0.0-beta.32.

Routes render UI; feature modules own behavior. Server-only PrismaPg uses DATABASE_URL and a development global singleton. Prisma CLI loads DIRECT_URL from prisma.config.ts. The local migration URL normalizes localhost to IPv4 because this PostgreSQL instance does not accept IPv6 connections. No separate backend, generic repository framework, queues or client auth state store.

```text
app/                        # public auth pages, protected shell, Auth.js handlers
features/auth/              # Zod schemas, service, password hashing, throttles, actions, form
features/transactions/      # schemas, owner-scoped store, session wrappers, actions, forms
features/dashboard/         # filters, PostgreSQL aggregation, exact summaries, Recharts views
features/receipts/          # image validation, local provider, suggestions, explicit review/save
components/ui/              # official shadcn/ui primitives
lib/                        # server env, Prisma singleton, exact money, ownership queries
prisma/                     # schema, migrations, fixed category seed
tests/                      # unit/PostgreSQL checks; http/ for real Auth.js lifecycle
types/                      # Auth.js session augmentation
```

shadcn/ui is initialized with the official CLI's Radix/nova preset and Tailwind v4 tokens. Its existing primitives support transaction and dashboard UI. Recharts 3.10.1 is pinned for the dashboard's client-side donut and monthly bar chart. Installed Next.js guides for mutations, data security and authentication with Cache Components govern framework integration.

## Current routes

| URL | Behavior |
| --- | --- |
| `/` | Redirect to `/dashboard`; successful login also lands there |
| `/register` | Public registration form; generic duplicate outcome |
| `/login` | Public email/password sign-in |
| `/app` | Protected account-ready placeholder and POST sign-out form |
| `/dashboard` | Protected financial overview, shared date/category filters, charts and recent records |
| `/transactions` | Owner-scoped list, URL filters, 20-row pagination |
| `/transactions/new` | Income/expense creation with retry key |
| `/receipts/new` | Protected temporary upload, local extraction and editable confirmation |
| `/transactions/[id]` | Owned transaction detail and delete confirmation |
| `/transactions/[id]/edit` | Owned transaction correction with version check |
| `/api/auth/[...nextauth]` | Auth.js GET/POST protocol handlers, built-in CSRF |

The protected layout reads the session inside Suspense; every data-access wrapper/action also authorizes independently. requireUser waits for a real request before Auth.js runs cryptographic operations. No shared caching of private data. Future receipt/group routes remain as described in REQUIREMENTS and TASKS.

Transaction queries/actions resolve the session on the server and call an internal server-only store with that user ID. The store validates inputs with Zod, rejects missing/deleted principals, applies owner predicates to every financial operation, validates category/type pairs, and serializes amounts/dates for UI. Store principal arguments are for trusted server callers/tests, never request-supplied identity. Create/update/delete are exposed only through authenticated Server Actions with Next.js origin checks. There is no financial REST API.

List count and page rows use one RepeatableRead snapshot, newest business date/creation time/ID first. Filters run before offset pagination; out-of-range pages clamp to the last available page. Each create form has a UUID submission key: a replay with identical persisted fields returns the same record, while changed content returns a conflict. Updates and confirmed deletions match id, ownerId and version atomically; edits increment version. Mutations revalidate transaction routes before redirecting.

## Dashboard aggregation and interaction

The public dashboard query derives the current user through requireUser; its server-only store verifies the principal and validates inclusive date/category inputs with Zod. Parameterized Prisma.sql groups the user's Transaction rows by type, category and calendar month in PostgreSQL. SUM is cast to text to retain arbitrarily large integer aggregates; validated calendar strings are cast directly to SQL dates to avoid session-timezone shifts. One RepeatableRead transaction also fetches the latest eight matching entries and fixed expense category labels.

A small pure server aggregation derives income, expenses, balance, category totals and zero-filled month buckets from the grouped result. All authoritative values serialize as integer strings. Cards, donut, trend and recent entries use exactly the same owner/date/category predicate and snapshot. Only Recharts coordinates use approximate numbers; currency labels, tooltips, percentages and accessible tables retain exact values. No demo seed or hardcoded transaction values feed runtime charts.

The default is the current calendar month in Asia/Yangon. Shortcuts cover this month, the current and previous five calendar months through today, and year to date; custom ranges are bounded to 120 calendar months for a readable, bounded chart. Clicking a donut slice or its keyboard-accessible category button navigates to a category-filtered dashboard URL; every section updates together. An expense-only category has zero income and a negative selected-range balance. Clicking the selected category again or clearing the filter restores all categories. View all links to the same date/category filters on the transaction list. Transaction mutations also revalidate /dashboard.

Initial navigation has a skeleton, category transitions announce pending updates, and zero-expense ranges show meaningful empty charts with exact zero tables. Group expenses/settlements remain outside personal dashboard accounting. The original daily-trend proposal is superseded by the user's explicit monthly-trend request; no separate daily chart was added.

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

Deferred constraint triggers require share totals to equal their GroupExpense amount at commit. Parent-row locking serializes validation; an incomplete expense or mismatched share update rolls back. Create/correct expenses and all shares within one database transaction. Exactly one self member must be supplied by future group creation logic; the database currently enforces at most one. There is no group-creation endpoint in this foundation.

Retry keys are unique per owner/group. Personal transaction retries and optimistic conflicts are implemented; group/settlement mutation services remain future work.

## Currency, dates, and accounting

The user confirmed MMK / 0 decimals / Asia/Yangon. Currency is an enum with one value across financial models; changing the currency requires a separate reviewed schema/data migration, not an environment toggle. Store kyat as PostgreSQL BIGINT / Prisma bigint. Parse whole-unit decimal strings, enforce 1 through 9,000,000,000,000,000 kyat for positive amounts, allow zero only for shares, and serialize bigint as strings. Financial calculations never use floating point. A future chart may convert bounded coordinates only after exact aggregation; authoritative totals/labels stay exact.

Calendar input dates must not shift with UTC conversion. Transaction form dates use validated calendar strings from 1900 onward and UTC-midnight database values; the default date is today in Asia/Yangon. Personal Transactions and group expenses remain separate ledgers. Future member net = paid expenses - owed shares + outgoing settlements - incoming settlements. All member nets must sum to zero. A recorded settlement adjusts obligations, not personal dashboard income/expenses or verified bank balances.

## Authentication and authorization

Registration and Credentials authorize use Zod; emails are trimmed/lowercased, names are trimmed and limited to 80 characters, passwords are 12–128 characters without trimming. Argon2id uses 19 MiB memory, two iterations and one lane, with random salts. Unknown users incur password verification against a dummy hash. Duplicate registration has the same public success result; a database unique constraint handles concurrent requests.

Fixed 15-minute windows allow five attempts per email/action and 500 total per action across processes, stored as atomic PostgreSQL counters with HMAC keys. Expired counters are cleaned opportunistically. These limits protect the minimal foundation; tune deployment abuse policy deliberately.

Auth.js issues encrypted JWTs in HttpOnly, SameSite=Lax, Path=/ cookies; Secure and the __Secure- prefix apply on HTTPS. Production requires HTTPS AUTH_URL. JWT session lifetime is eight hours and can refresh on session access. Tokens contain only the user ID plus Auth.js lifecycle claims; password hashes never enter tokens or client results. Logout uses POST and clears the current cookie; stolen-token immediate revocation is absent. Each JWT refresh and protected query checks the persisted user; deleted users lose access.

requireUser() reads auth(), verifies the user in PostgreSQL, and returns a safe projection. Every public data helper/action derives ownerId there and scopes queries by both record ID and owner (or the owning Group). Category data is fixed/read-only. Transaction writes use owner/version predicates; future group/settlement writes must enforce equivalent checks. Knowing an ID is never authorization.

Server Actions use Next.js origin checks; direct Auth.js POST routes use its CSRF mechanism. Callback destinations are restricted to the canonical origin and /dashboard, /app or /login; the dashboard is the default signed-in destination. Authentication logging is generic; configuration validation reports names of invalid variables, not values. No authentication tokens are stored in localStorage or sessionStorage.

## Receipt and deployment boundaries

Receipt extraction uses authenticated Server Actions and the existing origin checks. The action body limit is 11 MiB for multipart overhead; the image itself is limited to 10 MiB. Sharp 0.35.5 is a direct dependency for full decoding, signature/MIME agreement, 20-megapixel and single-frame limits, metadata stripping and a maximum 2400px side before inference. No image is written to disk or PostgreSQL. Existing AuthThrottle counters also bound receipt extraction attempts.

The server-only ReceiptExtractor accepts prepared bytes and expense category IDs/names. Its Ollama adapter sends a non-streaming /api/chat request with Zod-derived JSON schema and base64 pixels; fetch is uncached, redirects rejected, loopback HTTP URLs only, cloud model suffixes rejected, timeout 120 seconds and response at most 64 KiB. gemma3:4b is the default; the host must install it and disable Ollama cloud features. There is no paid API key or client provider configuration.

Zod checks all output and blanks uncertain/invalid fields. Currency never defaults to MMK; unsupported/unknown currency also blanks amount. React holds editable suggestions only in memory. A separately authenticated action validates explicit confirmation/currency and delegates to the existing owned EXPENSE creation path with a stable per-review UUID retry key. It ignores submitted identity by constructing only allowed fields, revalidates transactions/dashboard, and redirects to the saved transaction. Reviewed transaction fields are the sole persistence; Receipt metadata remains unused. No schema/migration change. Mock transport/service tests and real HTTP confirmation cover this boundary; real OCR quality is a manual prerequisite.

Group/settlement forms, image retention and payment execution remain absent.

No hosting provider is selected or provisioned. Production TLS, trusted reverse proxy configuration, backups/restores and secrets management require verification before a separately authorized launch. Tests simulate HTTPS cookie behavior over loopback and cannot prove browser TLS or production infrastructure. SETUP.md records manual checks and official sources.
