const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";

export function logApiRequest(
  method: string,
  path: string,
  status: number,
): void {
  if (LOG_LEVEL === "silent") {
    return;
  }

  console.log(`[api] ${method} ${path} ${status}`);
}
