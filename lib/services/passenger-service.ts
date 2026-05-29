import {
  clearPassengers,
  findPassengerByPassport,
  insertPassenger,
  listPassengers,
} from "@/lib/db/passengers";
import type { PassengerRecord } from "@/lib/types/passenger";
import { parsePassengerInput } from "@/lib/validation/parse-passenger";

export type ValidatePassengerResult =
  | { success: true; id: number }
  | { success: false; errors: string[] };

export function validateAndStorePassenger(
  raw: unknown,
): ValidatePassengerResult {
  const parsed = parsePassengerInput(raw);

  if (!parsed.success) {
    return parsed;
  }

  const existing = findPassengerByPassport(parsed.data.passportNumber);
  if (existing) {
    return {
      success: false,
      errors: ["Passport number is already registered"],
    };
  }

  const id = insertPassenger(parsed.data);
  return { success: true, id };
}

export function getPassengers(): PassengerRecord[] {
  return listPassengers();
}

export function removeAllPassengers(): void {
  clearPassengers();
}
