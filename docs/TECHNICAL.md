# Technical Documentation — Airline Passenger Data Validator

> **Diagrams:** All UML diagrams are in [DIAGRAMS.md](./DIAGRAMS.md). Inline links are provided at each relevant section.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| UI Library | React | 19.2.4 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Validation | Zod | 4.4.x |
| Database | Node.js built-in `node:sqlite` (`DatabaseSync`) | Node ≥ 22.5 |
| Runtime | Node.js | ≥ 22.5.0 |

---

## Project Structure

```
passenger-data-validator/
├── app/
│   ├── layout.tsx                      # Root HTML shell, Geist fonts, Tailwind
│   ├── page.tsx                        # Entry point → renders <PassengerPage>
│   ├── globals.css                     # Tailwind v4 import + CSS variables
│   └── api/
│       ├── passenger/
│       │   └── validate/route.ts       # POST /api/passenger/validate
│       └── passengers/route.ts         # GET + DELETE /api/passengers
│
├── components/
│   ├── ui/
│   │   └── FormField.tsx               # Reusable label+input+error wrapper
│   └── passenger/
│       ├── PassengerPage.tsx           # Page layout: form + list side-by-side
│       ├── PassengerForm.tsx           # Full controlled form with Zod validation
│       └── PassengerList.tsx           # Fetches + renders stored passengers
│
├── lib/
│   ├── types/
│   │   ├── passenger.ts                # PassengerInput, PassengerRecord types
│   │   └── api.ts                      # ApiSuccessResponse, ApiFailureResponse
│   ├── validation/
│   │   ├── constants.ts                # ALLOWED_COUNTRIES, GENDER_OPTIONS
│   │   ├── passenger-schema.ts         # Zod schema + regex constants + helpers
│   │   └── parse-passenger.ts          # parsePassengerInput + normalizePassengerInput
│   ├── services/
│   │   └── passenger-service.ts        # validateAndStorePassenger, getPassengers, removeAllPassengers
│   ├── db/
│   │   ├── client.ts                   # DatabaseSync init, schema creation, global singleton
│   │   ├── passengers.ts               # CRUD: list, find, insert, clear
│   │   └── seed.ts                     # Two demo passengers on first startup
│   └── api/
│       └── logger.ts                   # logApiRequest — respects LOG_LEVEL env var
│
├── docs/
│   ├── ACCEPTANCE_CRITERIA.md
│   ├── FUNCTIONAL.md
│   ├── TECHNICAL.md
│   └── STUDY_NOTES.md
│
├── next.config.js
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

---

## Architecture Overview

> See full diagrams: [System Architecture →](./DIAGRAMS.md#1-system-architecture) | [Component Tree →](./DIAGRAMS.md#2-component-tree) | [Module Dependency Graph →](./DIAGRAMS.md#8-module-dependency-graph)

```
Browser (React 19)
  PassengerPage → PassengerForm + PassengerList

Next.js 16 App Router (Node.js ≥ 22.5)
  POST /api/passenger/validate → passenger-service → parse/validate → SQLite
  GET  /api/passengers         → passenger-service → SQLite
  DELETE /api/passengers       → passenger-service → SQLite

SQLite :memory: (node:sqlite DatabaseSync — singleton on globalThis)
  passengers table  ·  UNIQUE passport_number  ·  seeded on startup
