# Engineering standards

Applies when implementation is authorized. [REQUIREMENTS.md](REQUIREMENTS.md) owns product acceptance; [ARCHITECTURE.md](ARCHITECTURE.md) owns the proposed structure and domain model.

## Code and boundaries

- Keep TypeScript strict. Use explicit domain types at boundaries, `unknown` for untrusted data, and Zod parsing instead of unsafe assertions or `any`.
- Keep root `app/`; use feature folders for domain code and `components/ui/` for shared shadcn/ui primitives. Reuse existing code before adding helpers. Avoid generic service/repository hierarchies.
- Prefer Server Components; use client boundaries only for interactivity and charts. Receipt extraction runs server-only under D-04; return minimal serializable suggestions. Mark privileged modules server-only.
- Use the installed Next.js documentation for the APIs being changed, including Cache Components and request-dependent rendering. Follow existing Tailwind conventions; introduce dependencies only for an approved task and lock their versions.
- Validate environment variables server-side; expose only intentionally public configuration. Provide a secret-free environment example during setup, explicitly unignoring it if needed (`.env*` is currently ignored).

## Input, authorization, and persistence

- Apply server-side Zod schemas to every form/action/handler boundary: lengths, enums, IDs, dates, amount precision, and configured bounds. Client validation improves UX but is not authoritative. OCR output remains untrusted input.
- Resolve identity on the server. Scope every query and write to the owner, including nested group/member/bill relationships. Reject unauthorized IDs without leaking record existence. Authorize again at each callable mutation, even behind a protected layout.
- Use parameterized Prisma operations. Make dependent writes atomic; enforce structural constraints in the database and cross-row invariants in the one authorized write path. Handle unique-key races, stale versions, and failed transactions deliberately.
- Implement retry-safe create submissions. Preserve entered values after validation or network errors and disable duplicate clicks as a UX aid.
- Use the exact-money and calendar-date rules in ARCHITECTURE.md; floating-point arithmetic is forbidden for financial calculations. Test parsing, bounds, serialization, aggregation, and split reconciliation.
- Use established authentication libraries and adaptive password hashing. Apply shared login/registration throttles and origin/CSRF safeguards. Keep private query results out of shared caches.
- Commit migrations and review their data impact. Destructive schema changes, data resets, paid services, and production deployment require explicit authorization.

## Visualization and accessibility

- Keep visualization primary: legible cards, clear categories, monthly trends, consistent date/category filters, useful loading/empty/error states, and currency-aware exact labels.
- Use Recharts with a bounded responsive container. Charts must have text/table equivalents and visible labels/legends; never rely solely on color or hover.
- Use semantic controls, associated labels, keyboard operation, visible focus, accessible errors, and adequate contrast. Check mobile layouts at 360px and desktop widths.
- Keep chart rendering approximation separate from authoritative money values. Show the same scoped date range and accounting definition across all summaries.

## Verification and completion

For documentation-only changes: inspect the diff, internal links, decision statuses, and consistency; no application test scaffolding is needed.

For code changes: inspect `package.json` for available commands. Foundation unit/integration tests use Node's test runner and tsx; HTTP auth tests run against a production build. Follow [SETUP.md](SETUP.md) for their prerequisites. Do not report unavailable scripts or unrun checks as passing.

Require focused unit tests for money/date parsing, receipt parsing, and split invariants; PostgreSQL-backed integration checks for authorization, persistence, constraints, retries, and rollback; and a small end-to-end path covering registration/login, manual entry, dashboard updates, receipt review, and unequal bills. Include two-user isolation, invalid/expired sessions, throttling, concurrent edits, and direct unauthorized action requests. Mock OCR in deterministic UI checks; separately benchmark real OCR on non-sensitive sample images.

Run lint, typecheck, applicable tests, and a production build before completing an implementation phase. Inspect responsive chart behavior and keyboard/accessibility paths when UI changes. Report environmental blockers and known limitations; a missing database or secret makes a check blocked, not passed. Update TASKS.md and PROGRESS.md only with observed results.
