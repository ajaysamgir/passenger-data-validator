import { getDb } from "@/lib/db/client";
import type { PassengerInput, PassengerRecord } from "@/lib/types/passenger";

type PassengerRow = {
  id: number;
  full_name: string;
  passport_number: string;
  nationality: string;
  age: number;
  gender: string;
  flight_number: string;
  departure_country: string;
  destination_country: string;
  travel_date: string;
  email: string;
  phone_number: string;
};

function rowToRecord(row: PassengerRow): PassengerRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    passportNumber: row.passport_number,
    nationality: row.nationality as PassengerRecord["nationality"],
    age: row.age,
    gender: row.gender as PassengerRecord["gender"],
    flightNumber: row.flight_number,
    departureCountry: row.departure_country as PassengerRecord["departureCountry"],
    destinationCountry:
      row.destination_country as PassengerRecord["destinationCountry"],
    travelDate: row.travel_date,
    email: row.email,
    phoneNumber: row.phone_number,
  };
}

const listStatement = `
  SELECT
    id,
    full_name,
    passport_number,
    nationality,
    age,
    gender,
    flight_number,
    departure_country,
    destination_country,
    travel_date,
    email,
    phone_number
  FROM passengers
  ORDER BY id ASC
`;

const insertStatement = `
  INSERT INTO passengers (
    full_name,
    passport_number,
    nationality,
    age,
    gender,
    flight_number,
    departure_country,
    destination_country,
    travel_date,
    email,
    phone_number
  ) VALUES (
    @fullName,
    @passportNumber,
    @nationality,
    @age,
    @gender,
    @flightNumber,
    @departureCountry,
    @destinationCountry,
    @travelDate,
    @email,
    @phoneNumber
  )
`;

export function listPassengers(): PassengerRecord[] {
  const rows = getDb().prepare(listStatement).all() as PassengerRow[];
  return rows.map(rowToRecord);
}

export function findPassengerByPassport(
  passportNumber: string,
): PassengerRecord | null {
  const row = getDb()
    .prepare(
      `
      SELECT
        id,
        full_name,
        passport_number,
        nationality,
        age,
        gender,
        flight_number,
        departure_country,
        destination_country,
        travel_date,
        email,
        phone_number
      FROM passengers
      WHERE passport_number = ?
      `,
    )
    .get(passportNumber.toUpperCase()) as PassengerRow | undefined;

  return row ? rowToRecord(row) : null;
}

export function insertPassenger(input: PassengerInput): number {
  const result = getDb().prepare(insertStatement).run(input);
  return Number(result.lastInsertRowid);
}

export function clearPassengers(): void {
  getDb().prepare("DELETE FROM passengers").run();
}
