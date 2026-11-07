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

Status: Accepted for the schema on 2026-11-06; group UI, percentage/amount splits and recorded repayments explicitly authorized in the subsequent Smart Group Splitting request (implemented 2026-11-08).

Define User, Category, Transaction, Receipt, Group, GroupMember, GroupExpense, ExpenseShare and Settlement. GroupExpense/ExpenseShare replace the initial proposed Bill/BillShare names. Add AuthThrottle as the authentication support table. Owner-managed member labels and a separate group ledger follow the existing planned scope; collaboration/invitations remain absent.

Receipt stores owner-linked metadata only; receipt extraction/review is covered by D-04. Settlement records an external repayment between distinct members of the same group. Group services now record repayments; no settlement changes personal transaction totals or moves money.

Owner-managed participants, including guests, remain labels without account access. The new request authorizes these existing boundaries, not shared editing/invitations. Group creation adds exactly one self label; groups use MMK/0/Asia/Yangon. Existing same-group/owner foreign keys, amount checks and deferred share-total checks remain authoritative; no schema migration or dependency is needed for this milestone.

Amount shares must exactly match the bill. Percentages use up to two decimals, integer basis points totaling 10000, and largest-remainder allocation with canonical member UUID tie-breaking. Only resulting exact kyat shares persist; editing a percentage-created bill starts from its saved amount shares. A shared pure calculator powers server validation, preview and tests.

Every public query/action resolves the persisted authenticated owner. Group-row locks serialize member, expense and settlement mutations; bill/share replacement is atomic and version-checked. Creation uses stable UUID identity (group/member) or existing group submission keys (bills/settlements), matching persisted payloads on retries. Balances are recomputed from one RepeatableRead snapshot; no cached balance counters or duplicated personal transactions. Suggested repayments use deterministic debtor/creditor matching and are not a promise of globally minimal transfer count.

Repayments record completed external events and are append-only in this MVP. Positive amounts beyond current debt are allowed and may reverse obligations; editing/deleting bills retains those historical repayments. No bank/payment integration, group/member deletion or settlement correction UI. Up to 50 participants are supported; full ledger loading is a documented MVP limit for future pagination/SQL aggregation.

At the group implementation handoff the user selected "Keep live UI testing pending until capture is fixed" after native capture/input targeting was rejected. The later final-review request explicitly authorizes Playwright E2E tests. Isolated Chromium now provides desktop/mobile browser, screenshot and keyboard evidence independently of the personal browser; the native mismatch itself remains unfixed and manual assistive-technology checks remain open.

## D-04 — Receipt OCR and retention

Status: Accepted for receipt implementation, 2026-11-07. User response: "Local Ollama vision (free; local runtime required)".

This supersedes the browser OCR proposal. Authenticated Server Actions accept static JPG/PNG/WebP up to 10 MiB / 20 megapixels; Sharp validates signatures, decodes, strips metadata, orients and bounds pixels before loopback-only Ollama extraction. Use its current /api/chat JSON-schema format, with gemma3:4b as the configurable local vision default. No paid API, image retention, raw OCR persistence or provider SDK is needed. Configure Ollama itself with cloud disabled; run it on the same trusted machine as Next.js. A remote/cloud deployment needs a subsequent decision.

The server-only ReceiptExtractor function is the provider seam. Zod validates structured output; missing, uncertain, invalid dates/categories and non-whole-kyat totals become null for review. Unknown/non-MMK currency clears the suggested amount; no currency is assumed or converted. Reviewed fields must be explicitly confirmed with currency MMK before the existing owner-scoped, exact-money, retry-safe expense creation path runs. Saving persists only reviewed transaction fields; the optional Receipt metadata model remains unused, avoiding redundant suggestions and additional retention. All suggestions/images are otherwise transient; no migration is needed.

Tradeoffs: the model/runtime download and suitable local hardware are prerequisites. A 120-second timeout, 64 KiB response cap, 1024-token generation cap and shared five-per-user/500-global attempts per 15 minutes bound extraction; there is no queue or background job. App requests/logs do not retain images or raw output. Operating-system memory, operator-configured Ollama/debug logs and crash dumps remain the host operator's responsibility. Real receipt accuracy/performance and browser visual checks require separate manual verification; mocks do not prove OCR quality.

## Implementation note — Local migrations

PostgreSQL accepts IPv4 but times out on IPv6. Prisma's schema engine failed on localhost even though PrismaPg queries succeeded. The CLI config still reads DIRECT_URL and normalizes only localhost to 127.0.0.1 in memory; remote connections and stored credentials are unchanged. Migrations were applied using the direct connection, without resets or granting superuser privileges.

## Approval boundary

Foundation, transactions, dashboard, local receipt review, owner-managed group splitting and external repayment recording are authorized. Ask before changing currency/accounting, adding shared account membership, retaining images, changing the auth/session strategy, introducing paid/remote extraction services, destructive data changes or deployment.

## Transaction milestone — 2026-11-06

The user explicitly requested transaction create/view/edit/delete, filtering, pagination, shadcn/ui, local-only samples and authorization tests, excluding dashboard charts. This authorizes the transaction milestone without changing MMK/0/Asia/Yangon or the financial schema. Use the official shadcn Radix/nova components, server-derived ownership, retry keys and version checks already prepared by the foundation. Samples require explicit development opt-in and a localhost smart_expense_db target, attach to an existing chosen local account and do not rewrite existing records. No migration or dashboard work is needed for this scope.

## Dashboard milestone — 2026-11-06

The user explicitly requested Recharts/shadcn visualization, summary cards, interactive expense categories, monthly trends, date ranges, recent transactions and aggregation tests. Monthly buckets supersede the initial daily-trend proposal. The current calendar month remains the default. Category selection scopes every dashboard section consistently, including income/balance; the UI explains the expense-only meaning and offers clearing/switching categories. Server-side parameterized PostgreSQL grouping and exact integer arithmetic preserve the approved accounting rules. No schema/currency/session-strategy change or runtime demo data is introduced. Browser-only visual/interaction verification remains manual because the browser access host was unavailable.

## Final quality review — 2026-11-08

The user requests a final MVP quality review, implementation-defect fixes, integration/Playwright tests, responsiveness/accessibility verification and a prioritized remaining-issues report, with no deployment/push. Test-only Playwright/axe and in-memory self-signed TLS tooling support an isolated production-server/browser harness. shadcn 4.23.0 remains the same version and is now pinned as build/development tooling; Prisma/Next/Auth.js versions, currency, ownership and JWT strategy are unchanged. Browser/state/focus/contrast fixes do not expand product scope. AUTH_URL now enforces the documented origin-only contract. See MVP_REVIEW for executed evidence, the limited synthetic Ollama benchmark and remaining release/manual gates.
