# Implementation tasks

## Receipt drag and drop — Completed 2026-11-12

- [x] Add a highlighted, labeled single-image drop zone using native drag/drop and the existing file input. Share type/size validation with picker selection, preserve preview URL cleanup and keyboard file picking, reject invalid/multiple files and ignore text/URL drops or replacements during extraction. Keep upload/extraction/review/save explicit, authenticated and server-validated; add no dependency or storage.
- [x] Pass lint/typecheck/build, 73 unit/PostgreSQL tests, one HTTP lifecycle and four focused desktop/360px receipt browser cases (1.6 minutes). Verify nested drag enter/leave, invalid/empty/oversized/multiple drops, keyboard chooser, actual FileList/FormData submission, zero auto-uploads, preview revocation, pending guards, corrected confirmation and exact dashboard totals. Existing receipt ambiguity/failure/draft/picker checks also pass. Inspect screenshots, confirm zero fixtures, stop isolated resources and update handoff/setup/requirements. Full unrelated browser regression and real hosted extraction were not rerun; production diagnosis remains pending. No commit, push or deployment.

## Zod boundary validation — Completed 2026-11-12

- [x] Review existing auth/account, transaction/filter, dashboard/Analytics, budget, group, receipt and environment schemas/call sites. Preserve these feature validators, server-derived authorization, exact money and UI feedback; document coverage in ARCHITECTURE/STANDARDS/REQUIREMENTS without adding duplicate validators or dependencies.
- [x] Replace broad numeric coercion for pagination and transaction/group/budget revisions with one bounded integer-scalar Zod helper. Reject unintended types and alternate numeric notation; retain valid FormData strings, normal numeric callers, page defaults and explicit new-budget revision zero. Reuse the PostgreSQL URL schema before creating Prisma's adapter, with secret-free errors.
- [x] Reproduce four failing boundary cases before the fix, then pass all four new regressions, database no-write/unchanged-version assertions and HTTP invalid-query recovery. Final lint/typecheck/build, **73 unit/PostgreSQL tests**, **one HTTP lifecycle** and **38 desktop/360px browser cases** (5.1 minutes) pass. Confirm zero fixtures, stop isolated processes/database and pass whitespace checks. No production writes, dependency/schema changes, commit, push or deployment. Production receipt diagnosis remains separately pending its error/configuration evidence.

## Production receipt scanner diagnosis — Awaiting production error/configuration evidence

- [x] Check the confirmed production origin and protected receipt route without credentials or writes. Login responds successfully and unauthenticated receipt rendering redirects to login. Run the five mocked cloud-provider tests; all pass. Check current official Ollama Cloud/model/structured-output and Vercel limit documentation; preserve secret redaction.
- [ ] Reproduce an authenticated scan using the exact production toast/runtime error and current Vercel Production provider/model/key-presence settings. Browser access host is unavailable, no Vercel CLI/project link is available here, and the local environment uses local Ollama without a cloud key. Do not infer Vercel settings from local configuration, change working extraction speculatively, or claim real hosted extraction passed. The user confirmed the production URL; the exact error and non-secret configuration metadata have been requested.

## Logout button placement and color — Completed 2026-11-12

- [x] Keep No/Yes together in a centered bottom row on desktop/mobile; give Yes a solid semantic red fill and readable dark text. Scope styling to the shared logout confirmation, preserving initial No focus and logout/cancel behavior.
- [x] Pass lint/typecheck/build and both focused desktop/360px logout browser cases (1.4 minutes), including layout, destructive variant, axe, keyboard, nested mobile drawer, cancellation and logout. Inspect screenshots, fix the initial tinted-button contrast issue, verify zero fixtures and stop isolated resources. Unit/database, HTTP and full browser suites were not rerun for this styling-only change. No commit, push or deployment.

## Logout confirmation — Completed 2026-11-11

- [x] Add one shared shadcn AlertDialog around Settings and expanded/collapsed/mobile navigation logout controls. Ask “Are you sure you want to log out?” with Yes/No, initial No focus, Escape/cancel focus return and disabled submission controls while pending. Preserve the existing server logout action and explicit password-change/session-revocation flow.
- [x] Verify cancellation sends no POST and preserves unsaved profile fields, keyboard focus containment/return, nested mobile navigation, confirmed logout and protected-route rejection. Pass lint/typecheck/build, 69 unit/PostgreSQL tests, one HTTP lifecycle and eight focused desktop/360px Chromium cases (2.4 minutes), including existing toast, account/password and two-user flows. Inspect the dialog screenshots, pass whitespace checks, confirm zero fixtures and stop isolated test resources. Full financial browser regression was not rerun for this UI-only change. No commit, push or deployment.

