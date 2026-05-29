import type { AppDatabase } from "@/lib/db/client";
import type { PassengerInput } from "@/lib/types/passenger";

function travelDateDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const SEED_PASSENGERS: PassengerInput[] = [
  {
    fullName: "Priya Sharma",
    passportNumber: "IN9843210",
    nationality: "India",
    age: 34,
    gender: "Female",
    flightNumber: "AI101",
    departureCountry: "India",
    destinationCountry: "United Kingdom",
    travelDate: travelDateDaysFromNow(14),
    email: "priya.sharma@example.com",
    phoneNumber: "9876543210",
  },
  {
    fullName: "James Wilson",
    passportNumber: "US1234567",
    nationality: "United States",
    age: 42,
    gender: "Male",
    flightNumber: "UA202",
    departureCountry: "United States",
    destinationCountry: "France",
    travelDate: travelDateDaysFromNow(21),
    email: "james.wilson@example.com",
    phoneNumber: "4155550199",
  },
];

const insertSeed = `
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
  );
`;

export function seedPassengers(db: AppDatabase): void {
  const count = db
    .prepare("SELECT COUNT(*) AS count FROM passengers")
    .get() as { count: number };

  if (count.count > 0) {
    return;
  }

  const statement = db.prepare(insertSeed);

  for (const passenger of SEED_PASSENGERS) {
    statement.run(passenger);
  }
}
