"use client";

import { useState } from "react";

import { PassengerForm } from "@/components/passenger/PassengerForm";
import { PassengerList } from "@/components/passenger/PassengerList";

export function PassengerPage() {
  const [listRefreshKey, setListRefreshKey] = useState(0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Airline passenger validation
        </h1>
        <p className="mt-2 text-base text-zinc-600">
          Capture passenger details, validate them on the client, and submit for
          server-side checks.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <PassengerForm onSuccess={() => setListRefreshKey((key) => key + 1)} />
        <PassengerList refreshKey={listRefreshKey} />
      </div>
    </div>
  );
}
