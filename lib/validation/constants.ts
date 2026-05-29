/** Countries allowed for nationality, departure, and destination (server rules use the same lists). */
export const ALLOWED_COUNTRIES = [
  "Australia",
  "Canada",
  "France",
  "Germany",
  "India",
  "Japan",
  "Singapore",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
] as const;

export type AllowedCountry = (typeof ALLOWED_COUNTRIES)[number];

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number];
