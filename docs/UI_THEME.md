# Frosted Glass workspace

Frosted Glass is the only appearance under D-10 (2026-11-10). Dark Base and all Appearance selectors are removed. The server renders the frosted state immediately; old saved preferences are ignored and no browser theme storage/bootstrap is required. The shared background photograph is preserved.

Logout confirmation (2026-11-11; layout refinement 2026-11-12): Settings and expanded/collapsed/mobile navigation share the existing shadcn AlertDialog and semantic panel/button tokens. Keep No/Yes in one centered bottom row at every viewport width. Yes uses the destructive Button variant with a solid semantic red fill and dark text for contrast, scoped to this control. No receives initial focus; No/Escape close and restore trigger focus, while Yes submits the existing logout action with pending feedback. Keep keyboard focus containment and nested mobile-drawer behavior; no new appearance or authentication policy is introduced.

## Date and month pickers — 2026-11-11

Existing date controls use the shared shadcn Calendar/Popover composition with the current semantic popover/button/input tokens. Calendar icons open a labeled popup with keyboard support, month navigation, a bounded year input, Clear and Today. Budgets use a twelve-month button grid and This month. Popovers stay within the viewport and scroll when space is limited. ISO text entry remains available for keyboard users; it is validated as a real date/month before submission. Forms still post the existing ISO field names and values. Day labels include their visible number, and opening is disabled until hydration so immediate keyboard activation is reliable. No theme, money, authentication or database behavior changes.

## Reference-based authentication layout — 2026-11-10

Auth field refinement (2026-11-11): name, email and password inputs keep their existing underline on hover. Focus uses a 2px highlighted underline with no rectangular ring; the auth-scoped override preserves keyboard focus feedback and leaves shared controls elsewhere unchanged.

Login/sign-up use a transparent layout grid with equal 50/50 desktop columns, a 972px maximum width and 655.2px desktop minimum height, with no enclosing background Card or inset padding. The image and frosted form panels meet without a gap, with rounded exterior corners; mobile retains a single rounded form. The left `[data-auth-photo]` element in `features/auth/auth-form.tsx` displays the user's supplied dark market-chart photograph from `public/auth/account-market-photo.webp` (1600×2400, 706,962 bytes), replacing the earlier pastel artwork. This is a locally optimized copy of `arturo-anez-9rz5x8LGBb8-unsplash.jpg` (2400×3600); the original download is unchanged. Next.js Image uses a reserved relative container, responsive sizes and object-cover to fill the entire panel without stretching, with centered cropping when proportions differ. The illustration is decorative and excluded from the accessibility tree. Hide the panel below the lg breakpoint so mobile/tablet space prioritizes the form. The original download is unchanged; no GIF or new dependency is used.

The right panel contains the existing brand, heading, labeled email/password/name inputs, eye control, inline/toast feedback, rounded primary action and cross-link to the other authentication page. Auth-scoped underline fields and spacing use existing semantic tokens. No theme token, global background CSS or photograph asset changed. Keep existing email/password functionality and eight-hour JWT policy; the reference's Google login, password recovery and 30-day remember option do not create approved backend functionality and are not rendered as fake controls.

The reference-layout milestone originally verified both selectable themes. Current browser checks use the sole Frosted Glass appearance, including ignored legacy dark preferences, denied storage, image loading/cover sizing, panel sizing/visibility, keyboard behavior and no horizontal overflow. The GIF was removed at the user's request; the supplied static illustration now fills its originally reserved panel.

Background follow-up (2026-11-08): the user supplied a frosted-glass photograph and requested it on every page. `public/backgrounds/frosted-glass.webp` is an optimized 2560×1434 copy; the source download is unchanged. The global fixed `body::before` layer uses centered cover sizing and an 80% dark overlay, replacing the previous ambient gradients. This includes public auth and all protected routes without duplicating page markup. Print, forced colors and reduced-transparency modes keep the existing plain-background accessibility fallback.

The user requested the UI UX Pro Max Glassmorphism style for the whole application on 2026-11-08. Python was unavailable; the user chose “Continue without Python (recommended)”. Guidance was read directly from the skill's `SKILL.md`, the active Glassmorphism row in `data/styles.csv`, and the shadcn theme/token guidance. No Python installation, package change, external design service or generated branding is required.

The D-06 dark workspace request superseded the earlier light default; D-10 subsequently retired its Dark Base option while retaining Frosted Glass. The permission to continue without Python remains in force. Existing financial features, authorization and precise calculations are preserved.

## Visual direction

- Frosted Glass uses charcoal `#090B11`, sidebar `#10131C`, pale primary text and readable muted text. Lavender accents, muted emerald income and coral expenses retain explicit text labels.
- Keep Geist typography and exact, tabular monetary values, consistent spacing and restrained shadows; no glow or animated ambient effects.
- Use the shared photograph background, 45%-opaque navy panels and 16px blur, following the user's transparency request. Fields/popovers remain opaque. Without backdrop-filter, panels use the opaque `#191F30` fallback. There are no Appearance controls on public pages, navbar, sidebar, mobile drawer or Settings.
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

The root layout renders `data-theme="frosted"`; all frosted tokens are default CSS variables. The old theme-switcher component and preference bootstrap are deleted. No theme preference is read or written, so legacy values and denied storage cannot select Dark Base or cause a theme flash. The `.dark` Tailwind marker remains solely for dark-surface utility variants. Chart colors follow semantic variables without changing aggregates.

`components/application-shell.tsx` receives minimal profile fields after protected-layout authentication. Desktop reserves a 248px grid column, collapsible to 80px with labeled icons/tooltips. Mobile/tablet uses an installed Radix Dialog drawer with focus containment, Escape and focus return. Sidebar/header offer profile and the existing logout action. A skip link reaches page content. Installed Radix and existing shadcn controls avoid new dependencies. Analytics links to its dedicated `/analytics` page under D-13, preserving date/category filters between reports. Settings reuses `/app` with profile, reporting preferences and password/security controls. Analytics reuses frosted summary cards, semantic Recharts colors, exact tables, shared filters and comparisons. Its labeled chart-mode selector and month-table links expose the interaction without relying on color or hover. No empty standalone pages or dead links are created.

Default inputs/buttons are at least 44px tall; coarse-pointer buttons/selects also receive a 44px minimum height. Focus indicators, labels, validation messages, disabled states, destructive confirmations and password-manager support remain available.

## Fallbacks and verification

- Without backdrop-filter support, cards use opaque surfaces.
- `prefers-reduced-transparency: reduce` removes blur and decorative lighting and uses opaque panels/fields.
- `prefers-reduced-motion: reduce` reduces transitions/animations; the ambient background never animates.
- Forced-colors mode removes decorative lighting/shadows and preserves visible panel boundaries. Printing removes the decorative background and glass effects.
- `test:e2e` scans auth, transaction, dashboard, receipt, group and budget states in Frosted Glass at desktop and 360px. Navigation coverage checks collapse tooltips, drawer focus, absence of Appearance selectors, ignored legacy preferences after reload and retained dashboard filters. Public auth cases verify server-rendered frosted markup and usable pages when storage is denied. Navigation also exercises 768×1024 tablet and 800×360 landscape drawer scrolling/accessibility. See PROGRESS for actual run outcomes.
- A separate browser case exercises reduced transparency/motion and forced colors at both viewport sizes. Screenshots use synthetic fixture data in ignored `test-results/`.

See the latest [PROGRESS.md](PROGRESS.md) handoff for executed results. Automated Chromium/axe checks complement visual inspection; screen readers, real devices, Firefox/WebKit and hardware blur performance remain manual follow-up work.
