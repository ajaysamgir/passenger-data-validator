# Study Notes — Vibe Coding, Cursor AI & AI Engineering

> Created from the hands-on experience building the Airline Passenger Data Validator using Cursor AI.

---

## Part 1: Vibe Coding

### What is Vibe Coding?

Vibe coding is a style of software development where you describe what you want in natural language and let an AI model write most of the code. You act as the **director** (deciding what to build, reviewing output, catching mistakes) rather than the **typist** (writing every line yourself).

The term was coined by Andrej Karpathy in early 2025.

### Core Idea

```
Traditional:  You → write code → run → fix → repeat
Vibe coding:  You → describe intent → AI writes code → you review/steer → repeat
```

### Key Principles

1. **Prompt clarity beats prompt length.** "Add passport validation that requires 1–3 letters then 5–7 digits" is better than a vague "improve validation".
2. **Review every diff.** The AI can be confidently wrong. Always read what it changed.
3. **Iterate in small steps.** Small focused prompts produce better, more reviewable output than giant one-shot prompts.
4. **Keep humans in the loop for architecture.** Let AI write boilerplate; you decide folder structure, naming conventions, and system design.
5. **Tests still matter.** Even with AI-generated code, tests catch regressions.

### When Vibe Coding Works Well

- Boilerplate-heavy tasks (CRUD, form validation, API routes)
- Translating a spec into code
- Refactoring well-understood code
- Generating documentation (like this file!)

### When to Be Careful

- Security-sensitive code (auth, encryption) — review very carefully
- Complex business logic — AI can miss edge cases
- Performance-critical paths — AI tends to write readable, not optimal, code
- When requirements are ambiguous — garbage in, garbage out

### Vibe Coding in This Project

- The entire project scaffold was generated from acceptance criteria (`docs/ACCEPTANCE_CRITERIA.md`)
- Passport validation improvement was directed with one natural language prompt
- Debugging (stale `.next` cache, wrong Next.js version) required human diagnosis + AI execution

---

## Part 2: Cursor AI

### What is Cursor?

Cursor is an AI-powered code editor built on VS Code. It integrates large language models (LLMs) directly into the editing experience so AI assistance is a first-class citizen, not a plugin bolted on.

### Key Features

| Feature | What it does |
|---------|-------------|
| **Agent mode** | AI autonomously reads files, writes code, runs commands, fixes errors |
| **Chat (Ask mode)** | Ask questions about code without making changes |
| **Inline edit** | Select code, press Ctrl+K, describe a change |
| **Tab completion** | Smarter autocomplete that predicts multi-line edits |
| **`.cursor/rules/`** | Project-level instructions the AI always follows |
| **`@` mentions** | Reference files, docs, or symbols directly in your prompt |

### `.cursor/rules/` — Project Memory

Cursor reads `.mdc` files in `.cursor/rules/` and includes them as context for every relevant AI action. This project used:

- `validation-domain.mdc` — told the AI the passport regex, which fields exist, and where validation lives
- `api-architecture.mdc` — told the AI the endpoint contracts and response shapes

**Best practice:** Write rules for the things you'd otherwise have to repeat in every prompt.

### Agent Mode vs Chat vs Inline Edit

| Mode | Best for |
|------|----------|
| Agent | Multi-file tasks, "go build this feature" |
| Chat | "Why does this code do X?" or exploring the codebase |
| Inline edit (Ctrl+K) | Quick, targeted changes to a specific block |

### Lessons from This Project

1. **Cursor reads terminal output.** When the build failed with `next.config.ts` error, Cursor read the terminal file and diagnosed the issue automatically.
2. **Background shell tasks.** Long-running commands (builds, installs) are moved to background; Cursor monitors them and continues other work.
3. **`globalThis` for singletons.** Cursor correctly used the `globalThis` pattern for SQLite to survive Next.js hot-reload — this is idiomatic knowledge the AI had.
4. **The AI won't always get versions right.** `"next": "^9.3.3"` in `package.json` was a bug in the original generated code that needed human/AI diagnosis.

### Effective Prompting in Cursor

| Do | Don't |
|----|-------|
| Reference specific files with `@filename` | Say "somewhere in the code" |
| State the constraint ("keep the same API shape") | Assume the AI remembers past context |
| Give an example of the expected output | Give only vague goals |
| Break large features into steps | Dump a 500-line spec and say "build this" |

---

## Part 3: AI Engineering

### What is AI Engineering?

AI Engineering is the discipline of building **products and systems using AI models as components**. It is distinct from ML Research (training new models) and MLOps (deploying models at scale).

An AI Engineer:
- Knows how to prompt LLMs effectively
- Understands context windows, token limits, and model capabilities
- Builds applications that use LLM APIs (OpenAI, Anthropic, etc.)
- Integrates AI tools into software engineering workflows

### The AI Stack (2025–2026)