```

---

## Data Flow: Submitting a Passenger

> See [Sequence Diagram →](./DIAGRAMS.md#3-request--data-flow--sequence-diagram) | [Validation Flowchart →](./DIAGRAMS.md#4-validation-pipeline--flowchart)

1. **User types** → `onChange` handlers update `values` state in `PassengerForm`.
2. **useMemo re-runs** → `passengerInputSchema.safeParse(values)` checks all fields.
3. **Errors extracted** → `fieldErrorsFromZod` maps Zod issues to field names.
4. **User blurs field** → field is marked `touched`; its error becomes visible.
5. **User submits** → `submitAttempted = true`; all errors become visible; if invalid, stops here.
6. **If valid** → `fetch POST /api/passenger/validate` with Zod-validated data (already trimmed + uppercased).
7. **Server receives** → re-runs `passengerInputSchema.safeParse`; normalizes (`.trim().toUpperCase()`).
8. **Duplicate check** → `findPassengerByPassport` queries SQLite.
9. **Insert** → `insertPassenger` writes to SQLite; returns new `id`.
10. **Response 201** → client clears form, shows success banner, triggers `PassengerList` refresh.

---

## Validation Layer in Detail

> See [Validation Pipeline Flowchart →](./DIAGRAMS.md#4-validation-pipeline--flowchart)

### Regex Constants (`lib/validation/passenger-schema.ts`)

```typescript
export const PASSPORT_REGEX    = /^[A-Z]{1,3}[0-9]{5,7}$/i;  // 1-3 letters + 5-7 digits
export const FLIGHT_NUMBER_REGEX = /^[A-Z]{2,3}\d{1,4}$/i;   // 2-3 letters + 1-4 digits
export const PHONE_REGEX       = /^\d{8,15}$/;                 // 8-15 digits
```

### Zod Schema (`passengerInputSchema`)

- Defined once in `lib/validation/passenger-schema.ts`.
- **Shared** between client (`PassengerForm.tsx` useMemo) and server (`parsePassengerInput`).
- `superRefine` adds cross-field rules: same country check and past date check.
- `.trim()` on `passportNumber` strips accidental whitespace before regex fires.

### Normalization (`lib/validation/parse-passenger.ts`)

```typescript
passportNumber: input.passportNumber.trim().toUpperCase()
flightNumber:   input.flightNumber.trim().toUpperCase()
```

Applied server-side after schema parse. Client mirrors this in the `onChange` handler (auto-uppercase as user types).

### `fieldErrorsFromZod` Helper

Converts a `ZodError` into a `Partial<Record<PassengerFieldName, string>>` — one error message per field, first-error-wins. Used by the form to display inline errors.

---

## Database Layer

> See [ER Diagram →](./DIAGRAMS.md#6-database-entity-relationship-diagram)

### Engine

Node.js 22's built-in `node:sqlite` module (`DatabaseSync`) — synchronous API, zero external dependencies, in-memory only.

### Singleton Pattern (`lib/db/client.ts`)

```typescript
const globalForDb = globalThis as typeof globalThis & {
  __passengerDb?: AppDatabase;
};
```

Stores the DB on `globalThis` so it survives Next.js hot-reload (which re-evaluates modules but not `globalThis`).

### Schema

```sql
CREATE TABLE IF NOT EXISTS passengers (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name          TEXT NOT NULL,
  passport_number    TEXT NOT NULL UNIQUE,   -- enforces uniqueness at DB level too
  nationality        TEXT NOT NULL,
  age                INTEGER NOT NULL,
  gender             TEXT NOT NULL,
  flight_number      TEXT NOT NULL,
  departure_country  TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  travel_date        TEXT NOT NULL,
  email              TEXT NOT NULL,
  phone_number       TEXT NOT NULL
);
```

### Key Queries

| Function | SQL |
|----------|-----|
| `listPassengers` | `SELECT * FROM passengers ORDER BY id ASC` |
| `findPassengerByPassport` | `SELECT * FROM passengers WHERE passport_number = ?` |
| `insertPassenger` | `INSERT INTO passengers (...) VALUES (...)` |
| `clearPassengers` | `DELETE FROM passengers` |

`snake_case` DB columns are mapped to `camelCase` TypeScript fields in `rowToRecord`.

---

## API Routes

> See [API Endpoint Map →](./DIAGRAMS.md#7-api-endpoint-map)

### `POST /api/passenger/validate`

| Step | Detail |
|------|--------|
| Parse body | `request.json()` — returns 400 if not valid JSON |
| Validate | `validateAndStorePassenger(body)` |
| Duplicate check | `findPassengerByPassport` — returns 400 if exists |
| Store | `insertPassenger` |
| Response | 201 with `{ success: true, data: { id } }` |

### `GET /api/passengers`

Returns `{ success: true, data: PassengerRecord[] }` — always 200.

### `DELETE /api/passengers`

Calls `clearPassengers()`. Returns 200 on success, 500 if throws.

All routes:
- Declare `export const runtime = "nodejs"` to use Node APIs (SQLite).
- Call `logApiRequest` for basic structured logging.

---

## Logging

`lib/api/logger.ts` reads `process.env.LOG_LEVEL`:
- Default (`"info"`): logs `[api] METHOD PATH STATUS` to stdout.
- `"silent"`: suppresses all output (useful in tests).

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `LOG_LEVEL` | `"info"` | Set to `"silent"` to suppress API logs |
| `PORT` | `3000` | Next.js default dev port |

---

## TypeScript Type System

```
passengerInputSchema (Zod)
         │
         ▼
   PassengerInput         ← z.infer<typeof passengerInputSchema>
         │
         ▼
   PassengerRecord        ← PassengerInput & { id: number }
```

`ApiSuccessResponse<T>` and `ApiFailureResponse` are generic response envelope types used across all route handlers.

---

## Client-Side State Management (`PassengerForm.tsx`)

> See [Form State Machine →](./DIAGRAMS.md#5-form-state-machine)

| State | Type | Purpose |
|-------|------|---------|
| `values` | `PassengerFormValues` | Current input values |
| `touched` | `Partial<Record<FieldName, boolean>>` | Tracks which fields have been blurred |
| `submitAttempted` | `boolean` | Shows all errors after first submit attempt |
| `isSubmitting` | `boolean` | Disables form during API call |
| `serverErrors` | `string[]` | Errors returned from the API |
| `successMessage` | `string \| null` | Banner after successful save |

**Error visibility rule:** `showError(field)` returns true only when `(submitAttempted || touched[field]) && fieldErrors[field]`.

---

## Local Setup

```bash
cd passenger-data-validator
npm install
npm run dev       # http://localhost:3000
npm run build     # Production build check
npm run lint      # ESLint
```

**Requirements:** Node.js ≥ 22.5.0 (for `node:sqlite`).

---

## Known Constraints

- Data is **ephemeral** — lost on server restart (in-memory SQLite).
- No authentication or authorisation.
- `ALLOWED_COUNTRIES` is a hardcoded list of 10 countries.
- No pagination on the passenger list.
- `better-sqlite3` is installed as a package but unused — the project relies on the Node.js built-in `node:sqlite`.