## Dedicated Analytics page — Completed 2026-11-11 (D-13)

- [x] Replace the Analytics dashboard-anchor shortcut with protected `/analytics`, active navigation and date/category preservation between reports. Reuse the existing authenticated reporting store, validation and shared filters without changing models or dependencies.
- [x] Add selectable income/expense, monthly net and exact cumulative-net views; clipped month drill-down by chart and accessible table links; route-aware category filtering; existing comparisons/insights; loading, empty and error recovery states. Revalidate Analytics after personal transaction, receipt and budget mutations.
- [x] Add exact cumulative, reporting-link and leap/partial-month boundary tests. Pass 69 unit/PostgreSQL cases, one HTTP lifecycle, lint, typecheck and production build. Inspect desktop/360px Analytics screenshots and preserve existing data-isolation rules.
- [x] Pass the final full 36-case desktop/360px Chromium regression (5.2 minutes), including Analytics interactions, direct bar/line-point clicks, date/category navigation, empty/invalid filters, axe and two-user isolation. Fix hover-dependent click handling and selectors matching hidden cached pages; preserve all existing flows. Record final results, verify zero test users and stop only isolated test resources. No commit, push or deployment.

## TanStack Query caching — Plan awaiting architectural approval (D-12)

- [x] Inspect actual server reads, authentication and existing mutation invalidation; review official TanStack and installed Next.js caching guidance. Prepare CACHING_PLAN.md with query lifetimes, authenticated API/read boundaries, user isolation, invalidation, rollout and measurable tests.
- [ ] Obtain approval for the proposed client read/API architecture before adding dependencies or changing application fetching. Then implement dashboard/categories first, followed by the remaining financial read views and regression verification. Preserve all existing uncommitted work; no deployment or commit without approval.

## Shared shadcn date/month pickers — Completed 2026-11-11 (D-11)

- [x] Import official Radix/nova Calendar/Popover without overwriting shared Button; pin calendar/date/timezone dependencies. Add one shared ISO-preserving DatePicker across transactions, dashboard filters, receipt review, bills, repayments and budget month selection. Preserve server validation, ownership, exact dates, required/optional fields, drafts and disabled states.
- [x] Add date/month/leap/boundary/timezone tests and browser selection/keyboard/clear/validation/filter/month/popup/disabled-fieldset checks. Exercise real calendar selection in existing transaction, receipt and group browser flows. Pass 66 unit/database cases, one HTTP lifecycle, lint/typecheck/build and four focused desktop/mobile calendar/system-color cases. Fix hydration, day-label, viewport and obsolete login-card selector issues; preserve every axe rule.
- [x] Pass the final 34-case desktop/360px browser regression (5.3 minutes), including selected-day hover/reselection and system-color checks. Inspect current screenshots, confirm zero remaining test users and stop the disposable PostgreSQL instance. Final 66-case unit/database and HTTP lifecycle reruns also pass. Record existing dev-tool audit advisories and manual/other-browser limits. No production database, migration, commit, push or deployment change.

## Underline-only auth field focus — Completed 2026-11-11

- [x] Verify the reported hover border: idle/hover are underline-only, while focus adds the shared rectangular ring. Remove that ring only in AuthForm and retain a thicker highlighted focus underline. Extend desktop/mobile field assertions, pass lint/typecheck/build and six focused browser cases, inspect focused rendering and update docs. No deployment.

## Dark market photograph on auth pages — Completed 2026-11-10

- [x] Replace the pastel artwork with the supplied market photograph using an optimized WebP and a distinct asset URL. Preserve 972×655.2 desktop sizing, equal panels, image cover, mobile layout, forms and background. Pass lint/typecheck/build and six focused browser checks; inspect desktop rendering and update theme/handoff. Leave the source download untouched; no deployment.

## Auth size reduced by 10% and 9% — Completed 2026-11-10

- [x] Reduce the current 1080×720 desktop baseline to 972×655.2 pixels. Preserve equal panels and mobile sizing; reduce only desktop section gaps so registration fits without clipping. Verify both form dimensions, layout/accessibility and image loading in six browser cases. Pass lint/typecheck/build, inspect the sign-up screenshot and update theme/progress. No deployment.

## Slightly smaller auth layout — Completed 2026-11-10

- [x] Reduce desktop maximum width from 1152px to 1080px and minimum height from 760px to 720px. Keep equal panels, cover sizing, mobile layout and forms unchanged. Pass lint/typecheck/build and six focused browser checks; inspect the desktop screenshot and update theme/handoff notes. No deployment.

## Financial artwork on auth pages — Completed 2026-11-10

