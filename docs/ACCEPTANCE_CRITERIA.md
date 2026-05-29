# Acceptance Criteria — Airline Passenger Validation

Canonical requirements for this project. Agents must verify relevant sections before marking work complete.

**Stack (this repo):** Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS 4, SQLite in-memory via lightweight Node driver (e.g. `better-sqlite3`).

## Next.js mapping (original spec → this repo)

| Original spec | This project |
|---------------|--------------|
| Angular reactive forms | Client form + Zod schema (`lib/validation/`) |
| Angular HttpClient | `fetch` or small API client in `lib/` |
| Express routes | App Router `app/api/**/route.ts` |
| express-validator | Zod (shared client + server where possible) |
| SQLite `:memory:` | `lib/db/` init on server startup |
| CORS for separate frontend | Not required for monolithic Next.js; add only if split deploy |
| `frontend/` + `backend/` folders | `app/`, `components/`, `lib/` under app root |

## Target folder structure

```
passenger-data-validator/
├── app/
│   ├── page.tsx
│   └── api/
│       └── passenger/          # validate, list, clear
├── components/                   # form, list, alerts
├── lib/
│   ├── validation/               # Zod schemas
│   ├── db/                       # SQLite init, queries
│   └── types/                    # DTOs
└── docs/
    └── ACCEPTANCE_CRITERIA.md
```

---

## 1. Passenger entry page (UI)

**Done when:**

- [ ] Single page (or primary view) includes all fields:
  - [ ] Passenger Full Name
  - [ ] Passport Number
  - [ ] Nationality
  - [ ] Age
  - [ ] Gender
  - [ ] Flight Number
  - [ ] Departure Country
  - [ ] Destination Country
  - [ ] Travel Date
  - [ ] Email Address
  - [ ] Phone Number
- [ ] UI is clean, responsive, minimal CSS (Tailwind only; no heavy UI libraries)
- [ ] Button to start a new entry / clear form for new passenger input
- [ ] Validated passengers list is visible on the same page

---

## 2. Client-side validation

**Done when:**

- [ ] All fields above are required (client-side)
- [ ] Email format validated
- [ ] Passport number format validated (project-defined pattern, consistent with server)
- [ ] Age between 1 and 120 (inclusive)
- [ ] Flight number matches format (example: `AI101` — airline letters + digits)
- [ ] Phone number numeric validation
- [ ] Clear, field-level validation messages shown to the user
- [ ] Submit disabled while form is invalid
- [ ] Clear form button resets inputs
- [ ] On submit: loading indicator during API call
- [ ] On success: passenger appears in list; success alert shown
- [ ] On failure: server `errors[]` shown on page; passenger not added to list

---

## 3. API — POST validate

**Endpoint:** `POST /api/passenger/validate`

**Done when:**

- [ ] Accepts passenger JSON payload
- [ ] Re-validates all fields on server (never trust client only)
- [ ] Invalid payloads rejected with appropriate HTTP status (e.g. 400)
- [ ] Valid payloads return JSON success shape (see §6)
- [ ] Invalid payloads return JSON failure shape (see §6); nothing stored

---

## 4. Server-side validation rules

**Done when:**

- [ ] Missing field validation
- [ ] Duplicate passport check (reject if passport already stored)
- [ ] Invalid flight number rejected
- [ ] Age restrictions (1–120)
- [ ] Invalid nationality check (project-defined allowed set or rules)
- [ ] Departure and destination cannot be the same
- [ ] Travel date cannot be in the past

---

## 5. Database behavior

**Done when:**

- [ ] SQLite in-memory (`:memory:`) — no external DB install
- [ ] DB initializes when app/server starts
- [ ] Seed dummy passenger data on startup so list is non-empty on first load
- [ ] Data is ephemeral (flushed when process stops)
- [ ] On successful validation: record stored
- [ ] On failed validation: no record stored

---

## 6. API response formats

**Success (example):**

```json
{
  "success": true,
  "message": "Passenger validated successfully",
  "data": { "id": 1 }
}
```

**Failure (example):**

```json
{
  "success": false,
  "errors": ["Invalid passport number", "Travel date cannot be in past"]
}
```

**Done when:** All validate/list/clear endpoints use these shapes consistently.

---

## 7. Additional API endpoints

| Method | Path | Done when |
|--------|------|-----------|
| GET | `/api/passengers` | Returns list of stored passengers |
| DELETE | `/api/passengers` (or documented clear path) | Clears all passengers |

**Also done when:**

- [ ] Basic request logging on API routes
- [ ] Environment config used where needed (e.g. port, log level) via `.env` / `process.env`

---

## 8. Architecture and quality

**Done when:**

- [ ] Lightweight dependencies only (avoid MongoDB, PostgreSQL, Prisma, Docker, heavy ORMs)
- [ ] Separation: UI (`components/`), validation (`lib/validation/`), DB (`lib/db/`), thin route handlers
- [ ] Shared Zod (or equivalent) schemas for client + server where practical
- [ ] Route handlers delegate to services; minimal logic in `route.ts`
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] README includes local setup: `npm install`, `npm run dev`

---

## 9. Startup

**Done when:**

```bash
cd passenger-data-validator
npm install
npm run dev
```

App runs at `http://localhost:3000` (or configured port) with working form, API, and seeded list.