```
Applications (Cursor, GitHub Copilot, v0, Bolt)
         ↓
AI Engineering Layer (prompting, RAG, agents, evals)
         ↓
Foundation Models (GPT-4o, Claude, Gemini, Llama)
         ↓
Infrastructure (GPUs, CUDA, distributed training)
```

As an AI Engineer, you mostly work at the top two layers.

### Key Concepts

#### 1. Prompting Techniques

| Technique | Description | Example |
|-----------|-------------|---------|
| Zero-shot | Direct instruction, no examples | "Validate passport format" |
| Few-shot | Provide examples in the prompt | "Valid: AB1234567. Invalid: 123456. Validate this: ..." |
| Chain-of-thought | Ask model to reason step by step | "Think through the validation rules, then write the code" |
| System prompt | Set persistent context/role | `.cursor/rules/` files |
| Role prompting | Give the model an identity | "You are a senior TypeScript developer..." |

#### 2. Context Windows

Every LLM has a fixed context window (e.g. 200k tokens for Claude). Everything — your instructions, the conversation history, referenced files, the code being edited — must fit in this window.

**Implication for coding agents:** Cursor manages context automatically, but if your project is huge, the AI might not "see" a relevant file unless you `@mention` it.

#### 3. Retrieval-Augmented Generation (RAG)

Instead of stuffing your entire codebase into a prompt, a RAG system:
1. Embeds all code into a vector database
2. When you ask a question, retrieves the most relevant chunks
3. Passes only those chunks to the LLM

Cursor's codebase indexing is a form of RAG — it finds relevant files before sending them to the model.

#### 4. AI Agents

An **agent** is an LLM that can take actions (call tools, run code, search the web, write files) in a loop until a goal is achieved.

```
Goal → LLM thinks → picks a tool → executes → observes result → LLM thinks again → ...
```

Cursor Agent:
- Tools available: read file, write file, run shell command, search codebase
- Loop: continue until the task is done or it asks for user input
- Can fix its own errors (linter feedback → edits)

#### 5. Evaluation (Evals)

How do you know if an AI feature works? You write **evals** — automated tests that measure LLM output quality. This is one of the hardest problems in AI Engineering.

Types:
- **Exact match** — output must equal expected string
- **LLM-as-judge** — use another LLM to score the output
- **Human review** — manual spot-checking

#### 6. Tool Use / Function Calling

Modern LLMs can call structured functions (tools) instead of only returning text. The model decides when to call a tool and with what arguments.

This project is effectively a "tool-using agent" — Cursor's underlying model decided to:
- Call `read_file` to understand the codebase
- Call `write_file` to make changes
- Call `run_shell` to build and test
- Observe results and iterate

---

## Part 4: Patterns Used in This Project

### Schema-First Design

Define a single Zod schema → derive TypeScript types from it → use the same schema on client and server.

```typescript
// One schema
const passengerInputSchema = z.object({ ... });

// Types derived automatically
type PassengerInput = z.infer<typeof passengerInputSchema>;

// Same schema used client-side and server-side
passengerInputSchema.safeParse(formValues);     // client
passengerInputSchema.safeParse(requestBody);    // server
```

**Why it matters:** Prevents duplication drift — if you change a rule in the schema, both sides update automatically.

### Defence in Depth (Validation)

Never trust the client. Always re-validate on the server even if the client already validated.

```
Client validation   →  fast UX feedback, prevents unnecessary network calls
Server validation   →  security, catches bypassed/modified requests
Database constraint →  last line of defence (UNIQUE constraint on passport)
```

### Service Layer Pattern

Route handlers are thin — they parse input, call a service function, and format a response. All business logic lives in the service.

```
route.ts → validateAndStorePassenger() → parsePassengerInput() + findPassengerByPassport() + insertPassenger()
```

This makes code testable (you can test the service without an HTTP request) and readable.

### Singleton Pattern for Server Resources

```typescript
const globalForDb = globalThis as typeof globalThis & {
  __passengerDb?: AppDatabase;
};
```

Prevents creating multiple DB connections during Next.js hot-reload in development.

---

## Part 5: Interview Questions & Answers

### Vibe Coding / AI-Assisted Development

**Q: What is vibe coding and how is it different from using GitHub Copilot?**
A: Vibe coding is a development style where you describe intent and the AI writes most of the code, with you directing and reviewing. GitHub Copilot is one tool for this but operates at the autocomplete level. Cursor's Agent mode goes further — it reads multiple files, plans changes, runs commands, and iterates autonomously, closer to having a junior developer pair-programming with you.

**Q: What are the risks of vibe coding?**
A: (1) Security bugs — AI can generate code that looks correct but has vulnerabilities. (2) Outdated knowledge — models may suggest deprecated APIs or wrong package versions (as happened with `"next": "^9.3.3"` in this project). (3) Hallucination — confident-sounding but wrong answers. (4) Dependency on tools — developers may not understand the code they ship.

