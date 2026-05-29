import { NextResponse } from "next/server";

import { logApiRequest } from "@/lib/api/logger";
import {
  validateAndStorePassenger,
} from "@/lib/services/passenger-service";
import type { ApiFailureResponse, ApiSuccessResponse } from "@/lib/types/api";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/passenger/validate";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const response: ApiFailureResponse = {
      success: false,
      errors: ["Request body must be valid JSON"],
    };
    logApiRequest("POST", ROUTE_PATH, 400);
    return NextResponse.json(response, { status: 400 });
  }

  const result = validateAndStorePassenger(body);

  if (!result.success) {
    const response: ApiFailureResponse = {
      success: false,
      errors: result.errors,
    };
    logApiRequest("POST", ROUTE_PATH, 400);
    return NextResponse.json(response, { status: 400 });
  }

  const response: ApiSuccessResponse<{ id: number }> = {
    success: true,
    message: "Passenger validated successfully",
    data: { id: result.id },
  };

  logApiRequest("POST", ROUTE_PATH, 201);
  return NextResponse.json(response, { status: 201 });
}
