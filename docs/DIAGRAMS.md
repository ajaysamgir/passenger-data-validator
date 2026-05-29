# UML Diagrams — Airline Passenger Data Validator

All diagrams are written in [Mermaid](https://mermaid.js.org/) and render natively on GitHub, GitLab, and most modern markdown viewers.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Component Tree](#2-component-tree)
3. [Request / Data Flow — Sequence Diagram](#3-request--data-flow--sequence-diagram)
4. [Validation Pipeline — Flowchart](#4-validation-pipeline--flowchart)
5. [Form State Machine](#5-form-state-machine)
6. [Database Entity-Relationship Diagram](#6-database-entity-relationship-diagram)
7. [API Endpoint Map](#7-api-endpoint-map)
8. [Module Dependency Graph](#8-module-dependency-graph)

---

## 1. System Architecture

High-level C4-style component view showing the three main layers: Browser, Next.js Server, and Database.

```mermaid
graph TB
    subgraph Browser["🌐 Browser (React 19 Client)"]
        PF["PassengerForm\n«use client»\nZod + useState"]
        PL["PassengerList\n«use client»\nfetch + useEffect"]
        PP["PassengerPage\n«use client»\nlayout + refresh key"]
    end

    subgraph Server["🖥️ Next.js 16 Server (Node.js ≥ 22.5)"]
        V["POST /api/passenger/validate\nroute.ts"]
        G["GET /api/passengers\nroute.ts"]
        D["DELETE /api/passengers\nroute.ts"]
        SVC["passenger-service.ts\nbusiness logic"]
        SCH["passenger-schema.ts\nZod schema (shared)"]
        PARSE["parse-passenger.ts\nnormalize + validate"]
        LOG["logger.ts\nLOG_LEVEL aware"]
    end

    subgraph DB["💾 SQLite :memory: (node:sqlite)"]
        TBL["passengers table\nUNIQUE passport_number"]
    end

    PP --> PF
    PP --> PL

    PF -->|"POST JSON"| V
    PL -->|"GET"| G

    V --> SVC
    G --> SVC
    D --> SVC

    SVC --> PARSE
    PARSE --> SCH
    SCH -.->|"shared with client"| PF
    SVC --> TBL
    V --> LOG
    G --> LOG
    D --> LOG
```

---

## 2. Component Tree

React component hierarchy from the root page down to individual UI elements.

```mermaid
graph TD
    Page["app/page.tsx\n(Server Component)"]
    PP["PassengerPage\n«use client»"]
    PF["PassengerForm\n«use client»"]
    PL["PassengerList\n«use client»"]
    FF1["FormField — Full Name"]
    FF2["FormField — Passport Number"]
    FF3["FormField — Nationality"]
    FF4["FormField — Age"]
    FF5["FormField — Gender"]
    FF6["FormField — Flight Number"]
    FF7["FormField — Departure Country"]
    FF8["FormField — Destination Country"]
    FF9["FormField — Travel Date"]
    FF10["FormField — Email"]
    FF11["FormField — Phone Number"]
    BTN1["Submit Button\n(disabled when invalid)"]
    BTN2["Clear Form Button"]
    TABLE["Passenger Table\n(or loading/empty state)"]

    Page --> PP
    PP --> PF
    PP --> PL
    PF --> FF1
    PF --> FF2
    PF --> FF3
    PF --> FF4
    PF --> FF5
    PF --> FF6
    PF --> FF7
    PF --> FF8
    PF --> FF9
    PF --> FF10
    PF --> FF11
    PF --> BTN1
    PF --> BTN2
    PL --> TABLE
```

---

## 3. Request / Data Flow — Sequence Diagram

End-to-end flow from user input to database insert and UI update.

```mermaid
sequenceDiagram
    actor User
    participant Form as PassengerForm<br/>(Browser)
    participant ZodC as Zod Schema<br/>(Client)
    participant API as POST /api/passenger/validate<br/>(Server)
    participant ZodS as Zod Schema<br/>(Server)
    participant SVC as passenger-service
    participant DB as SQLite :memory:
    participant List as PassengerList<br/>(Browser)

    User->>Form: Types in fields
    Form->>ZodC: safeParse(values) on every change
    ZodC-->>Form: { success, fieldErrors }
    Form-->>User: Shows/hides field-level errors

    User->>Form: Clicks "Validate passenger"
    Form->>Form: setSubmitAttempted(true)

    alt Form is invalid
        Form-->>User: Shows all errors, blocks submit
    else Form is valid
        Form->>Form: setIsSubmitting(true) → "Validating…"
        Form->>API: POST /api/passenger/validate (JSON)
        API->>ZodS: safeParse(body)

        alt Server validation fails
            ZodS-->>API: { success: false, errors[] }
            API-->>Form: 400 { success: false, errors[] }
            Form-->>User: Shows server error banner
        else Server validation passes
            ZodS-->>API: { success: true, data }
            API->>SVC: validateAndStorePassenger(data)
            SVC->>DB: findPassengerByPassport(passportNumber)

            alt Passport already exists
                DB-->>SVC: PassengerRecord
                SVC-->>API: { success: false, errors: ["already registered"] }
                API-->>Form: 400 { success: false, errors[] }
                Form-->>User: Shows duplicate error
            else Passport is new
                DB-->>SVC: null
                SVC->>DB: insertPassenger(data)
                DB-->>SVC: { lastInsertRowid: id }
                SVC-->>API: { success: true, id }
                API-->>Form: 201 { success: true, data: { id } }
                Form->>Form: clearForm(), showSuccess()
                Form->>List: onSuccess() → triggers refresh
                List->>API: GET /api/passengers
                API-->>List: 200 { success: true, data: passengers[] }
                List-->>User: Updated passenger table
            end
        end
    end
```

---

## 4. Validation Pipeline — Flowchart

How a raw form submission is processed through all validation layers.

```mermaid
flowchart TD
    START([User submits form]) --> CPARSE

    subgraph CLIENT["Client-Side (Browser)"]
        CPARSE["Zod safeParse\npassengerInputSchema"]
        CINVALID["Show field errors\nBlock submit"]
        CNORM["Normalize:\n• passportNumber.toUpperCase()\n• flightNumber.toUpperCase()"]
    end

    subgraph SERVER["Server-Side (Node.js)"]
        SJSON["Parse JSON body"]
        SINVALID_JSON["Return 400\n'Request body must be valid JSON'"]
        SPARSE["Zod safeParse\npassengerInputSchema"]
        SINVALID["Return 400\nerrors[]"]
        SNORM["normalizePassengerInput()\n• .trim().toUpperCase()"]
        DUP["findPassengerByPassport()\nSQLite lookup"]
        SDUP["Return 400\n'Passport already registered'"]
        INSERT["insertPassenger()\nSQLite INSERT"]
        SUCCESS["Return 201\n{ success: true, id }"]
    end

    subgraph DB["Database Layer"]
        UNIQUE["UNIQUE constraint\non passport_number"]
    end

    CPARSE -->|invalid| CINVALID
    CPARSE -->|valid| CNORM
    CNORM -->|"fetch POST"| SJSON
    SJSON -->|parse error| SINVALID_JSON
    SJSON -->|ok| SPARSE
    SPARSE -->|invalid| SINVALID
    SPARSE -->|valid| SNORM
    SNORM --> DUP
    DUP -->|found| SDUP
    DUP -->|not found| INSERT
    INSERT --> UNIQUE
    UNIQUE -->|ok| SUCCESS
    UNIQUE -->|violation| SINVALID
```

---

## 5. Form State Machine

State diagram of the `PassengerForm` component across its full lifecycle.

```mermaid
stateDiagram-v2
    [*] --> Pristine : component mounts

    Pristine --> Typing : user changes any field
    Typing --> Typing : user changes field\nor blurs field (marks touched)

    Typing --> Submitting : user clicks submit\n[form is valid]
    Typing --> Typing : user clicks submit\n[form is invalid]\nshows all errors

    Submitting --> ServerError : API returns 400\nor network failure
    Submitting --> Success : API returns 201

    ServerError --> Typing : user edits any field\n(clears server errors)

    Success --> Pristine : form auto-clears\nshows success banner

    Pristine --> Pristine : user clicks "Clear form"
    Typing --> Pristine : user clicks "Clear form"
    ServerError --> Pristine : user clicks "Clear form"

    note right of Submitting
        isSubmitting = true
        Button shows "Validating…"
        All inputs disabled
    end note

    note right of Success
        values = EMPTY_VALUES
        touched = {}
        submitAttempted = false
        successMessage shown briefly
    end note
```

---

## 6. Database Entity-Relationship Diagram

The single-table schema with field types and constraints.

```mermaid
erDiagram
    PASSENGERS {
        INTEGER id PK "AUTOINCREMENT"
        TEXT full_name "NOT NULL"
        TEXT passport_number "NOT NULL, UNIQUE"
        TEXT nationality "NOT NULL"
        INTEGER age "NOT NULL"
        TEXT gender "NOT NULL"
        TEXT flight_number "NOT NULL"
        TEXT departure_country "NOT NULL"
        TEXT destination_country "NOT NULL"
        TEXT travel_date "NOT NULL"
        TEXT email "NOT NULL"
        TEXT phone_number "NOT NULL"
    }
```

> **Note:** The schema uses a single denormalized table because this is a read/write-once demo. A production system would normalize nationality, country, and flight into separate tables with foreign keys.

---

## 7. API Endpoint Map

All HTTP endpoints, their methods, inputs, and response shapes.

```mermaid
graph LR
    subgraph Endpoints["REST API"]
        direction TB
        E1["POST\n/api/passenger/validate"]
        E2["GET\n/api/passengers"]
        E3["DELETE\n/api/passengers"]
    end

    subgraph Responses["Response Shapes"]
        R1["201 ✅\n{ success: true,\n  message: '...',\n  data: { id: number } }"]
        R2["400 ❌\n{ success: false,\n  errors: string[] }"]
        R3["200 ✅\n{ success: true,\n  data: PassengerRecord[] }"]
        R4["200 ✅\n{ success: true,\n  message: 'All passengers cleared',\n  data: [] }"]
        R5["500 ❌\n{ success: false,\n  errors: ['Unable to clear'] }"]
    end

    E1 -->|"valid + unique"| R1
    E1 -->|"invalid or duplicate"| R2
    E2 --> R3
    E3 -->|"success"| R4
    E3 -->|"DB error"| R5
```

---

## 8. Module Dependency Graph

How the source files import from each other. Arrows point in the direction of the import.

```mermaid
graph TD
    subgraph Routes["app/api/"]
        RV["passenger/validate/route.ts"]
        RP["passengers/route.ts"]
    end

    subgraph Components["components/"]
        PForm["PassengerForm.tsx"]
        PList["PassengerList.tsx"]
        PPage["PassengerPage.tsx"]
        FF["ui/FormField.tsx"]
    end

    subgraph Lib["lib/"]
        SVC["services/passenger-service.ts"]
        SCH["validation/passenger-schema.ts"]
        PARSE["validation/parse-passenger.ts"]
        CONST["validation/constants.ts"]
        DBC["db/client.ts"]
        DBP["db/passengers.ts"]
        DBS["db/seed.ts"]
        TPASS["types/passenger.ts"]
        TAPI["types/api.ts"]
        LOG["api/logger.ts"]
    end

    RV --> SVC
    RV --> TAPI
    RV --> LOG
    RP --> SVC
    RP --> TPASS
    RP --> TAPI
    RP --> LOG

    PPage --> PForm
    PPage --> PList
    PForm --> FF
    PForm --> SCH
    PForm --> CONST

    SVC --> PARSE
    SVC --> DBP
    PARSE --> SCH
    PARSE --> TPASS
    SCH --> CONST
    SCH -.->|"z.infer →"| TPASS
    DBP --> DBC
    DBP --> TPASS
    DBC --> DBS
    DBS --> TPASS
```