- [x] Replace the cherry image with the user's supplied financial-chart PNG, using an optimized local WebP and a new filename to avoid old-image cache reuse. Preserve equal panels, full-panel cover, mobile layout, Frosted theme and forms. Pass lint/typecheck/build and six focused browser cases; inspect the desktop image. Original download untouched; no deployment.

## Equal auth panels without outer card — Completed 2026-11-10

- [x] Remove the enclosing auth Card/padding, use equal adjacent desktop columns and keep rounded exterior corners. Preserve image cover sizing, Frosted form styling, mobile layout and all form behavior. Verify equal widths/no gap/no outer Card in existing layout tests; pass lint/typecheck/build and six desktop/mobile browser cases, inspect screenshots and update current requirements/theme docs. No deployment.

## Auth image covers panel — Completed 2026-11-10

- [x] Switch the shared login/sign-up illustration to object-cover so it fills its panel without stretching, accepting centered cropping. Preserve mobile visibility, forms, theme and background; update the layout assertion and current image requirements. Pass lint/typecheck/build and six focused responsive/accessibility browser cases; inspect the desktop screenshot. No deployment.

## Cherry illustration replacement — Completed 2026-11-10

- [x] Replace the login/sign-up geometric illustration with the supplied cherry.jpg, remove the superseded copied asset and preserve image containment, responsive visibility, forms, Frosted Glass and global background. Pass lint/typecheck/build and six focused desktop/mobile layout/accessibility browser tests; inspect the desktop result. Original downloads remain untouched; no deployment.

## Supplied login/sign-up illustration — Completed 2026-11-10

- [x] Copy the supplied static WebP into public/auth and replace the reserved desktop photo placeholder in the shared AuthForm. Show the full image without cropping or distortion, mark it decorative and keep mobile/tablet forms compact. Preserve Frosted Glass, the global photograph, password controls and authentication behavior.
- [x] Verify image loading/containment and responsive placement through existing browser tests; pass lint/typecheck/build and all 10 focused desktop/360px layout/password cases. Inspect desktop login/mobile sign-up screenshots and update requirements/theme/handoff docs. Leave the source download unchanged; no dependency, database, commit, push or deployment change.

## Frosted Glass only — Authorized and verified 2026-11-10 (D-10)

- [x] Make Frosted Glass the server-rendered and CSS default. Remove Dark Base selection, the theme-switcher component, sidebar/mobile drawer and Settings appearance controls, and browser-storage bootstrap. Ignore old saved theme choices. Preserve the photograph, readable shared tokens, dark utility variants and reduced-transparency/forced-color/print/no-blur fallbacks.
- [x] Update account copy/navigation and theme documentation. Add browser assertions for initial SSR appearance, legacy dark preferences and unavailable browser storage; retain existing authentication, financial, receipt, budget and group regressions. Pass lint/typecheck/build, one HTTP lifecycle and all 32 desktop/360px Chromium cases; inspect responsive screenshots. Test only against disposable local PostgreSQL; no schema, business logic, dependency, hosted-data, commit, push or deployment change.

## Undo authentication GIF — Completed 2026-11-10

- [x] Remove the copied GIF/poster and playback component, restore the inert reserved photo panel and original layout assertions, preserve the existing redesign/themes/background and pass lint/typecheck/build. Leave the original download untouched; no deployment or database change.

## Reference-based login/sign-up layout — Authorized and verified 2026-11-10

- [x] Adapt the supplied reference into a responsive split-panel layout using the existing shared AuthForm/shadcn controls. Reserve an inert left photo area without copying reference artwork; keep the existing themes/background image, validation, password eye controls, pending/inline/toast feedback and working navigation. Collapse to the form on smaller screens.
- [x] Add desktop/mobile, both-theme layout/accessibility/photo-slot tests. Pass lint/typecheck/build, one HTTP lifecycle and 12 focused browser cases (1.1 minutes), including password visibility, native validation, repeated auth failures, successful registration/login and the existing authenticated expense/chart flow. Inspect desktop Frosted login/mobile Dark sign-up screenshots; update requirements/theme/progress documentation. No schema, dependency, server-authentication, production data, commit, push or deployment change.

## Account settings and session security — Authorized and verified 2026-11-10 (D-09)

