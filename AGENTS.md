# Codex workflow

Smart Expense Management is a visualization-first MVP. The database/authentication foundation, transaction management and dashboard are authorized and implemented. Receipt processing, group UI, and settlement flows need a subsequent feature request. Follow the accepted scope and remaining proposals in [docs/DECISIONS.md](docs/DECISIONS.md).

## Start each task

1. Read [docs/PROGRESS.md](docs/PROGRESS.md) for the repository baseline and last handoff, then [docs/TASKS.md](docs/TASKS.md) for the next eligible task.
2. Before implementing behavior, read its requirements and acceptance criteria in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). Before changing schema, routes, data flow, or dependencies, read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DECISIONS.md](docs/DECISIONS.md).
3. Read [docs/STANDARDS.md](docs/STANDARDS.md) before writing code. Inspect the touched files and `git status`; preserve unrelated work.
   For setup, authentication verification, or migrations, read [docs/SETUP.md](docs/SETUP.md). For financial terminology or model changes, read [GLOSSARY.md](GLOSSARY.md).
4. Select one bounded task whose dependencies and approval gates are satisfied. Ask for approval before changing a major architecture decision; record proposals and the user's actual response in DECISIONS.md. Silence is not approval.

## Complete each task

- Make the smallest complete change. Keep route files thin and domain behavior in feature folders; create folders only when needed.
- Validate untrusted input with Zod on the server. Authorize every server read and mutation against the authenticated user; client checks and layouts are insufficient.
- Keep money exact through storage, calculations, and serialization. Treat receipt extraction as an untrusted suggestion requiring explicit review.
- Run checks appropriate to the change using scripts actually present in `package.json`; report skipped checks and failures honestly. Use STANDARDS.md for the verification bar.
- Mark TASKS.md complete only when its acceptance criteria pass. Update PROGRESS.md with changes, checks, blockers, and the next task. Update requirements or decisions when approved scope changes.
- Keep secrets, passwords, session tokens, raw OCR output, and receipt images out of logs and committed files.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
