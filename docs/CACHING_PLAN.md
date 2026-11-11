# Client query caching plan

Status: proposed on 2026-11-11; approval required under AGENTS.md before changing the current server-read architecture. No caching implementation or dependency installation has occurred.

## Findings from the repository

- `next.config.ts` enables Cache Components and partial prefetching. These flags do not automatically cache the application's Prisma queries.
- Dashboard and the subsequently approved `/analytics` route (D-13) call shared `getReportingData`, which authorizes the user, validates dates/category through Zod/Prisma, then calls the existing authenticated `loadDashboard` store. Analytics adds presentation/drill-down without changing this server-read boundary. If D-12 is approved, both reports should share the same user/filter query key and read adapter.
- `app/(protected)/transactions/page.tsx` loads categories and transactions on the server. The transaction/group query modules resolve the authenticated user before invoking their stores; budgets also load owned data from the server.
- Transaction, receipt and budget Server Actions call `revalidatePath`; group actions invalidate group paths. These invalidations do not invalidate a separate TanStack Query cache.
- TanStack Query is not installed. Adding a provider alone would leave the current page-level database calls in place.

These observations establish repeated server reads, not a measured latency diagnosis. Record navigation/read-request counts before and after implementation rather than claiming a speed improvement in advance.

## Proposed approach

Add the stable TanStack Query v5 package, pinned to the official release selected during implementation. Use one browser QueryClient within the authenticated application shell, scoped to the current user. Keep Next.js routing, layouts, Server Actions, feature stores, SQL aggregation and Prisma. Do not add a separate backend or client state framework.

Move financial read views to small `useQuery` boundaries backed by authenticated same-origin GET handlers. Reuse the existing feature stores and presentations. Keep protected server page/session guards; auth/security and fresh edit-version checks remain server authoritative. Pages must stop unconditionally loading the same financial dataset before rendering a cached client view. Initial read views can render the existing skeletons while loading; do not prefetch the dataset in a Server Component on every navigation and then fetch it again on the client.

Proposed read routes: `/api/dashboard`, `/api/transactions`, `/api/transactions/[id]`, `/api/categories`, `/api/budgets`, `/api/groups`, and `/api/groups/[id]`. These are adapters over existing stores, with no new business rules. Each derives identity from the session, validates parameters with Zod, enforces ownership and returns minimal validated DTOs. Private responses use `Cache-Control: private, no-store`; this is application-managed browser memory caching, not CDN caching of financial responses. Foreign/missing owned records remain indistinguishable.

## Freshness and retention

| Data | staleTime | Focus/reconnect policy |
| --- | --- | --- |
| Dashboard aggregates and recent transactions | 5 minutes | Always refresh the active financial query on browser return/reconnect |
| Transaction lists and read-only details | 5 minutes | Same |
| Budget actuals/limits and group balances/history | 5 minutes | Same |
| Fixed category reference lists | 30 minutes | Refresh on focus/reconnect when stale |
| Authentication, session revocation and edit/version validation | No query-cache lifetime | Check at server boundaries and before writes |

Use 30 minutes of `gcTime` for inactive queries. Freshness controls whether a cached query needs a new request; garbage collection controls unused memory retention. Neither is a periodic polling timer. Returning to a page within its freshness window reuses the matching cache. Financial focus refresh deliberately overrides freshness so another device's updates can appear promptly. Only active queries refresh on focus; inactive screens do not all refetch. No background polling or browser-storage persistence.

## Correctness and isolation

