"use client";

import { useEffect, useState } from "react";

import type { PassengerRecord } from "@/lib/types/passenger";

type PassengerListProps = {
  refreshKey?: number;
};

export function PassengerList({ refreshKey = 0 }: PassengerListProps) {
  const [passengers, setPassengers] = useState<PassengerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      setIsLoading(true);
      setError(null);

      void (async () => {
        try {
          const response = await fetch("/api/passengers");
          if (!response.ok) {
            throw new Error("Failed to load passengers");
          }

          const payload = (await response.json()) as {
            success?: boolean;
            data?: PassengerRecord[];
          };

          if (!active) {
            return;
          }

          setPassengers(payload.data ?? []);
        } catch {
          if (!active) {
            return;
          }

          setPassengers([]);
          setError("Passenger list is unavailable until the API is connected.");
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      })();
    });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Validated passengers
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Successfully validated entries appear here.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading passengers…</p>
      ) : error ? (
        <p className="text-sm text-amber-700">{error}</p>
      ) : passengers.length === 0 ? (
        <p className="text-sm text-zinc-500">No validated passengers yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-600">
              <tr>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Passport</th>
                <th className="py-2 pr-4 font-medium">Flight</th>
                <th className="py-2 font-medium">Travel date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {passengers.map((passenger) => (
                <tr key={passenger.id} className="text-zinc-800">
                  <td className="py-3 pr-4">{passenger.fullName}</td>
                  <td className="py-3 pr-4 font-mono text-xs uppercase">
                    {passenger.passportNumber}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs uppercase">
                    {passenger.flightNumber}
                  </td>
                  <td className="py-3">{passenger.travelDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
