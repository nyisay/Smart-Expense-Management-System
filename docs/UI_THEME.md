# Dark Base and Frosted Glass workspace

Background follow-up (2026-11-08): the user supplied a frosted-glass photograph and requested it on every page. `public/backgrounds/frosted-glass.webp` is an optimized 2560×1434 copy; the source download is unchanged. The global fixed `body::before` layer uses centered cover sizing and an 80% dark overlay in both themes, replacing the previous ambient gradients. This includes public auth and all protected routes without duplicating page markup. Print, forced colors and reduced-transparency modes keep the existing plain-background accessibility fallback.

The user requested the UI UX Pro Max Glassmorphism style for the whole application on 2026-11-08. Python was unavailable; the user chose “Continue without Python (recommended)”. Guidance was read directly from the skill's `SKILL.md`, the active Glassmorphism row in `data/styles.csv`, and the shadcn theme/token guidance. No Python installation, package change, external design service or generated branding is required.

The later dark workspace request supersedes the earlier light-default appearance (D-06). The same permission to continue without Python remains in force. Existing financial features, authorization and precise calculations are preserved.

## Visual direction

- Dark Base defaults to charcoal `#090B11`, sidebar `#10131C`, opaque panels `#141821`, pale primary text and readable muted text. Lavender accents, muted emerald income and coral expenses retain explicit text labels.
- Keep Geist typography and exact, tabular monetary values. Both themes share typography, layout and restrained shadows; no glow or animated ambient effects.
- Frosted Glass uses the shared photograph background, 45%-opaque navy panels and 16px blur, following the user's request for more transparency. Fields/popovers remain opaque. Without backdrop-filter, panels use an opaque fallback. Appearance labels/selectors share one horizontal row in the sidebar/mobile drawer and account settings. The user subsequently requested removal from login/sign-up and the top navbar; those views inherit the selected theme without displaying a selector.
- Use more opaque panels than decorative glass examples to protect financial readability. Centralized tokens govern controls, chart text, marks, grid lines and tooltips.
- Keep charts flat and legible, with six semantic category colors, textual category names and existing exact-value tables. Do not apply glass effects to bars, slices or monetary labels.

## Implementation

### Toast feedback

`components/ui/toaster.tsx` mounts once below the root page content inside Suspense, using the already installed [Radix Toast primitive](https://www.radix-ui.com/primitives/docs/components/toast) and shared semantic tokens. Latest-notification replacement avoids stacking banners. Success notices last six seconds and errors ten, with manual dismissal, F8 keyboard access and Radix announcement/pause behavior. Phone notifications appear at the top so they do not cover form submission buttons; larger screens use bottom-right placement.

Sign-in success appears only after a submitted login reaches the protected dashboard. Its short-lived intent marker stays in JavaScript memory for at most 60 seconds and is cleared on a returned failure; it is not authentication state and is never stored in localStorage/cookies or sent to the server. Registration repeats the server's generic response instead of asserting that an email/account exists. Main transaction, receipt, group and budget forms also show native-validation/returned-error toasts while retaining inline messages and field errors. Repeated identical failed submissions can show a new notice; ordinary rerenders do not replay one. Receipt extraction carries an explicit UI `ok` flag so a fresh suggestion is labeled ready for review, never saved.

### Shared shadcn control refinement

The user requested replacing remaining plain controls across the system. Added the official Radix/nova Checkbox, Collapsible, Progress, Alert, Skeleton and Table component sources using the existing installed Radix, cn and Lucide packages. No dependency version changed. The registry checkbox icon placeholder is resolved to the project's Lucide Check icon; Progress passes its numeric value to Radix so existing accessible progress values remain accurate. Static tables remain Server Components, with focusable scroll containers for keyboard use.

Receipt review and repayment confirmation use labeled Checkbox controls while retaining `confirmed=yes`, required validation, controlled resets and explicit save/record actions. A shared Disclosure composition combines Collapsible and Button for exact chart tables, group shares and receipt previews; force-mounted content preserves the temporary preview image/ref while collapsed. Category drill-down uses the existing Button. Standardized Alert feedback spans auth, transaction, receipt, group and budget forms. Skeletons provide consistent dashboard/transaction/receipt/group/budget loading surfaces. Transaction/dashboard tables share the same shadcn structure and existing exact values, captions, filters and pagination.

Component references: [Checkbox](https://ui.shadcn.com/docs/components/radix/checkbox), [Collapsible](https://ui.shadcn.com/docs/components/radix/collapsible), [Progress](https://ui.shadcn.com/docs/components/radix/progress). Existing shadcn inputs/native selects and private hidden form identities were retained because they already support the working form contract.

`app/globals.css` owns semantic shadcn/Tailwind colors, `.glass-panel`, `.glass-control`, responsive shell spacing and accessibility fallbacks. Shared primitives carry the treatment into transactions, receipt review, groups and authentication. The dashboard foregrounds selected reporting dates, four financial summary cards, existing charts/comparisons and a desktop recent-transactions table/mobile list. The savings card uses the already-computed exact rate; no figures are fabricated.

Dark Base is the default. `components/theme-switcher.tsx` persists only `smart-expense-theme` (`dark`/`frosted`) in localStorage. A fixed script in the root head applies a recognized preference before body paint; storage denial falls back safely. No session/token/financial data is stored. Chart colors follow semantic variables without changing aggregates.

`components/application-shell.tsx` receives minimal profile fields after protected-layout authentication. Desktop reserves a 248px grid column, collapsible to 80px with labeled icons/tooltips. Mobile/tablet uses an installed Radix Dialog drawer with focus containment, Escape and focus return. Sidebar/header offer profile, appearance and the existing logout action. A skip link reaches page content. No shadcn Sidebar file existed; installed Radix and existing shadcn controls avoid new dependencies. Analytics links to `/dashboard#analytics`; Settings reuses `/app` with account/appearance controls. No empty standalone pages or dead links are created.

Default inputs/buttons are at least 44px tall; coarse-pointer buttons/selects also receive a 44px minimum height. Focus indicators, labels, validation messages, disabled states, destructive confirmations and password-manager support remain available.

## Fallbacks and verification

- Without backdrop-filter support, cards use opaque surfaces.
- `prefers-reduced-transparency: reduce` removes blur and decorative lighting and uses opaque panels/fields.
- `prefers-reduced-motion: reduce` reduces transitions/animations; the ambient background never animates.
- Forced-colors mode removes decorative lighting/shadows and preserves visible panel boundaries. Printing removes the decorative background and glass effects.
- `test:e2e` scans auth, transaction, dashboard, receipt, group and budget states in Dark Base/Frosted Glass at desktop and 360px. Navigation coverage checks collapse tooltips, drawer focus, persisted preference after reload and retained dashboard filters. Focused navigation also exercises 768×1024 tablet and 800×360 landscape drawer scrolling/accessibility. Theme switches await transitions before scanning. See PROGRESS for actual run outcomes.
- A separate browser case exercises reduced transparency/motion and forced colors at both viewport sizes. Screenshots use synthetic fixture data in ignored `test-results/`.

See the latest [PROGRESS.md](PROGRESS.md) handoff for executed results. Automated Chromium/axe checks complement visual inspection; screen readers, real devices, Firefox/WebKit and hardware blur performance remain manual follow-up work.
