"use client";

import { useMemo, useState } from "react";

import { FormField, inputClassName, selectClassName } from "@/components/ui/FormField";
import {
  ALLOWED_COUNTRIES,
  GENDER_OPTIONS,
} from "@/lib/validation/constants";
import {
  fieldErrorsFromZod,
  passengerInputSchema,
  type PassengerFieldName,
} from "@/lib/validation/passenger-schema";

export type PassengerFormValues = {
  fullName: string;
  passportNumber: string;
  nationality: string;
  age: string;
  gender: string;
  flightNumber: string;
  departureCountry: string;
  destinationCountry: string;
  travelDate: string;
  email: string;
  phoneNumber: string;
};

const EMPTY_VALUES: PassengerFormValues = {
  fullName: "",
  passportNumber: "",
  nationality: "",
  age: "",
  gender: "",
  flightNumber: "",
  departureCountry: "",
  destinationCountry: "",
  travelDate: "",
  email: "",
  phoneNumber: "",
};

type PassengerFormProps = {
  onSuccess?: () => void;
};

export function PassengerForm({ onSuccess }: PassengerFormProps) {
  const [values, setValues] = useState<PassengerFormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<PassengerFieldName, boolean>>>(
    {},
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validation = useMemo(() => {
    return passengerInputSchema.safeParse({
      ...values,
      passportNumber: values.passportNumber.toUpperCase(),
      flightNumber: values.flightNumber.toUpperCase(),
    });
  }, [values]);

  const fieldErrors = useMemo(() => {
    if (validation.success) {
      return {};
    }
    return fieldErrorsFromZod(validation.error);
  }, [validation]);

  const showError = (field: PassengerFieldName) =>
    Boolean((submitAttempted || touched[field]) && fieldErrors[field]);

  const updateField =
    (field: keyof PassengerFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setServerErrors([]);
      setSuccessMessage(null);
    };

  const markTouched = (field: PassengerFieldName) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleClear = () => {
    setValues(EMPTY_VALUES);
    setTouched({});
    setSubmitAttempted(false);
    setServerErrors([]);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setServerErrors([]);
    setSuccessMessage(null);

    if (!validation.success) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/passenger/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        errors?: string[];
      };

      if (!response.ok || !payload.success) {
        setServerErrors(
          payload.errors?.length
            ? payload.errors
            : ["Validation failed. Please check your details."],
        );
        return;
      }

      setValues(EMPTY_VALUES);
      setTouched({});
      setSubmitAttempted(false);
      setSuccessMessage(
        payload.message ?? "Passenger validated successfully",
      );
      onSuccess?.();
    } catch {
      setServerErrors(["Unable to reach the server. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = validation.success;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Passenger details
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Enter all required fields. Submit when the form is valid.
        </p>
      </div>

      {serverErrors.length > 0 ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <p className="font-medium">Could not save passenger</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {serverErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="fullName"
          label="Passenger Full Name"
          error={showError("fullName") ? fieldErrors.fullName : undefined}
        >
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            className={inputClassName}
            value={values.fullName}
            onChange={updateField("fullName")}
            onBlur={() => markTouched("fullName")}
            aria-invalid={showError("fullName")}
            aria-describedby={showError("fullName") ? "fullName-error" : undefined}
          />
        </FormField>

        <FormField
          id="passportNumber"
          label="Passport Number"
          error={
            showError("passportNumber") ? fieldErrors.passportNumber : undefined
          }
        >
          <input
            id="passportNumber"
            name="passportNumber"
            type="text"
            autoComplete="off"
            placeholder="e.g. AB1234567"
            maxLength={10}
            className={inputClassName}
            value={values.passportNumber}
            onChange={(e) => {
              setValues((current) => ({
                ...current,
                passportNumber: e.target.value.toUpperCase(),
              }));
              setServerErrors([]);
              setSuccessMessage(null);
            }}
            onBlur={() => markTouched("passportNumber")}
            aria-invalid={showError("passportNumber")}
            aria-describedby={
              showError("passportNumber") ? "passportNumber-error" : undefined
            }
          />
        </FormField>

        <FormField
          id="nationality"
          label="Nationality"
          error={showError("nationality") ? fieldErrors.nationality : undefined}
        >
          <select
            id="nationality"
            name="nationality"
            className={selectClassName}
            value={values.nationality}
            onChange={updateField("nationality")}
            onBlur={() => markTouched("nationality")}
            aria-invalid={showError("nationality")}
          >
            <option value="">Select nationality</option>
            {ALLOWED_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="age"
          label="Age"
          error={showError("age") ? fieldErrors.age : undefined}
        >
          <input
            id="age"
            name="age"
            type="number"
            min={1}
            max={120}
            className={inputClassName}
            value={values.age}
            onChange={updateField("age")}
            onBlur={() => markTouched("age")}
            aria-invalid={showError("age")}
          />
        </FormField>

        <FormField
          id="gender"
          label="Gender"
          error={showError("gender") ? fieldErrors.gender : undefined}
        >
          <select
            id="gender"
            name="gender"
            className={selectClassName}
            value={values.gender}
            onChange={updateField("gender")}
            onBlur={() => markTouched("gender")}
            aria-invalid={showError("gender")}
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="flightNumber"
          label="Flight Number"
          error={showError("flightNumber") ? fieldErrors.flightNumber : undefined}
        >
          <input
            id="flightNumber"
            name="flightNumber"
            type="text"
            placeholder="e.g. AI101"
            className={inputClassName}
            value={values.flightNumber}
            onChange={updateField("flightNumber")}
            onBlur={() => markTouched("flightNumber")}
            aria-invalid={showError("flightNumber")}
          />
        </FormField>

        <FormField
          id="departureCountry"
          label="Departure Country"
          error={
            showError("departureCountry") ? fieldErrors.departureCountry : undefined
          }
        >
          <select
            id="departureCountry"
            name="departureCountry"
            className={selectClassName}
            value={values.departureCountry}
            onChange={updateField("departureCountry")}
            onBlur={() => markTouched("departureCountry")}
            aria-invalid={showError("departureCountry")}
          >
            <option value="">Select departure country</option>
            {ALLOWED_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="destinationCountry"
          label="Destination Country"
          error={
            showError("destinationCountry")
              ? fieldErrors.destinationCountry
              : undefined
          }
        >
          <select
            id="destinationCountry"
            name="destinationCountry"
            className={selectClassName}
            value={values.destinationCountry}
            onChange={updateField("destinationCountry")}
            onBlur={() => markTouched("destinationCountry")}
            aria-invalid={showError("destinationCountry")}
          >
            <option value="">Select destination country</option>
            {ALLOWED_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="travelDate"
          label="Travel Date"
          error={showError("travelDate") ? fieldErrors.travelDate : undefined}
        >
          <input
            id="travelDate"
            name="travelDate"
            type="date"
            className={inputClassName}
            value={values.travelDate}
            onChange={updateField("travelDate")}
            onBlur={() => markTouched("travelDate")}
            aria-invalid={showError("travelDate")}
          />
        </FormField>

        <FormField
          id="email"
          label="Email Address"
          error={showError("email") ? fieldErrors.email : undefined}
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            value={values.email}
            onChange={updateField("email")}
            onBlur={() => markTouched("email")}
            aria-invalid={showError("email")}
          />
        </FormField>

        <FormField
          id="phoneNumber"
          label="Phone Number"
          error={showError("phoneNumber") ? fieldErrors.phoneNumber : undefined}
        >
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Digits only, 8–15 characters"
            className={inputClassName}
            value={values.phoneNumber}
            onChange={updateField("phoneNumber")}
            onBlur={() => markTouched("phoneNumber")}
            aria-invalid={showError("phoneNumber")}
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
        >
          {isSubmitting ? "Validating…" : "Validate passenger"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear form
        </button>
      </div>
    </form>
  );
}
