# Dark Base and Frosted Glass workspace

Background follow-up (2026-11-08): the user supplied a frosted-glass photograph and requested it on every page. `public/backgrounds/frosted-glass.webp` is an optimized 2560×1434 copy; the source download is unchanged. The global fixed `body::before` layer uses centered cover sizing and an 80% dark overlay in both themes, replacing the previous ambient gradients. This includes public auth and all protected routes without duplicating page markup. Print, forced colors and reduced-transparency modes keep the existing plain-background accessibility fallback.

The user requested the UI UX Pro Max Glassmorphism style for the whole application on 2026-11-08. Python was unavailable; the user chose “Continue without Python (recommended)”. Guidance was read directly from the skill's `SKILL.md`, the active Glassmorphism row in `data/styles.csv`, and the shadcn theme/token guidance. No Python installation, package change, external design service or generated branding is required.

The later dark workspace request supersedes the earlier light-default appearance (D-06). The same permission to continue without Python remains in force. Existing financial features, authorization and precise calculations are preserved.

## Visual direction

- Dark Base defaults to charcoal `#090B11`, sidebar `#10131C`, opaque panels `#141821`, pale primary text and readable muted text. Lavender accents, muted emerald income and coral expenses retain explicit text labels.
- Keep Geist typography and exact, tabular monetary values. Both themes share typography, layout and restrained shadows; no glow or animated ambient effects.
- Frosted Glass adds a static blue/violet ambient background, 78%-opaque navy panels and 16px blur. Fields/popovers remain opaque. Without backdrop-filter, panels use an opaque fallback.
- Use more opaque panels than decorative glass examples to protect financial readability. Centralized tokens govern controls, chart text, marks, grid lines and tooltips.
- Keep charts flat and legible, with six semantic category colors, textual category names and existing exact-value tables. Do not apply glass effects to bars, slices or monetary labels.

## Implementation

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
