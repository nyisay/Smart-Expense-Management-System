# MVP quality review — 2026-11-08

Core MVP flows pass the executed regression checks after the fixes below. This is a local application review, not a production launch approval or a complete WCAG/security certification. No deployment, push, data reset, credential change or schema migration was performed. Pre-existing group milestone work was preserved.

## Review findings and fixes

| Finding | Resolution and evidence |
| --- | --- |
| Cached creation forms could reuse a previously successful submission UUID. Adding guest C after guest B failed as a changed retry. | New group/member/bill/repayment/transaction forms are keyed by their server-generated draft identity. Failed actions retain controlled values and retry/version identity; a newly rendered draft remounts cleanly. Playwright adds consecutive guests and creates consecutive personal entries via client navigation. |
| Replacing an extracted receipt with a failing upload discarded manually corrected fields. | Keep the existing review mounted while extraction is pending, disable confirmation during extraction, validate any previous suggestion state with Zod, and preserve it on failure/limits. A new successful extraction intentionally starts a new review. Both viewport projects verify corrections survive failure and no transaction exists before explicit confirmation. Successful save also invalidates the receipt page. |
| Chart filter changes discarded keyboard focus; the donut center label overlapped tooltip text. | Remount only the GET filter form, retain chart identity, use aria-disabled with the existing pending guard on category controls, and put tooltips above the decorative label. Browser tests exercise actual donut hover/click and repeated Enter toggles. Screenshots are visually inspected. |
| Destructive buttons failed contrast checks; the mobile transaction link's accessible name omitted “details”; group section titles lacked heading semantics. | Adjust the shared destructive text colors, align visible/accessibility link names, and use h2 group section headings. No axe rule exclusions were added. Light core pages and light/dark delete dialogs are checked. |
| AUTH_URL accepted a path, credentials, query or fragment despite being a canonical origin. | Require origin-only configuration while retaining HTTPS-only production and local HTTP development rules. A new regression rejects the demonstrated invalid forms without exposing configuration values. |
| The shadcn CLI was classified as a runtime dependency. | Keep version 4.23.0, pin it as build/development tooling, and verify CSS/build resolution. The production dependency audit now reports zero advisories. Root metadata now uses the actual product name. |

## Verification executed

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass, zero warnings/errors |
| `npm test` | 40 Node unit/PostgreSQL tests pass |
| `npm run test:http` | One production HTTP lifecycle test passes |
| `npm run test:e2e` | Eight Playwright tests pass: four complete flows at 1366×900 and 360×800 |
| `npm run build` | Production build passes with existing Next Cache Components settings |
| `npm exec -- prisma validate` | Valid schema |
| `npm exec -- prisma migrate status` | Two migrations applied; database schema up to date |
| Local configuration/role probe | Development auth configuration valid; role has no superuser/CREATE ROLE/CREATE DATABASE/BYPASSRLS flags, but retains public-schema CREATE |
| `npm audit --omit=dev` | Zero advisories at review time |
| Full dependency audit | 13 development-only advisories: 2 low, 11 moderate; no high/critical |
| `npm run test:receipt:local` | Two generated English receipt cases passed all five expected field checks using local gemma3:4b / Ollama 0.40.15 |

The automated regression count is 49: 40 unit/database, one HTTP lifecycle and eight browser tests. The two real-model benchmark cases are reported separately. No skipped browser project is counted as a pass.

Playwright uses an isolated Chromium process and ephemeral HTTPS certificate/auth secret, a production Next server, genuine PostgreSQL persistence, and a local mock Ollama server. It does not attach to the user's Brave tabs, install a trusted CA, or call a paid API. Receipt inputs and screenshot data are synthetic. Trace/video capture is disabled; generated screenshots and failure artifacts are ignored by Git. Fixture accounts and their group/personal records are removed by exact test identity.

