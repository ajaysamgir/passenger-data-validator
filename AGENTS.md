<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Passenger Data Validator — agent guide

## Workflow

1. **Clarify** — Ask when requirements are unclear; restate affected acceptance criteria.
2. **AC** — Use [`docs/ACCEPTANCE_CRITERIA.md`](docs/ACCEPTANCE_CRITERIA.md) as the single source of truth.
3. **Implement** — Follow project rules in [`.cursor/rules/`](.cursor/rules/).
4. **Verify** — Check off relevant AC items; run `npm run lint` and `npm run build`.

## Project rules (Cursor)

| Rule file | When it applies |
|-----------|-----------------|
| `agent-workflow.mdc` | Always — interactive-first, AC verification |
| `project-standards.mdc` | Always — coding principles, folder layout |
| `nextjs-react.mdc` | `**/*.{ts,tsx}` — Next.js 16 / React patterns |
| `validation-domain.mdc` | `**/*.{ts,tsx}` — passenger field and validation rules |
| `api-architecture.mdc` | `**/api/**`, `**/lib/**` — REST handlers and server layer |

Open **`passenger-data-validator`** as the Cursor workspace folder so these rules load.

## Stack

Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4. Full-stack in one app (Route Handlers + in-memory SQLite).
