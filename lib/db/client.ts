import { DatabaseSync } from "node:sqlite";

import { seedPassengers } from "@/lib/db/seed";

export type AppDatabase = DatabaseSync;

const globalForDb = globalThis as typeof globalThis & {
  __passengerDb?: AppDatabase;
};

function initSchema(db: AppDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS passengers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      passport_number TEXT NOT NULL UNIQUE,
      nationality TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      flight_number TEXT NOT NULL,
      departure_country TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      travel_date TEXT NOT NULL,
      email TEXT NOT NULL,
      phone_number TEXT NOT NULL
    );
  `);
}

export function getDb(): AppDatabase {
  if (!globalForDb.__passengerDb) {
    const db = new DatabaseSync(":memory:");
    initSchema(db);
    seedPassengers(db);
    globalForDb.__passengerDb = db;
  }

  return globalForDb.__passengerDb;
}