- [x] Record explicit approval for password changes and signing out all sessions. Redesign `/app` using existing dark/frosted tokens, account initials/details/member-since date, section navigation, editable name/reset, read-only email, appearance, fixed reporting preferences, skeleton loading and logout.
- [x] Add strict server validation and authenticated owner-only profile changes with stale-name rejection. Refresh the shell/profile and preserve form values on errors. Reuse the shared accessible PasswordInput across authentication and settings.
- [x] Require current password, matching/different new credentials and bounded verification attempts. Atomically replace the hash and increment sessionVersion; retain the version observed during credential verification, reject revoked/invalid JWT versions and clear the current cookie. Preserve legacy zero-version sessions until password change and other users' sessions independently.
- [x] Review the additive session-version migration and apply it only to a disposable local PostgreSQL instance. Validate/generate Prisma, pass lint/typecheck/build, all 63 unit/database tests and one HTTP lifecycle. New cases cover validation, owner isolation, stale edits, invalid/legacy versions, wrong passwords, races and throttling.
- [x] Pass the final 26-case desktop/360px browser suite (3.2 minutes). Verify two signed-in contexts, profile persistence/reset/stale failure, both themes/axe, password rejection/recovery, all-session revocation including a replayed Server Action, old-password rejection/new-password login and existing financial/receipt/group flows. Fix the discovered profile-menu label mismatch without excluding axe rules; inspect desktop/mobile screenshots and update docs.
- [x] Follow-up authentication repair: after the user reported broken login/sign-up, verify the configured application/direct URLs target the same database and only the reviewed session-version migration is pending. Apply it and confirm real local registration/login/protected Settings/logout using a disposable account; remove the fixture. No existing password/financial record was reset.
- [ ] Release gate: apply `20261110000100_account_sessions` to any other intended database/branch before serving the new code, then verify the deployed settings flow after an approved release. The configured application database is migrated as of the 2026-11-10 repair; no code commit, push or deployment was performed.

## Password visibility controls — Authorized and verified 2026-11-10

- [x] Add an eye/eye-off control to the shared login/registration password field. Default to masked text; preserve the entered value, validation, password-manager autocomplete and authentication behavior. Use an accessible non-submit button with keyboard access, visible focus and a 44px touch target.
- [x] Add four desktop/360px browser cases covering both forms, default masking, pointer/Tab/Space/Enter interactions, value preservation, valid-form non-submission, accessible names, touch dimensions, no horizontal overflow and axe checks. Pass lint/typecheck/build, inspect screenshots and update progress. Test public forms against an isolated server with an unreachable dummy database; do not run database suites against the configured hosted database.

## Deployed Ollama Cloud failure — Investigating 2026-11-09

- [x] Reproduce the live failure with one synthetic receipt and a disposable account, verify cloud mode, confirm zero saved transactions and remove the fixture. Check public site/model availability, database category prerequisites and the five mocked adapter tests without revealing credentials.
- [x] Obtain the Vercel Production OLLAMA_MODEL value: the user confirmed gemma3:4b. Verify against the public API catalog: gemma3:4b is absent, gemma4:31b is present. Identify the required environment-only correction; no application code, local default, key or migration change is needed for this confirmed configuration defect.
- [ ] User applies OLLAMA_MODEL=gemma4:31b to Vercel Production and creates a deployment using those settings. Retest synthetic extraction through editable review, confirm no automatic expense save and clean up the fixture. Keep this verification open until the corrected deployment has actually been tested; the earlier generic HTTP failure does not establish a JSON, timeout or credential defect.

## Ollama Cloud receipt adapter and hosted upload limit — Approved 2026-11-09 (D-08)

- [x] Preserve default local extraction and add explicit server-only Ollama Cloud selection, private key/model validation, a fixed HTTPS endpoint, redirect rejection, bounded uncached requests, sanitized access/quota/timeout errors and strict prompted-JSON validation without unsupported cloud schema format. Retain uncertainty, explicit review, retry-safe owned saving and exact dashboard totals.
- [x] Share the 4,000,000-byte limit/MIME/error text across client and server, block invalid selections before upload, retain decoding/privacy checks and set the action-body ceiling to 4,400,000 bytes. Disclose the selected processing mode and preserve previous reviews after errors.
- [x] Add five mocked cloud-provider tests and extend PostgreSQL receipt coverage for cloud output without auto-saving, confirmed correction, retry safety, owner isolation and dashboard totals. Check the exact upload boundary and keep HTTP/browser harnesses pinned to local mocks even when the developer selects cloud.
- [x] Finish final desktop/mobile browser regressions, inspect synthetic receipt screenshots and record lint/typecheck/unit/database/HTTP/build results in PROGRESS.md. Lint/typecheck/build passed, 56 unit/database tests passed, the strengthened six-case receipt suite passed, one HTTP lifecycle passed and all 20 desktop/360px browser cases passed (8.0 minutes including sandbox teardown). Invalid MIME/oversized selections sent no extraction request. The browser runner required explicit cleanup of its verified isolated test servers before returning exit 0; the user's development server was preserved.
- [ ] Separate manual release gate: configure a real cloud key/model and verify representative non-sensitive receipt accuracy, provider access/usage and the chosen Vercel function duration. No billable API call or deployment is part of automated verification.

