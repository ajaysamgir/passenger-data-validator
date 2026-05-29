import type { z } from "zod";

import type { passengerInputSchema } from "@/lib/validation/passenger-schema";

export type PassengerInput = z.infer<typeof passengerInputSchema>;

export type PassengerRecord = PassengerInput & {
  id: number;
};
