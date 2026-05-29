# Passenger Data Validator

Full-stack Next.js app for validating airline passenger details. The UI uses shared Zod schemas with the API; validated records are stored in an in-memory SQLite database.

## Prerequisites

- Node.js 22.5+ (uses built-in `node:sqlite` for in-memory storage — no native rebuilds)
- npm

## Local setup

```bash
cd passenger-data-validator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional environment variables (copy `.env.example` to `.env.local`):

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | API logging (`info` or `silent`) |
| `PORT` | `3000` | Dev server port |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/passenger/validate` | Validate and store a passenger |
| `GET` | `/api/passengers` | List stored passengers |
| `DELETE` | `/api/passengers` | Clear all passengers |

Requirements and checklists: [`docs/ACCEPTANCE_CRITERIA.md`](docs/ACCEPTANCE_CRITERIA.md).

## Data

SQLite runs in memory via Node’s built-in `node:sqlite` (`:memory:`). Data is seeded on server start and is lost when the process stops.
