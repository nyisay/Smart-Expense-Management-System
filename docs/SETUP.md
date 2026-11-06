# Local setup and verification

## Prerequisites and environment

Use Node.js 22.21 or a compatible Node 22 release, npm, and PostgreSQL. The installed Prisma CLI/Client/adapter versions are pinned together at 7.10.1; Auth.js uses `next-auth` 5.0.0-beta.32. The beta release is locked and covered by HTTP lifecycle tests; review upgrades deliberately.

Copy `.env.example` to `.env` only when no local environment file already exists. Replace the placeholders locally. Never commit or paste real connection values, tokens, passwords, or the auth secret into documentation/chat.

| Variable | Meaning |
| --- | --- |
| DATABASE_URL | PostgreSQL connection for PrismaPg application queries |
| DIRECT_URL | Direct PostgreSQL connection for Prisma CLI migrations |
| AUTH_SECRET | Cryptographically random secret, at least 32 characters; stable across restarts/instances |
| AUTH_URL | Canonical application origin: local HTTP during development, HTTPS in production |
| OLLAMA_BASE_URL | Optional server-only loopback HTTP origin; default http://127.0.0.1:11434 |
| OLLAMA_MODEL | Optional local vision model; default gemma3:4b; cloud suffixes rejected |

The application validates server configuration without printing its values. The checked-in example is deliberately unusable until placeholders are replaced. The local foundation task generated AUTH_SECRET and added a local AUTH_URL only when missing; existing database credentials were preserved.

The configured local database is `smart_expense_db`, role `expense_app`, port 5432. Prisma CLI reads DIRECT_URL. For this IPv4-only local server, `prisma.config.ts` maps a `localhost` hostname to `127.0.0.1` in memory; remote hosts are unchanged. The application continues reading DATABASE_URL as configured. URL-encode special characters in passwords. Migrations need schema CREATE/ALTER privileges; do not grant application runtime roles superuser permissions.

## Install, migrate, seed, run

