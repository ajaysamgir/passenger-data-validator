# Functional Documentation — Airline Passenger Data Validator

> **Diagrams:** See [DIAGRAMS.md](./DIAGRAMS.md) for all UML diagrams referenced in this document.

## Overview

The Airline Passenger Data Validator is a single-page web application that allows airline staff to enter, validate, and store passenger travel details before boarding. It performs real-time client-side validation as the user types and then sends data to a server for a final independent check before storing it.

---

## Who Uses This Application

**Target user:** Airline ground staff or a data entry operator who needs to register passenger records tied to specific flights.

---

## What the Application Does

### 1. Passenger Entry Form

The main screen shows a form on the left and a passenger list on the right.

The form collects the following information for each passenger:

| Field | Description | Example |
|-------|-------------|---------|
| Passenger Full Name | Legal name of the passenger | Priya Sharma |
| Passport Number | Travel document identifier | IN9843210 |
| Nationality | Country of citizenship (dropdown) | India |
| Age | Passenger age in years | 34 |
| Gender | Male / Female / Other (dropdown) | Female |
| Flight Number | Airline code + flight digits | AI101 |
| Departure Country | Country of origin (dropdown) | India |
| Destination Country | Country of travel (dropdown) | United Kingdom |
| Travel Date | Date of travel | 2026-06-12 |
| Email Address | Contact email | priya@example.com |
| Phone Number | Contact phone (digits only) | 9876543210 |

---

### 2. Client-Side Validation (Instant Feedback)

Errors appear under each field as soon as the user leaves a field (on blur) or after they first attempt to submit. The Submit button stays disabled until all fields are valid.

| Field | Rule |
|-------|------|
| All fields | Required — no field may be left empty |
| Passport Number | Must be 1–3 letters followed by 5–7 digits (e.g. `AB1234567`). Auto-uppercased as typed. |
| Age | Whole number between 1 and 120 (inclusive) |
| Flight Number | 2–3 letters followed by 1–4 digits (e.g. `AI101`) |
| Phone Number | Digits only, 8–15 characters |
| Email | Standard email format |
| Travel Date | Cannot be today or a past date |
| Departure / Destination | Must be different countries |

---

### 3. Submit Flow

> See [Sequence Diagram →](./DIAGRAMS.md#3-request--data-flow--sequence-diagram) and [Validation Flowchart →](./DIAGRAMS.md#4-validation-pipeline--flowchart)

1. User fills in the form — the Submit button activates when all client rules pass.
2. User clicks **Validate passenger**.
3. A loading indicator appears on the button ("Validating…").
4. The data is sent to the server via `POST /api/passenger/validate`.
5. **On success:** the form clears, a green success banner appears, and the passenger appears in the list on the right.
6. **On failure:** red error messages from the server appear above the form; the passenger is NOT added to the list.

---

### 4. Clear Form

The **Clear form** button resets all fields and removes all error messages at any time without submitting.

---

### 5. Validated Passengers List

The right side of the screen shows all successfully stored passengers in a table:

| Column | Content |
|--------|---------|
| Name | Passenger full name |
| Passport | Passport number (uppercase) |
| Flight | Flight number (uppercase) |
| Travel date | Date of travel |

The list updates automatically after each successful submission. On first load it shows seeded demo passengers.

---

### 6. Server-Side Validation Rules (Additional Checks)

The server independently re-validates everything the client sent, plus these extra checks:

| Rule | Behaviour |
|------|-----------|
| Duplicate passport | If a passport number is already stored, the submission is rejected with "Passport number is already registered" |
| All field formats | Re-checked server-side even if the client passed |

---

### 7. Data Persistence

- All data lives in an in-memory SQLite database.
- Two demo passengers are pre-loaded every time the server starts.
- **Data does not survive a server restart** — this is intentional for a learning/demo environment.

---

## Supported Countries

Australia, Canada, France, Germany, India, Japan, Singapore, United Arab Emirates, United Kingdom, United States.

---

## Error Messages Reference

| Scenario | Message Shown |
|----------|---------------|
| Empty passport | "Passport number is required" |
| Wrong passport format | "Passport must be 1–3 letters followed by 5–7 digits (e.g. AB1234567)" |
| Duplicate passport | "Passport number is already registered" |
| Empty name | "Full name is required" |
| Age out of range | "Age must be at least 1" / "Age must be at most 120" |
| Same departure/destination | "Departure and destination must be different" |
| Past travel date | "Travel date cannot be in the past" |
| Bad flight number | "Flight number must look like AI101 (2–3 letters + digits)" |
| Bad email | "Enter a valid email address" |
| Bad phone | "Phone must be 8–15 digits only" |

---

## API Endpoints (for integrators)

> See [API Endpoint Map →](./DIAGRAMS.md#7-api-endpoint-map)

| Method | Path | Purpose | Success Status |
|--------|------|---------|----------------|
| POST | `/api/passenger/validate` | Validate and store a passenger | 201 |
| GET | `/api/passengers` | List all stored passengers | 200 |
| DELETE | `/api/passengers` | Clear all stored passengers | 200 |

**Success response shape:**
```json
{
  "success": true,
  "message": "Passenger validated successfully",
  "data": { "id": 1 }
}
```

**Failure response shape:**
```json
{
  "success": false,
  "errors": ["Passport number is already registered"]
}
```