## Delete a complete group history — Approved and verified 2026-11-08 (D-07)

- [x] Record the user's explicit selection to delete previous groups from the list, including bills and repayments. Add a trash-icon control, confirmation with counts/permanence/no-refund warning, Cancel-first focus, pending protection and success feedback.
- [x] Implement authenticated owner-only, Zod-validated, atomic deletion of repayments, bills/shares, participants and group. Reuse existing group locks/foreign keys and Group.updatedAt for monotonic stale-confirmation rejection; preserve personal transactions and unselected groups. No schema/migration or dependency change.
- [x] Verify missing/foreign principals, invalid/unconfirmed input, stale same-count bill edits, concurrent deletes, full child cleanup, empty groups, other-owner and same-owner group preservation, and unchanged personal dashboard data with real PostgreSQL tests.
- [x] Pass lint/typecheck/build, all 51 unit/database tests, one HTTP lifecycle and all 20 desktop/mobile browser cases (3.0 minutes). Both focused group cases also pass (36.0 seconds), covering cancel, cross-tab stale rejection, fresh confirmed removal, inaccessible deleted URLs and accessibility in both themes. Inspect confirmation screenshots and update requirements/architecture/decisions/setup/handoff. No commit, push or deployment.

## Authentication and form toasts — Authorized 2026-11-08

- [x] Add a shared Radix notification host without a dependency; show generic registration and post-redirect sign-in success, repeated authentication errors and main-form validation/returned-error feedback. Keep inline messages, auth actions, cookies and exact financial operations intact.
- [x] Add desktop/mobile tests for native invalid-input focus, generic registration, real sign-in success, dismissal and repeated wrong-password errors. Retain existing financial/ownership regressions; add active-toast forced-color coverage.
- [x] Pass the full 20-case desktop/mobile browser regression (2.9 minutes), including active-toast forced-color checks, real auth success, repeated auth errors and existing financial/isolation flows. Fix the first-run phone toast/Save overlap through responsive positioning. Pass lint/typecheck/build, 49 unit/database cases and one HTTP lifecycle; inspect toast screenshots and update docs. No dependency, commit, push or deployment.

## Shared shadcn control refinement — Authorized 2026-11-08

- [x] Inspect existing controls and add six official Radix/nova component sources without changing dependencies. Replace plain confirmations, disclosures, progress, feedback, loading surfaces, table markup and category drill-down controls across the existing features; preserve money, authorization, theme/background and form identities.
- [x] Extend browser checks for keyboard receipt preview collapse/reopen without replacing its blob URL, exact group share disclosure and keyboard horizontal table scrolling. Retain existing real save/repayment, stale-input and ownership tests.
- [x] Pass final lint/typecheck/build, 49 unit/database cases, one production HTTP lifecycle and all 18 desktop/mobile browser cases (3.2 minutes), including both themes, tablet/landscape navigation, forced colors and keyboard table scrolling. Fix the first-run mobile table-focus defect without excluding axe rules. Inspect responsive receipt/budget screenshots and update UI_THEME/PROGRESS. No dependency/database change, commit, push or deployment.

## Appearance placement — Authorized and verified 2026-11-08

- [x] Remove the Appearance selector from login/sign-up and the top navbar, retaining sidebar/mobile drawer and account Settings controls and existing theme persistence. Pass lint/typecheck/build and diff checks; update setup/theme/handoff notes. Browser suites were not rerun for this small control removal.

## Appearance refinement — Authorized and verified 2026-11-08

- [x] Reduce Frosted panel opacity to 45% and align Appearance labels/selectors horizontally everywhere; size wrappers and selector padding to avoid clipped option labels. Preserve Dark Base, persistence and accessible fallbacks.
- [x] Pass build/lint/typecheck/diff checks and both final responsive workspace browser cases, including both-theme accessibility, tablet/landscape and theme persistence; update UI_THEME/PROGRESS. No functional changes or deployment.

## Shared photograph background — Authorized and verified 2026-11-08

- [x] Optimize the supplied photograph locally and apply it through global CSS to every public/protected page in both themes. Preserve readable surfaces, fixed cover sizing and accessibility/print fallbacks; leave the source image untouched.
- [x] Pass build/lint/typecheck/diff checks and both responsive dashboard browser cases with both-theme accessibility scans; inspect the background screenshot and update UI_THEME/PROGRESS. No new dependency, commit, push or deployment.

## Dark workspace redesign — Authorized 2026-11-08 (D-06)

