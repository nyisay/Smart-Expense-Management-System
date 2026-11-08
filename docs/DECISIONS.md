# Decision log

## D-08 — Optional Ollama Cloud receipt extraction and hosted upload limit

Status: Accepted on 2026-11-09. The user selected “Ollama Cloud — hosted version of the current provider” and then instructed “perform step 6”, referring to the proposed cloud adapter and Vercel-compatible upload limit. This supersedes D-04's local-only restriction for an explicitly configured cloud mode. It does not authorize deployment, a push, a commit, image retention, or changes to financial calculations.

Keep local Ollama as the default (`RECEIPT_PROVIDER=ollama-local`); require explicit `ollama-cloud`, a private `OLLAMA_API_KEY` and an image-capable `OLLAMA_MODEL` for cloud processing. Pin cloud requests to https://ollama.com/api/chat; reject redirects and never send credentials to a configurable host. Cloud mode ignores the local base URL. Missing/invalid settings fail closed without fallback or automatic retries. The UI discloses external processing before upload. The application does not retain images; Ollama's processing/privacy terms apply externally.

Ollama Cloud currently lacks enforced structured outputs. Prompt for the existing JSON contract, accept only complete JSON or one complete JSON code fence, then use strict Zod validation and the existing uncertainty/currency/date normalization. Preserve explicit editable confirmation and authenticated expense creation. Keep local JSON-schema format. Cap cloud requests at 60 seconds, local requests at 120 seconds, and provider responses at 64 KiB. Return sanitized errors for denied access, quota, timeouts and invalid output.

Limit all receipt uploads to 4,000,000 bytes (decimal 4 MB) in shared client/server configuration. Limit Server Action bodies to 4,400,000 bytes, below Vercel's 4.5 MB payload ceiling, with room for normal multipart/review overhead. This intentionally replaces the earlier 10 MiB limit; larger images must be cropped/compressed before upload. Maintain decoding, signature/MIME agreement, 20-megapixel, single-frame and metadata-removal checks. Cloud account/model availability, function timeout configuration and real receipt quality require separate deployment verification; automated tests use mocks.

References: [Ollama Cloud](https://docs.ollama.com/cloud), [structured-output limitation](https://docs.ollama.com/capabilities/structured-outputs), [Vercel function limits](https://vercel.com/docs/functions/limitations).

## D-07 — Confirmed deletion of an entire owned group history

Status: Accepted on 2026-11-08. In response to the scope question, the user explicitly selected “Previous groups from the Groups & Splitting list, including their bills and repayments”. This supersedes D-03's deferral of whole-group deletion only; individual member deletion and repayment correction/deletion remain deferred.

Add a trash-icon Delete group action to each owned group card. Confirmation identifies the group and participant/bill/repayment counts, states that deletion is permanent, and explains that deleting records does not refund external payments. Cancel is the initial focus. No existing real group is deleted by setup or agent tooling; the action executes only after the owner's confirmation.

The server requires the authenticated persisted owner, Zod-valid group ID/revision/confirmation and the existing owned-group row lock. Delete repayments, bills (whose shares already cascade), participants and the group in one transaction. Existing foreign keys, schema and accounting remain unchanged; personal transactions and other groups must survive.

Use existing Group.updatedAt as a deletion revision. Successful group mutations advance it monotonically inside the group lock, including rapid successive writes. A confirmation opened before a change is rejected and requires reload. Independent bill deletion still preserves repayments. Removing a whole group removes its complete local ledger and does not execute or reverse a payment.

## D-06 — Dark workspace shell and two appearance themes

Status: Accepted by the user's explicit dark/frosted redesign request on 2026-11-08. This supersedes the earlier light-default glass presentation decision because the user now requests two dark variants and persistent sidebar navigation. Accounting, routes, models, authentication and extraction decisions are unchanged.

Default to Dark Base; Frosted Glass adds restrained translucent surfaces and ambient color with the same typography/layout. Central CSS tokens control both. Store only the appearance preference in browser localStorage; an early fixed inline script applies a recognized theme before paint, with a safe default if storage is unavailable. No authentication material is stored there.

Place the shared shell inside the existing authenticated protected layout. Use installed Radix Dialog/Tooltip/DropdownMenu and existing shadcn buttons/selects; a shadcn Sidebar file was not present, so no new component package or dependency is required. Preserve independent server authorization in every existing operation. Desktop uses a reserved collapsible grid column; mobile uses a focus-managed drawer. Analytics links to the existing dashboard analytics anchor; Settings links to the existing `/app` account/appearance view. No empty standalone feature page or dead navigation link is introduced.

Keep financial charts and values sourced from existing queries. Reorder presentation, add the already-computed savings rate to summary cards and present recent entries as a desktop table/mobile list. Both variants retain exact labels/tables, accessible controls, reduced motion/transparency, opaque no-blur fallbacks and forced-color support. No new financial behavior, paid provider, deployment, push or commit is authorized by this presentation milestone.

## D-05 — Budgets, analytics, ledger search and rule-based insights

Status: Accepted through the user's request to improve these four features on 2026-11-08. The user explicitly selected “Independent monthly budgets; no rollover” and “Aligned calendar months; equal-length custom ranges” in the follow-up answers.

Add one owner/category/calendar-month Budget with a positive exact whole-MMK limit. No rollover or prorating. An absent limit means unbudgeted, not zero. Actuals include the entire selected calendar month of personal expenses, including reviewed receipt transactions, excluding group records. Removing a limit never removes transactions. Use optimistic versions, stable row identity and a database uniqueness constraint. This additive schema change preserves existing records and accounting decisions.

Dashboard monthly income/expense/net buckets share authenticated PostgreSQL aggregation and date/category filters. Calendar-month views compare with the previous calendar month; month-to-date aligns through the same day, clamped to the previous month's last day. Other custom ranges compare with the immediately preceding equal number of inclusive calendar days. Suppress conclusions for future-ending ranges, absent earlier history or no prior-period records. Disclose that recorded entries do not prove complete history.

Ledger search matches literal, case-insensitive merchant/note text up to 100 characters. Inclusive amount bounds accept exact nonnegative whole MMK within the existing entry limit. Preserve validated filter/page context through list, detail, edit, cancel, save and delete. Reconstruct internal return URLs from validated known fields.

Insights use deterministic arithmetic: largest expense category, signed cash-flow savings rate, comparable expense change and budget threshold notices. Savings rate is unavailable with zero selected income; relative expense change is unavailable with zero prior expenses. Budget warnings begin at 80%, with reached/overspent states. Dashboard notices share the category scope and snapshot only for a full single month; partial/multi-month ranges link to full-month budgeting. No scheduled notifications, AI provider, bank-balance claims or new dependency is introduced. Other audit roadmap items retain their approval gates.

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

## Receipt precision follow-up — 2026-11-08

The user explicitly requested more accurate receipt upload/extraction and recognition that “ks” means kyat/MMK (their “mkks” spelling is accepted as an explicit receipt alias). This authorizes the bounded receipt fix, not the unapproved audit roadmap. Keep the same local Ollama provider/model, MMK/0/Asia/Yangon, privacy boundaries and explicit confirmation. Normalize only clear currency labels and exact printed numeric formatting; ambiguous values remain null rather than estimated. Add an in-memory source preview and targeted regressions. No currency/schema/session/provider change or image retention is approved or introduced.

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