```powershell
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Visit `/register` and `/login`. `/` and successful login lead to the protected `/dashboard`; anonymous visitors are redirected to login. `/app` remains the account page with sign-out and links to transactions/dashboard. The category seed is idempotent and only adds missing fixed categories; it does not reset financial data.

`/app` links to `/transactions`. Transaction list, detail, create and edit routes are protected. The list supports income/expense, category and inclusive from/to date filters with 20 records per page. Amounts are exact whole MMK; enter digits without decimals or commas. Deletion requires confirmation, and stale edits/deletions require reloading the latest record.

### Dashboard

The dashboard reads only the authenticated user's PostgreSQL transactions. Choose an inclusive date range or use This month, Last 6 months or Year to date. The default is the current calendar month in Asia/Yangon. Monthly totals include only the selected dates, so the first/last month can be partial; months with no expenses are zero-filled. Custom ranges support at most 120 calendar months.

Select an expense category by clicking its donut slice, activating its category table button with the keyboard, or using the category filter. This applies to every card, both charts and recent entries; income becomes zero in an expense-only category, and balance remains selected income minus selected expenses. Clear the category to restore all categories. View all opens the transaction list with matching dates/category. All totals, tooltips and exact-value tables use whole MMK. Group bills/settlements are excluded. A new account has meaningful zero and empty states without runtime sample data.

### Receipt upload and local extraction

Open `/receipts/new` from Upload receipt on the dashboard or the new transaction page. Install [Ollama for Windows](https://ollama.com/download/windows) if needed. Do not expose port 11434 publicly. Quit the tray application before starting a separate CLI server; only one Ollama server should bind the port.

In an Ollama PowerShell terminal:

```powershell
$env:OLLAMA_NO_CLOUD = "1"
ollama serve
```

Keep that terminal running. In a second terminal, download the model before opening receipt extraction:

```powershell
ollama pull gemma3:4b
```

Alternatively set OLLAMA_NO_CLOUD=1 in Windows user environment variables and restart the Ollama application, as described in the [official FAQ](https://docs.ollama.com/faq). This variable must reach the Ollama process; putting it only in the Next.js `.env` does not configure a separate service. The model download needs Internet access and several GB of disk/memory; inference after download is local. No cloud sign-in or paid API key is required. A local model and sufficient hardware are prerequisites, not installed automatically by the app. The official model page lists [gemma3:4b as vision-capable](https://ollama.com/library/gemma3); 270m/1b variants are text-only.

Keep `OLLAMA_BASE_URL` / `OLLAMA_MODEL` in the server `.env` only if overriding their defaults. Start Next.js normally with `npm.cmd run dev` in another terminal, sign in and open `/receipts/new`. The application server and Ollama must share the same trusted host; remote/container hosting needs a separately reviewed setup. The adapter follows Ollama's current [chat API](https://docs.ollama.com/api/chat), [base64 vision input](https://docs.ollama.com/capabilities/vision), and [JSON-schema structured outputs](https://docs.ollama.com/capabilities/structured-outputs).

Uploads accept static JPG/PNG/WebP up to 10 MiB and 20 megapixels. The server checks MIME/signatures, fully decodes with Sharp, strips metadata and resizes to at most 2400px per side. It sends pixels only to loopback Ollama, with no disk/database image storage, raw OCR logging or retained suggestions. Only explicitly confirmed transaction fields are saved; the Receipt metadata table is not used by this flow. Unsaved suggestions disappear on reload/navigation. Operators must also avoid sensitive proxy/Ollama debug logging and protect host memory/crash dumps.

Review merchant, final total, date, currency and category. Unknown/uncertain values are blank and flagged; unsupported/unknown currency also clears the amount. Only positive whole-kyat MMK expenses can be confirmed. The app never converts currencies. Correcting a review field clears the confirmation checkbox. Saving uses the existing owner-scoped retry-safe expense path and refreshes dashboard totals. Validation/save failures retain entered values in the hydrated React form. No-JavaScript progressive form behavior is not a substitute for the supported interactive React review flow.

Extraction has an announced pending state, a two-minute timeout, bounded output and five attempts per authenticated user per 15 minutes (500 global). Retries and invalid uploads count toward the limit; ordinary manual entry remains available. Unavailable Ollama/model, bad output or corrupt/unsupported images produce safe errors and a manual-entry link. Leaving the page discards the review but does not guarantee immediate cancellation of already-running inference; it is bounded by the timeout. There is no background queue.

Automated tests mock both the extraction service and Ollama HTTP responses; they need no model, API key or paid calls. Real recognition accuracy, latency, peak memory and narrow-screen/keyboard behavior remain manual checks. The application is not a certified receipt/accounting extraction system; ambiguous totals and dates must be verified by the user even if the model fails to flag them.

Manual receipt checks:

- [ ] Start local-only Ollama, pull gemma3:4b and confirm a non-sensitive printed receipt reaches the editable review. Record model/version, language, correctness, latency and memory for several real samples; do not commit sensitive pixels or raw output.
- [ ] Check JPG, PNG and WebP; reject mismatched MIME, corrupt/animated images, files above 10 MiB and images above 20 megapixels without extraction.
- [ ] Check a receipt with subtotal/tax/change/multiple totals, an ambiguous date, unreadable fields and unknown/non-MMK currency. Correct suggestions and verify no invented date/currency or automatic conversion is accepted.
- [ ] Confirm extraction alone leaves transaction/dashboard counts unchanged. Edit every field, check confirmation, save once and verify the owned transaction and matching dashboard date/category totals; retry must not duplicate it.
- [ ] Stop Ollama or select a missing model; verify safe failure, retry/manual entry and no sensitive logs. Reject unsigned and cross-origin actions.
- [ ] At 360px/desktop, tab through upload, review controls, errors and confirmation. Verify readable labels, pending announcements, no page overflow and preserved values on save failure.

### Optional local sample transactions

Register a local account first, then run the existing basic category seed. To add 24 sample income/expense entries for that account, explicitly opt in from PowerShell:

```powershell
npm run db:seed
$env:NODE_ENV = "development"
$env:ALLOW_DEV_SEED = "true"
$env:DEV_SEED_EMAIL = "your-local-account@example.com"
npm run db:seed:dev
Remove-Item Env:ALLOW_DEV_SEED, Env:DEV_SEED_EMAIL, Env:NODE_ENV
```

Replace only the example email with the account you registered locally. This does not create a demo account or password. The sample script refuses production mode, absent opt-in, remote hosts and database names other than `smart_expense_db` before writing. It reads DATABASE_URL and adds entries only for the selected existing owner; deterministic submission keys make reruns idempotent without editing existing entries. Dates span the 24 days ending on the first seeding day in Asia/Yangon. Samples are never run automatically during installation, migration, build or startup; no production target was seeded during development.

The committed migrations were generated with `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`, reviewed, then applied with `prisma migrate deploy`. A separate integrity migration supplies CHECK constraints, normalized member-name/self-member indexes, and deferred exact share-total triggers. Keep those SQL constraints when making future changes. There is no need for shadow-database creation privileges to replay these migrations. Never run reset or db push to work around migration failures on a populated database.

For a new schema change, generate and review a new migration; never edit already-applied migration SQL. Generate the client after schema changes. Protect backups and verify restores before production use; deployment and destructive data maintenance remain separately authorized.

## Automated checks

Run against a disposable development database, never production. Tests create uniquely named temporary users and financial fixtures, then remove only those fixtures. Rate-limit counters are short-lived and expire after 15 minutes. Seed categories before tests. Tests do not reset the database or delete existing user records.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:http
npx prisma validate
npx prisma migrate status
```

`npm test` covers auth, transactions, dashboard and receipt validation/ownership, exact amounts/dates, actual PostgreSQL CRUD, retries/conflicts, filters/pagination, seed safety, aggregation and mocked local extraction. Receipt tests include format/signature/size/decode/animation limits, uncertain output, invalid dates/currencies, bounded provider responses, no extraction-time persistence and corrected expense/dashboard reconciliation.

