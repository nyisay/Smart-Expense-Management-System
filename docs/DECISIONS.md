# Decision log

The user's 2026-11-06 request explicitly authorizes database models, migration and authentication implementation, while excluding dashboard and receipt features. Their follow-up confirms MMK / 0 decimals / Asia/Yangon. Earlier planning-only restrictions are superseded for this scope. Future architectural changes still need approval.

## D-01 — Single application and authentication foundation

Status: Accepted for the database/authentication foundation, 2026-11-06.

One Next.js application with feature-owned server queries/actions, PostgreSQL/PrismaPg, Node.js Argon2id, Auth.js Credentials/JWT sessions and shared database throttling. Keep the existing Cache Components configuration, placing request-dependent reads inside Suspense. The user explicitly requested these foundation capabilities; this is not approval for subsequent feature work.

Retain/pin existing Prisma 7.10.1 CLI, Client and adapter together, following official Prisma 7 documentation. Do not upgrade the major as a side effect of setup. Auth.js App Router API uses pinned next-auth 5.0.0-beta.32, installed from its documented beta channel and covered by lifecycle tests. The beta dependency is an intentional compatibility boundary.

Tradeoff: minimal deployment and no separate API service; JWT logout clears the browser cookie rather than immediately revoking stolen tokens. Persisted-user checks deny deleted users. Password recovery and email verification are outside this task.

## D-02 — Exact money and reporting

Status: Accepted, 2026-11-06. User response: "MMK / 0 decimals / Asia/Yangon".

Use MMK-only schema enum values, whole-kyat BIGINT storage, bigint arithmetic, string serialization, and calendar business dates. Reporting timezone is Asia/Yangon. Bound positive values to 9,000,000,000,000,000 kyat; shares may be zero. A currency change requires a reviewed schema/data migration. No exchange conversion, fractional kyat, opening balance or bank-account ledger.

Why: keeps precision exact and rejects mixed-currency sums. Tradeoff: deliberate serialization and bounded chart conversion are required.

## D-03 — Financial model names and boundaries

Status: Revised and accepted for schema preparation by the user's explicit model list, 2026-11-06.

Define User, Category, Transaction, Receipt, Group, GroupMember, GroupExpense, ExpenseShare and Settlement. GroupExpense/ExpenseShare replace the initial proposed Bill/BillShare names. Add AuthThrottle as the authentication support table. Owner-managed member labels and a separate group ledger follow the existing planned scope; collaboration/invitations remain absent.

Receipt stores owner-linked metadata only; no image storage, raw OCR text or processing flow. Settlement records an external repayment between distinct members of the same group. Its model is included now, superseding the earlier proposal to defer the model; recording UI and financial write services remain future work. No settlement changes personal transaction totals.

Tradeoff: schema preparation is available without building those features. Same-group/owner foreign keys, amount checks and deferred share-total validation protect future writes, but future services still need authorization, retry-payload checks and optimistic conflict handling.

## D-04 — Receipt OCR and retention

Status: Accepted for receipt implementation, 2026-11-07. User response: "Local Ollama vision (free; local runtime required)".

This supersedes the browser OCR proposal. Authenticated Server Actions accept static JPG/PNG/WebP up to 10 MiB / 20 megapixels; Sharp validates signatures, decodes, strips metadata, orients and bounds pixels before loopback-only Ollama extraction. Use its current /api/chat JSON-schema format, with gemma3:4b as the configurable local vision default. No paid API, image retention, raw OCR persistence or provider SDK is needed. Configure Ollama itself with cloud disabled; run it on the same trusted machine as Next.js. A remote/cloud deployment needs a subsequent decision.

The server-only ReceiptExtractor function is the provider seam. Zod validates structured output; missing, uncertain, invalid dates/categories and non-whole-kyat totals become null for review. Unknown/non-MMK currency clears the suggested amount; no currency is assumed or converted. Reviewed fields must be explicitly confirmed with currency MMK before the existing owner-scoped, exact-money, retry-safe expense creation path runs. Saving persists only reviewed transaction fields; the optional Receipt metadata model remains unused, avoiding redundant suggestions and additional retention. All suggestions/images are otherwise transient; no migration is needed.

Tradeoffs: the model/runtime download and suitable local hardware are prerequisites. A 120-second timeout, 64 KiB response cap, 1024-token generation cap and shared five-per-user/500-global attempts per 15 minutes bound extraction; there is no queue or background job. App requests/logs do not retain images or raw output. Operating-system memory, operator-configured Ollama/debug logs and crash dumps remain the host operator's responsibility. Real receipt accuracy/performance and browser visual checks require separate manual verification; mocks do not prove OCR quality.

## Implementation note — Local migrations

PostgreSQL accepts IPv4 but times out on IPv6. Prisma's schema engine failed on localhost even though PrismaPg queries succeeded. The CLI config still reads DIRECT_URL and normalizes only localhost to 127.0.0.1 in memory; remote connections and stored credentials are unchanged. Migrations were applied using the direct connection, without resets or granting superuser privileges.

## Approval boundary

The foundation, transaction milestone, dashboard and local receipt extraction/review are authorized. Group management and settlement UI remain unimplemented. Ask before changing currency/accounting, adding shared account membership, retaining images, changing the auth/session strategy, introducing paid/remote extraction services, destructive data changes or deployment.

## Transaction milestone — 2026-11-06

The user explicitly requested transaction create/view/edit/delete, filtering, pagination, shadcn/ui, local-only samples and authorization tests, excluding dashboard charts. This authorizes the transaction milestone without changing MMK/0/Asia/Yangon or the financial schema. Use the official shadcn Radix/nova components, server-derived ownership, retry keys and version checks already prepared by the foundation. Samples require explicit development opt-in and a localhost smart_expense_db target, attach to an existing chosen local account and do not rewrite existing records. No migration or dashboard work is needed for this scope.

## Dashboard milestone — 2026-11-06

The user explicitly requested Recharts/shadcn visualization, summary cards, interactive expense categories, monthly trends, date ranges, recent transactions and aggregation tests. Monthly buckets supersede the initial daily-trend proposal. The current calendar month remains the default. Category selection scopes every dashboard section consistently, including income/balance; the UI explains the expense-only meaning and offers clearing/switching categories. Server-side parameterized PostgreSQL grouping and exact integer arithmetic preserve the approved accounting rules. No schema/currency/session-strategy change or runtime demo data is introduced. Browser-only visual/interaction verification remains manual because the browser access host was unavailable.
