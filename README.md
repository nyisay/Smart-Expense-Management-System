# Smart Expense Management

A visualization-first expense application built with Next.js App Router and PostgreSQL. The authenticated dashboard shows income/expense/balance summaries, an interactive category donut, monthly expense trends and recent transactions from the owner's database records. Transaction management supports create, view, edit, confirmed delete, filters and pagination with exact whole-MMK amounts. Receipt upload uses local Ollama vision with editable review and explicit expense confirmation; no receipt images are retained. Smart Group Splitting supports owner-managed participants/guests, exact amount/percentage shares, bill corrections, balances, suggested repayments and recording completed external repayments, separately from personal transactions.

Start with [local setup and the manual verification checklist](docs/SETUP.md). Copy the placeholders in [.env.example](.env.example) into a local ignored environment file; keep real credentials private.

- [Requirements and acceptance criteria](docs/REQUIREMENTS.md)
- [Architecture and schema relationships](docs/ARCHITECTURE.md)
- [Decisions and approved scope](docs/DECISIONS.md)
- [Engineering standards](docs/STANDARDS.md)
- [Tasks](docs/TASKS.md) and [progress](docs/PROGRESS.md)
- [MVP quality review and remaining issues](docs/MVP_REVIEW.md)
- [Domain glossary](GLOSSARY.md) and [Codex workflow](AGENTS.md)
