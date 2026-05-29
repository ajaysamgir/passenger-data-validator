import { z } from "zod";

import {
  ALLOWED_COUNTRIES,
  GENDER_OPTIONS,
  type AllowedCountry,
  type GenderOption,
} from "@/lib/validation/constants";

export const PASSPORT_REGEX = /^[A-Z0-9]{6,9}$/i;
export const FLIGHT_NUMBER_REGEX = /^[A-Z]{2,3}\d{1,4}$/i;
export const PHONE_REGEX = /^\d{8,15}$/;

const countrySchema = z
  .string()
  .min(1, "Country is required")
  .refine(
    (value): value is AllowedCountry =>
      (ALLOWED_COUNTRIES as readonly string[]).includes(value),
    { message: "Select a valid country" },
  );

const genderSchema = z
  .string()
  .min(1, "Gender is required")
  .refine(
    (value): value is GenderOption =>
      (GENDER_OPTIONS as readonly string[]).includes(value),
    { message: "Select a valid gender" },
  );

export const passengerInputSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .max(100, "Full name is too long"),
    passportNumber: z
      .string()
      .min(1, "Passport number is required")
      .regex(
        PASSPORT_REGEX,
        "Passport must be 6–9 letters and numbers (e.g. AB123456)",
      ),
    nationality: countrySchema,
    age: z.coerce
      .number({ error: "Age is required" })
      .int("Age must be a whole number")
      .min(1, "Age must be at least 1")
      .max(120, "Age must be at most 120"),
    gender: genderSchema,
    flightNumber: z
      .string()
      .min(1, "Flight number is required")
      .regex(
        FLIGHT_NUMBER_REGEX,
        "Flight number must look like AI101 (2–3 letters + digits)",
      ),
    departureCountry: countrySchema,
    destinationCountry: countrySchema,
    travelDate: z.string().min(1, "Travel date is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .regex(PHONE_REGEX, "Phone must be 8–15 digits only"),
  })
  .superRefine((data, ctx) => {
    if (data.departureCountry === data.destinationCountry) {
      ctx.addIssue({
        code: "custom",
        message: "Departure and destination must be different",
        path: ["destinationCountry"],
      });
    }

    const travel = new Date(`${data.travelDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(travel.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid travel date",
        path: ["travelDate"],
      });
      return;
    }

    if (travel < today) {
      ctx.addIssue({
        code: "custom",
        message: "Travel date cannot be in the past",
        path: ["travelDate"],
      });
    }
  });

export type PassengerFieldName = keyof z.infer<typeof passengerInputSchema>;

export function fieldErrorsFromZod(
  error: z.ZodError,
): Partial<Record<PassengerFieldName, string>> {
  const map: Partial<Record<PassengerFieldName, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in map)) {
      map[field as PassengerFieldName] = issue.message;
    }
  }

  return map;
}