`test:http` requires a current production build and free port 3197. It starts/stops its own production Next.js server plus a mock Ollama server on a dynamically allocated loopback port; no real inference or paid call occurs. It verifies Auth.js, transaction forms, receipt upload and hydration form state, explicit confirmation via the pinned Next.js Flight transport, no save before confirmation, corrected receipt totals, retries, signed-out/cross-origin rejection and two-user isolation. The helper reads action IDs from the built server manifest without logging its encryption key; revisit its framework transport import on Next upgrades. It also covers secure cookies, CSRF, callback restrictions, tampered/expired sessions, logout and deleted users. It simulates a trusted HTTPS proxy using matching forwarded-host/protocol headers over loopback and manually carries cookies; it does not replace a live hydrated browser/TLS check. It uses an ephemeral auth secret, suppresses request details and emits only redacted error summaries on failure.

The starter layout still downloads Geist fonts from Google during a cold build; network access is required for that existing behavior. Session and financial data are not shared-cached. Request-dependent protected content renders inside Suspense with Cache Components enabled.

## Manual verification checklist

- [ ] With PostgreSQL running, replay migrations and seed; verify migration status is up to date.
- [ ] Open `/app` in a signed-out/private browser. It should lead to `/login` without showing account information.
- [ ] Register a new email/name with a password of 12–128 characters. Sign in and confirm `/app` shows that user's name/email.
- [ ] Try a short password, malformed email, blank name and duplicate email. Validation is safe; duplicate registration stays generic and creates one user.
- [ ] Enter an incorrect password and a nonexistent email. Both fail generically; repeated attempts become rate-limited.
- [ ] Reload and restart the development server. The account persists and the existing unexpired session remains usable with the same AUTH_SECRET.
- [ ] In browser storage tools, confirm the session is an HttpOnly, SameSite=Lax, Path=/ cookie; no auth token appears in localStorage/sessionStorage. Over production HTTPS, confirm Secure and the `__Secure-` prefix as well.
- [ ] Sign out, then reload `/app` or use Back and refresh. Account data should be inaccessible without signing in again.
- [ ] Repeat with a second account/private browser; confirm the displayed account changes and run the two-owner database isolation tests before adding financial endpoints.
- [ ] Use keyboard navigation and inspect forms at 360px width. Check labels, visible focus, pending buttons and announced status/error messages.
- [ ] Open `/transactions` at desktop and 360px widths. Confirm the desktop table changes to mobile cards without page overflow, including a maximum-sized MMK amount.
- [ ] Create income and expense entries; view details, reload, edit and delete with confirmation. Cancel a delete and confirm the entry remains.
- [ ] Apply type, category and inclusive date filters; with local samples, navigate both pages and confirm the filters persist. Reset filters and check empty and invalid-filter states.
- [ ] Trigger a validation error or failed save and confirm entered fields remain. Open an edit form twice; save one, then verify the stale form cannot overwrite it.
- [ ] Sign in as a second user and request another user's detail/edit URL. Expect an unavailable record and no private transaction content.
- [ ] At desktop and 360px widths, check summary cards, donut, monthly bars, filter controls and recent entries for readable labels and no page overflow.
- [ ] Select a date range spanning several months. Check exact monthly amounts (including zero months), expense-category sums and the expense card reconcile.
- [ ] Hover/focus chart data for exact-MMK tooltips. Use native category buttons by keyboard, click a donut slice, and clear selection; confirm cards/charts/recent entries update to the same filter.
- [ ] Follow View all and verify its dates/category match the dashboard. Edit a transaction, return to the dashboard and confirm totals refresh.
- [ ] With an empty account, an income-only range and an invalid range, verify the appropriate zero/empty/validation states. A second user's entries must not appear.
- [ ] In a production-like HTTPS deployment, confirm canonical AUTH_URL, trusted proxy/host handling, cookie behavior, TLS, database access restrictions, backups and logs before a separately approved launch.

## Known boundaries

JWT session lifetime is eight hours; Auth.js may refresh it on session access. Logout clears the current browser cookie; it cannot revoke a previously stolen JWT immediately. Deleting a user prevents subsequent token use because JWT and protected data access check the persisted user. Password reset, email verification, invitations, role administration, receipt OCR/storage and group/settlement workflows are absent. Financial operations are Server Actions, not public REST endpoints. Fixed-window auth throttling allows five attempts per normalized email/action and 500 total attempts/action per 15-minute window across instances; production abuse policy may need tuning.

## Official implementation references

- [Prisma ORM 7 configuration, client generator and adapters](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Prisma CLI migration reference](https://www.prisma.io/docs/orm/v7/reference/prisma-cli-reference)
- [Auth.js installation and App Router handlers](https://authjs.dev/getting-started/installation?framework=Next.js)
- [Auth.js Credentials and validation](https://authjs.dev/getting-started/authentication/credentials)
- [shadcn/ui CLI and presets](https://ui.shadcn.com/docs/cli)
- [Prisma 7 pagination](https://www.prisma.io/docs/orm/v7/prisma-client/queries/pagination)
- [Prisma 7 parameterized raw queries](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries)
- [Recharts Pie](https://recharts.github.io/en-US/api/Pie/) and [responsive containers](https://recharts.github.io/en-US/api/ResponsiveContainer/)
- Installed Next.js guides under `node_modules/next/dist/docs/`, especially authentication with Cache Components and data security.
