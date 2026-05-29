import type { z } from "zod";

import type { PassengerInput } from "@/lib/types/passenger";
import { passengerInputSchema } from "@/lib/validation/passenger-schema";

export type ParsePassengerResult =
  | { success: true; data: PassengerInput }
  | { success: false; errors: string[] };

function zodErrorsToMessages(error: z.ZodError): string[] {
  return [...new Set(error.issues.map((issue) => issue.message))];
}

export function normalizePassengerInput(
  input: PassengerInput,
): PassengerInput {
  return {
    ...input,
    passportNumber: input.passportNumber.trim().toUpperCase(),
    flightNumber: input.flightNumber.trim().toUpperCase(),
  };
}

export function parsePassengerInput(raw: unknown): ParsePassengerResult {
  const result = passengerInputSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, errors: zodErrorsToMessages(result.error) };
  }

  return {
    success: true,
    data: normalizePassengerInput(result.data),
  };
}