- [x] Inspect existing routes/layout/theme/components and preserve dirty feature work; present the staged plan. Apply UI UX Pro Max guidance directly under the existing no-Python permission and Ponytail's reuse principles.
- [x] Centralize Dark Base/Frosted Glass tokens, early persisted appearance selection, shared theme controls, readable fields/charts and motion/transparency/no-blur/system-color fallbacks. No new dependency or financial/authentication change.
- [x] Add the authenticated shared shell, reserved collapsible desktop sidebar, labeled icon tooltips, active routes, keyboard skip link, profile/logout and accessible mobile drawer. Reuse `/dashboard#analytics` and `/app` for Analytics/Settings.
- [x] Refine reporting-period hierarchy, balance/income/expense/savings cards, existing semantic charts, desktop recent-transactions table/mobile list, upload surface and exact group-balance color labels. Preserve existing CRUD/review/filter/settlement behavior.
- [x] Add desktop/mobile browser coverage for collapse tooltips, active routes, drawer Escape/focus, open-drawer accessibility, profile, theme persistence after reload and unchanged form drafts. Existing exercised pages scan both actual themes.
- [x] Finish verification: lint/typecheck/build, 49 unit/database cases, one HTTP lifecycle and the full 18-case desktop/360px browser suite passed. Four repeated reduced-transparency/forced-color cases passed after system-color fixes. After a final Analytics fragment/filter fix and four-card skeleton alignment, rebuild/lint/typecheck and both focused navigation cases passed, including tablet/short-landscape drawer checks. Inspect desktop dashboard, mobile Frosted form and drawer screenshots; update handoff/docs. No commit/push/deploy.

## Product improvements — Authorized and verified 2026-11-08 (D-05)

- [x] Implement monthly category budgets with an additive local migration, exact full-month personal actuals, remaining/overspend, accessible numeric progress, 80% notices, unset/no-rollover rules, owned operations, retry handling and stale-row/version protection. Verify database and desktop/360px browser cases.
- [x] Add monthly income/expense/net cash-flow visualization and exact table; aligned previous-calendar-month/month-to-date and equal-length custom comparisons; shared predicates/snapshot, zero months, leap boundaries and insufficient/future-history suppression. Preserve existing donut drill-down and chart behavior.
- [x] Add literal case-insensitive merchant/note search, exact inclusive amount bounds, combined count/record predicates and stable owned pagination. Preserve validated context through detail/edit/cancel/save/delete; reject arbitrary return URLs. Verify unit/database and both browser viewports.
- [x] Add deterministic largest-category, signed cash-flow savings rate, comparable expense-change and full-month budget threshold insights. Explicitly handle zero income/previous expense and insufficient history; partial ranges link to full-month budgets. No AI dependency.
- [x] Run final lint, typecheck, 49 unit/PostgreSQL tests, one HTTP lifecycle, production build and all 16 desktop/mobile Playwright cases. Pass Prisma validation and three-migration status; inspect mobile analytics and desktop budget screenshots. Existing receipt/group/auth flows and light/dark accessibility regressions pass.
- [x] Update requirements, architecture, accepted rules, glossary and setup/manual checklist. Preserve previous audit evidence and unrelated work. No commit, push or deployment performed.

Remaining: representative real receipts, manual assistive technology, other browsers/physical devices and production security/backup checks remain open. Other audit roadmap items are not implied approved or complete.

Status legend: `[x]` complete, `[ ]` pending. Core MVP regression checks now include isolated Playwright at desktop/360px. Manual assistive-technology, representative real-receipt and production release checks remain open. See [MVP_REVIEW.md](MVP_REVIEW.md) for evidence and prioritized issues; FR references resolve to [REQUIREMENTS.md](REQUIREMENTS.md).

## Receipt precision follow-up — Authorized 2026-11-08

- [x] Reproduce dropped Ks/grouped totals with a failing regression and a local-model fixture; normalize explicit kyat labels, Myanmar digits and exact numeric formatting without guessing/rounding or changing manual-entry rules.
- [x] Improve the existing local provider prompt narrowly; add a collapsible, keyboard-scrollable browser-only source preview with URL cleanup, photo guidance and MMK (Ks) review labeling. Preserve corrected review fields, explicit confirmation, ownership and upload limits.
- [x] Pass 41 unit/database tests, one HTTP lifecycle, ten desktop/mobile Playwright cases, typecheck, lint and production build; rerun both receipt browser cases with a long synthetic image, keyboard scrolling and preview URL revocation. Inspect responsive screenshots. Three real local-model synthetic cases pass all five field checks after the fix; the original Ks case failed currency/total checks before it.
- [ ] Verify the user's original failure with a non-sensitive sample and representative photo/Myanmar-language receipts. Synthetic cases do not prove real-world OCR accuracy. Existing audit recommendations remain unapproved.

## Pre-deployment audit — Authorized 2026-11-08