**Q: How do you ensure quality when using AI-generated code?**
A: Code reviews (treat AI output like any PR), automated tests, linting (ESLint/TypeScript), running builds, and understanding what was generated before merging.

---

### Next.js / React

**Q: What is the App Router in Next.js?**
A: The App Router (introduced in Next.js 13) uses the `app/` directory with file-based routing. It supports React Server Components by default, co-located layouts, and streaming. Route handlers in `route.ts` replace the old `pages/api/` pattern.

**Q: When do you use `"use client"` in Next.js?**
A: When a component needs browser-only APIs (`useState`, `useEffect`, event handlers, `localStorage`). Server Components are the default and run only on the server — they can't use hooks or event handlers. In this project, `PassengerForm` and `PassengerList` are client components because they use `useState`, `useMemo`, and `useEffect`.

**Q: What is hydration?**
A: The process where React takes server-rendered HTML and "attaches" JavaScript to make it interactive in the browser. If the client-rendered output differs from the server-rendered HTML, you get a hydration error.

---

### Zod & Validation

**Q: Why use Zod over writing manual validation?**
A: Zod gives you (1) type inference — the schema IS the TypeScript type, (2) composable rules, (3) clear error messages, (4) a single source of truth for client and server, and (5) `safeParse` that never throws, making error handling explicit.

**Q: What is the difference between `parse` and `safeParse` in Zod?**
A: `parse` throws a `ZodError` if validation fails. `safeParse` returns `{ success: true, data }` or `{ success: false, error }` — never throws. `safeParse` is preferred in application code because it keeps error handling explicit and avoids try/catch.

**Q: What is `superRefine` in Zod?**
A: A method for adding custom cross-field validation rules that can't be expressed with individual field rules. In this project it checks that departure ≠ destination and that the travel date is not in the past.

---

### TypeScript

**Q: What is `z.infer` and why is it useful?**
A: `z.infer<typeof schema>` extracts the TypeScript type that a Zod schema represents. This means you define your data shape once (in Zod) and TypeScript types are derived automatically — no duplication.

**Q: What is the `as const` assertion?**
A: Tells TypeScript to infer the narrowest possible type. `["Male", "Female"] as const` creates a readonly tuple `["Male", "Female"]` rather than `string[]`. Used in `ALLOWED_COUNTRIES` so TypeScript knows the exact values, enabling the `AllowedCountry` union type.

---

### SQLite / Databases

**Q: Why use an in-memory SQLite database?**
A: For learning/demo projects it eliminates external dependencies (no database server to install), is fast, and resets on restart. Node.js 22's built-in `node:sqlite` means zero npm dependencies for the DB layer.

**Q: What is the risk of in-memory databases in production?**
A: All data is lost when the process stops. Not suitable for production unless data is intentionally ephemeral (caches, sessions with external backing).

---

### System Design

**Q: Explain the validation strategy in this application.**
A: Three-layer defence: (1) Client-side Zod validation on every keystroke for immediate UX feedback, (2) server-side re-validation with the same schema (never trust the client), (3) database UNIQUE constraint on `passport_number` as a final safeguard against race conditions or bypassed validation.

**Q: How would you scale this application?**
A: Replace `node:sqlite` in-memory with PostgreSQL or MySQL. Add authentication. Add pagination to the passenger list. Extract the service layer into a separate API service if traffic grows. Add Redis caching for read-heavy endpoints.

---

## Part 6: Quick Reference Cheatsheet

### Zod Common Patterns

```typescript
z.string().min(1).max(100)           // required string with length bounds
z.string().email()                    // email validation
z.string().regex(/pattern/)           // regex validation
z.string().trim()                     // strip whitespace before other checks
z.coerce.number().int().min(1).max(120) // coerce string to number + range check
z.enum(["Male", "Female", "Other"])   // enum
z.object({ ... }).superRefine(...)    // cross-field validation
schema.safeParse(data)                // safe parsing (no throw)
z.infer<typeof schema>                // extract TypeScript type
```

### Next.js App Router Quick Reference

```
app/page.tsx              → GET /
app/about/page.tsx        → GET /about
app/api/foo/route.ts      → GET/POST/PUT/DELETE /api/foo
app/layout.tsx            → wraps all pages
"use client"              → opt into client component
export const runtime = "nodejs"  → use Node.js APIs in route handlers
```

### TypeScript Utility Types Used

```typescript
Partial<Record<K, V>>     // object where all keys are optional
keyof T                   // union of all keys of type T
typeof X                  // infer type from value X
as const                  // narrow to literal types
T & { id: number }        // intersection type (extend)
```

### Common `package.json` Scripts

```bash
npm run dev     # Start dev server (hot reload)
npm run build   # Production build + type check
npm run start   # Start production server (after build)
npm run lint    # Run ESLint
```
