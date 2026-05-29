import { NextResponse } from "next/server";

import { logApiRequest } from "@/lib/api/logger";
import {
  getPassengers,
  removeAllPassengers,
} from "@/lib/services/passenger-service";
import type { PassengerRecord } from "@/lib/types/passenger";
import type { ApiFailureResponse, ApiSuccessResponse } from "@/lib/types/api";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/passengers";

export async function GET() {
  const passengers = getPassengers();

  const response: ApiSuccessResponse<PassengerRecord[]> = {
    success: true,
    data: passengers,
  };

  logApiRequest("GET", ROUTE_PATH, 200);
  return NextResponse.json(response);
}

export async function DELETE() {
  try {
    removeAllPassengers();

    const response: ApiSuccessResponse<[]> = {
      success: true,
      message: "All passengers cleared",
      data: [],
    };

    logApiRequest("DELETE", ROUTE_PATH, 200);
    return NextResponse.json(response);
  } catch {
    const response: ApiFailureResponse = {
      success: false,
      errors: ["Unable to clear passengers"],
    };
    logApiRequest("DELETE", ROUTE_PATH, 500);
    return NextResponse.json(response, { status: 500 });
  }
}