- Every financial key contains the authenticated user ID, resource, canonical validated filters/pagination and record ID where relevant. Resolve relative reporting periods to explicit Yangon calendar dates. Convert bigint amount bounds to decimal strings in URL/query keys; do not JSON-hash bigint values directly.
- Keep monetary response values as exact decimal strings, dates as YYYY-MM-DD and budget months as YYYY-MM. Validate response DTOs; chart-only numeric conversions remain unchanged.
- Clear and cancel private queries on logout, password-change sign-out, account switches and authentication failures. Reject late responses from an earlier user scope. An unauthorized refresh clears private results and returns to login; a failed network refresh must not silently present old data as current.
- Do not cache credentials, session/JWT validity, receipt images, raw extraction responses or unconfirmed review forms. Unsaved form values remain feature-local.
- Keep edit forms and optimistic version/conflict checks fresh. Cached display data cannot authorize an operation or bypass the current server version. Authentication/session checks may still require network/database work; the goal is fewer repeated financial data reads, not zero requests.
- Cross-tab sign-out/cache clearing can use a native BroadcastChannel carrying only an event, never a token or financial payload. Cross-device revocation remains enforced by live server checks; this does not promise remote erasure of already-rendered content.

## Mutation invalidation

| Successful operation | Queries to invalidate |
| --- | --- |
| Create/edit/delete personal transaction; confirm receipt expense | All affected transaction list/detail keys, dashboard and budget queries |
| Save/remove budget | Budgets and dashboard |
| Change group/member/bill/repayment; delete group | Group list and affected group detail; remove deleted entities |
| Edit profile | Profile/shell presentation |
| Logout/password revocation/account switch | Cancel and clear the entire previous private user cache |

Invalidate after a confirmed server commit, including successful idempotent retries, and before navigating to the success view. Do not invalidate only before submitting: a background request could otherwise cache the pre-save result. Do not clear drafts on validation failures. Preserve current read-your-writes behavior after redirects. Adapt mutation success/redirect transport where needed so client invalidation is explicit; retain server authorization, Zod, atomicity, throttling and retry identities. Continue appropriate Next path revalidation for server-rendered views. Group operations must not change personal dashboard totals.

## Focused implementation stages

1. Add the user-scoped provider, validated fetch/error handling and query key policy. Integrate dashboard and categories first. Verify fresh navigation avoids duplicate finance reads, focus refresh works, and first loads/errors retain useful UI.
2. Integrate transaction lists/details and their filter/page keys. Wire transaction and confirmed-receipt invalidation so dashboard/budgets update immediately. Keep edit forms/version checks fresh.
3. Integrate budgets and group list/details. Add their specific invalidations, including deletion/settlements, and complete session/logout/account-switch cleanup. Keep personal/group ledgers separate.
4. Run regression checks, inspect request counts and responsive/background refresh behavior, and update TASKS/PROGRESS with actual evidence. Do not deploy, push or commit without approval.

## Acceptance and tests

- Revisiting an unchanged financial query within five minutes produces no additional finance GET; changing filters/page/user produces the correct distinct query. Expiry permits a background refresh, and the 30-minute category/retention settings are tested with controlled clocks.
- Browser hide/show or refocus refreshes the active financial query, including while otherwise fresh. Duplicate observers share the same request. Background refresh does not blank existing charts or reset form drafts.
- Every successful mutation updates affected visible totals/lists without waiting five minutes. Failed submissions preserve drafts and do not treat old data as a successful new save.
- Two real accounts, sign-out/sign-in transitions, late requests, deleted records and password/session revocation cannot leak or repopulate the previous user's cache. API ownership and malformed-input tests remain server-side.
- Exact money, day boundaries, category totals, receipt confirmation and group repayments retain their existing integration/browser coverage. No automatic receipt save or double counting.
- Run the available lint, typecheck, unit/database, HTTP and desktop/mobile browser scripts plus production build against disposable local PostgreSQL. Count auth requests separately from expensive financial reads. Report skipped/failed checks honestly.

## References

- [TanStack Query defaults, staleTime and garbage collection](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Window focus refetching](https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching)
- [Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Next.js server rendering integration](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

The installed Next.js caching guide was also inspected. Its existing Cache Components configuration is preserved; implementation must read the installed Route Handler guide before adding the proposed endpoints.