Browser coverage includes registration/login, HttpOnly/Secure/SameSite cookies over real local TLS, empty dashboards, income/expense creation, date/category filters, donut click/tooltip and keyboard controls, totals after edit/delete, delete cancellation/confirmation, receipt uncertainty and provider failures, preserved corrections, explicit receipt saving, repeated guest creation, unequal/percentage bills, invalid totals, repayments, refresh persistence, two browser sessions and logout/back navigation. The scans assert no page overflow at the two target sizes and no detected WCAG 2.1 A/AA axe violations at the exercised states. Visual inspection covers desktop/mobile dashboard and mobile receipt/group layouts. This does not certify every assistive technology or browser.

Existing integration tests also cover server mutation authorization, missing/deleted/tampered/expired principals, cross-origin requests, cross-group foreign keys, positive and maximum money limits, sums beyond JS safe integers, inclusive/date/month boundaries, category reconciliation, atomic share totals, optimistic conflicts, concurrent retry deduplication and group/personal ledger separation.

## Local receipt benchmark limits

Two in-memory generated receipts explicitly state merchant, MMK currency and an unambiguous 2026-11-08 date. One has a simple final total; the second includes subtotal, tax, cash tendered and change. Merchant, total, date, currency and Food category all matched the expected fixture fields. Elapsed times were 46,521 ms and 29,290 ms, including local request/model work. These timings are observations on this machine, not service guarantees. No model peak-memory benchmark was taken.

No real customer receipts, photos, handwriting, rotated/blurred receipts, Myanmar-language samples or representative receipt corpus were tested. The provider can still return confidently wrong suggestions; explicit human review remains mandatory. Model tags can change independently of the app lockfile.

## Remaining issues, in priority order

1. **P1 — Release verification before any production launch.** Real deployment TLS/proxy trust, production AUTH_URL/secret handling, separate least-privileged runtime/migration roles, backup/restore and runtime availability are unverified. The checked local role is not superuser and has no role/database-creation or BYPASSRLS flag, but it does have public-schema CREATE. Review production privileges rather than reusing this combined local setup. The local HTTPS test is not evidence about a future deployment. Keep deployment separately authorized.
2. **P2 — Representative receipt accuracy and resource testing.** The clean synthetic English benchmark is small. Test an agreed set of non-sensitive real receipts and intended languages, poor images, latency/memory and timeout behavior before relying on extraction quality. A local Ollama runtime/model is required on the same trusted host.
3. **P2 — Development dependency advisories.** minimatch/deepmerge chains in ESLint/shadcn tooling remain flagged. Follow compatible upstream fixes; npm's proposed cross-major tool downgrades were deliberately not applied. See [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) and [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). This does not affect the zero-advisory runtime dependency snapshot.
4. **P2 — Manual accessibility and cross-browser assessment.** Screen-reader testing, real phones, Firefox/WebKit, browser zoom and inclusive user testing remain unexecuted. Automated axe scans and Chromium screenshots do not establish full WCAG conformance. The previous native capture mismatch is not claimed fixed; Playwright provides a separate verified browser path.
5. **P2 — Accepted session limitation.** JWT logout clears the current cookie but does not immediately revoke a stolen token. The existing eight-hour session strategy and Auth.js beta pin are unchanged. A revocation strategy or library-channel change needs an architectural decision.
6. **P3 — Deliberate MVP limits.** Repayments are append-only, participants are owner-managed labels, groups support 50 participants, and full group histories load in memory. There are no invitations, exchange conversions, settlement corrections or global transfer-count optimization. Cold builds still need access to the existing Google Fonts source. These are disclosed limits, not silently completed features.

## Reproduce

Use a local development/test PostgreSQL database with migrations/categories already prepared. Keep real credentials in ignored environment files. See [SETUP.md](SETUP.md) for commands, prerequisites, ports, fixture cleanup and the manual checklist. Source versions remain Prisma 7.10.1, Next 16.4.5 and Auth.js 5.0.0-beta.32. New development-only tools are Playwright 1.65.0, axe Playwright 4.14.0 and selfsigned 5.5.0.