- [x] Inspect actual source, schema/SQL, authorization, precise money/dates, visualization, receipt/group flows, UI and tests; classify verified/partial/missing/broken behavior in SYSTEM_AUDIT.md.
- [x] Run fresh lint/typecheck/build, 40 unit/PostgreSQL cases, one HTTP lifecycle, ten browser cases, Prisma validation/status and dependency audits; report the live Ollama refusal and unexecuted release/manual checks honestly.
- [x] Create FEATURE_GAPS.md and ENHANCEMENT_ROADMAP.md with all requested enhancement evaluations, priorities, dependencies, acceptance criteria and risks; preserve existing architecture and feature work.
- [ ] Obtain separate approval for remaining audit fixes/enhancements. The subsequent four-feature request authorizes monthly budgets, cash-flow analytics, merchant/note and amount filtering, and rule-based insights under D-05. Other items, including R01 common database-test target protection, retain their gates. No roadmap item is complete merely because the audit is complete.

## Glassmorphism theme — Authorized 2026-11-08

- [x] Apply UI UX Pro Max glassmorphism through semantic tokens and shared cards, controls, dialogs, auth/account pages and dashboard navigation; keep financial behavior unchanged.
- [x] Verify the final theme with lint/typecheck/build, 40 unit/database tests, one HTTP lifecycle and ten Playwright cases. Light/dark desktop/360px accessibility scans, reduced-transparency/motion and forced-colors checks pass; screenshots were inspected. Manual screen readers/other browsers and physical-device performance remain open.

## Scoped setup — Authorized 2026-11-06

- [x] Verify installed Prisma 7 dependencies, PostgreSQL datasource, Prisma 7 generator and expected local connection settings without disclosing values.
- [x] Correct auto-discovered `prisma.config.ts` to use DIRECT_URL and add the server-only PrismaPg client singleton using DATABASE_URL.
- [x] Generate the model-free client; pass Prisma validation, TypeScript checking and targeted lint.
- [x] Verify successful SELECT 1 for application and direct connections. Both returned 1 after the user's password update on 2026-11-06. The initial model-free restriction was superseded by the subsequent foundation request.

## Phase 0 — Inspect and plan

- [x] Inspect existing source, dependencies, configuration, git state, and relevant installed Next.js guides.
- [x] Create the root agent workflow and six planning documents; preserve generated Next.js rules.
- [x] Record foundation authorization, revised model list, and confirmed MMK/0/Asia/Yangon in DECISIONS.md. D-04 is deferred until receipt feature work.

Exit: foundation scope is recorded and authorized. The separate phase 3 provider approval is now recorded in D-04.

## Phase 1 — Foundation and secure authentication

Depends on phase 0.

- [x] Verify compatible foundation dependencies from official docs, pin Prisma 7.10.1 packages together and lock auth/password/Zod dependencies.
- [x] Configure local PostgreSQL, server environment validation and secret-free setup instructions; add the nine requested domain models plus AuthThrottle, two reviewed/applied migrations and idempotent category seed.
- [x] Add focused test tooling/typecheck, exact MMK helpers and documented bounds, field lengths and eight-hour JWT session lifetime.
- [x] Implement registration, Argon2id, Credentials/JWT login/logout, shared throttling, owner checks, protected rendering, and CSRF/origin protections.
- [x] Add minimal public auth forms, protected account-ready shell, logout, errors and Suspense loading. Dashboard navigation/shadcn/ui styling remains phase 2 work.

Exit: FR-01 passes against PostgreSQL; migration/seed works on an empty development database; no secrets are committed; lint/typecheck/auth tests/build pass. Demonstrate two-user isolation and verify Auth.js plus Cache Components integration before expanding features.

## Phase 2 — Transactions and visualization (first product slice)

Depends on phase 1. Prioritize the end-to-end dashboard before OCR or groups.

- [x] Implement exact whole-kyat money helpers and boundary tests; timezone/currency constants are fixed.
- [x] Add calendar-date helpers and authorized income/expense create/view/edit/delete, type/category/date filters, inclusive date ranges, category checks, retry-safe creation and version conflict handling.
- [x] Build shadcn/ui transaction list/detail/form pages, mobile cards/desktop table, 20-record pagination, delete confirmation, validation feedback, and empty/loading/error/not-found states.
- [x] Keep the basic category seed and add an opt-in, idempotent 24-transaction sample seed restricted to development and the local database; reject production and remote targets before writes.
- [x] Add validation/PostgreSQL tests for transaction operations, unauthorized access, retries, conflicts, pagination and seed safety; extend real HTTP checks through create/edit actions and cross-user/cross-origin rejection.
- [x] Verify transaction desktop/360px layout, forms and confirmations through Playwright, axe and screenshot inspection. Manual assistive-technology assessment remains phase 5 work.
- [x] Implement authenticated PostgreSQL grouping and exact server-side totals for cards, category donut and zero-filled monthly trends, as requested in the dashboard milestone.
- [x] Build responsive Recharts/shadcn UI, keyboard-accessible category controls, exact-value tables/tooltips, shared date/category filters, shortcuts, recent transactions, and loading/empty/error states. Runtime values come from PostgreSQL, not fixtures.
- [x] Verify aggregation, empty datasets, date boundaries, category reconciliation, precision and ownership with unit/PostgreSQL tests; extend HTTP checks for dashboard security and post-mutation refresh.
- [x] Verify real donut clicks/hover, keyboard category toggles, shared date filters and desktop/360px chart layout with isolated Playwright; fix lost focus and tooltip stacking. Native capture itself remains unfixed.

