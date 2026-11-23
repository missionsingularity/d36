import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

export function requestId(req: NextRequest) {
  return req.headers.get("x-vercel-id") || randomUUID();
}

export function logApiRequest(input: {
  route: string;
  requestId: string;
  stage: string;
  startedAt: number;
  status: number;
  error?: unknown;
}) {
  const error = input.error as { name?: string; code?: unknown } | undefined;
  const code = typeof error?.code === "string" && /^[A-Z0-9_]{1,40}$/.test(error.code)
    ? error.code
    : undefined;
  console.info(JSON.stringify({
    event: "api_request_complete",
    route: input.route,
    requestId: input.requestId,
    stage: input.stage,
    status: input.status,
    elapsedMs: Math.max(0, Date.now() - input.startedAt),
    ...(input.error ? { errorType: error?.name || "Error", ...(code ? { errorCode: code } : {}) } : {}),
  }));
}