Exit: FR-02 and FR-03 pass, including exact reconciliation, date boundaries, edit/delete refresh, restart persistence, responsive inspection and two-user chart isolation. Applicable automated checks and production build pass.

Transaction/dashboard core browser flows pass isolated Chromium checks. Receipt and group work are also implemented; remaining manual and release verification is tracked below.

## Phase 3 — Receipt review

Depends on phase 2 and D-04 approval. D-04 is now accepted; server-side local Ollama supersedes browser OCR.

- [x] Record the user's local Ollama approval and document temporary server upload, no retention, exact MMK and explicit review boundaries.
- [x] Implement authenticated image validation/decoding, bounded local JSON-schema extraction with a replaceable provider seam, null/uncertainty handling and an editable review with explicit confirmation using the existing transaction creation path.
- [x] Verify validation, mocked provider failures/ambiguity, no save before confirmation, corrected values, ownership, retry safety and dashboard refresh with unit/PostgreSQL/HTTP tests; pass typecheck/lint/build.
- [ ] Benchmark representative non-sensitive real receipts, intended languages and resource use. Local Ollama is now available; two generated English receipts pass five field checks each (46.5/29.3 seconds), which does not close this representative-data gate.
- [x] Verify desktop/360px receipt upload, uncertainty, mocked failures, confirmation and preservation of corrected fields using Playwright/axe and screenshot inspection. Full manual assistive-technology coverage remains pending.

Exit: FR-04 automated criteria pass; explicit confirmation is the sole save step; no paid AI credentials or remote image processing is required. Real recognition and browser checks remain open until observed.

## Phase 4 — Unequal bill groups

Depends on phase 2 and D-03 approval; may follow phase 3 for a simple sequential workflow.

- [x] Implement owner-managed groups, one self label, named participants/guests, bill forms and exact amount/percentage shares with deterministic largest-remainder rounding. Keep MMK and existing schema.
- [x] Show bill/share and repayment histories, paid/owed/sent/received/net balances and deterministic "who owes whom" suggestions; support atomic versioned bill correction/deletion while preserving history.
- [x] Record explicitly confirmed external repayments with retry-payload checks; keep all group records separate from personal transactions/dashboard totals.
- [x] Test exact/percentage/zero/invalid splits, rounding, multiple expenses, repayments/overpayments, limits, retry races, stale edits, same-group and owner authorization, and dashboard isolation with unit/PostgreSQL and real HTTP form/Flight checks.
- [x] Verify core group desktop/360px UI, percentage preview, invalid-total correction, consecutive guest creation, repayments and refresh using the subsequently requested isolated Playwright runner. This is actual browser evidence rather than HTTP alone; the previous native capture mismatch is not claimed fixed.

Exit: FR-05 core automated/browser acceptance passes; exact totals, rounding and repayments reconcile and personal chart totals are unaffected. Manual assistive-technology and broad device/browser assessment remain phase 5 work.

## Phase 5 — MVP verification and handoff

Depends on phases 1–4.

- [x] Run local cross-feature acceptance against PostgreSQL: 40 Node tests, one HTTP lifecycle and eight Playwright cases, with WCAG scans, narrow-screen charts, validation and error recovery.
- [x] Record lint/typecheck/build, schema/migration checks, runtime/development audit results and the two-case local-model benchmark in MVP_REVIEW/PROGRESS; document setup and known limits.
- [ ] Complete manual screen-reader/inclusive-user checks, representative real receipts, physical phones and Firefox/WebKit assessment. Automated scans do not certify WCAG conformance.
- [ ] Confirm deployment/runtime compatibility and production security settings before any separately authorized launch. Do not provision hosting or publish as part of planning.

Exit: every MVP acceptance criterion has evidence, unresolved blockers are explicit, and the user receives a reviewable MVP. Deployment remains separately authorized.
