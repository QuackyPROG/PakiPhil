import "server-only";
export class ApiError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}
export function failure(error: unknown) {
  const status = error instanceof ApiError ? error.status : error instanceof SyntaxError ? 400 : 502;
  return Response.json({ error: error instanceof ApiError ? error.message : "Could not process this request. Please retry." }, { status, headers: { "Cache-Control": "no-store" } });
}
export async function lumen(service: "ocr" | "ai_chat", path: string, init: RequestInit = {}) {
  const key = process.env.LUMEN_API_KEY, secret = process.env.LUMEN_API_SECRET;
  if (!key || !secret) throw new ApiError("Configure the server's LUMEN_API_KEY and LUMEN_API_SECRET.", 503);
  const base = process.env.LUMEN_BASE_URL || "https://api.staging.nonlive.lumen.bayanichain.tech";
  const response = await fetch(`${base.replace(/\/$/, "")}/${service}${path}`, {
    ...init, cache: "no-store", signal: AbortSignal.timeout(30000),
    headers: { "lumen-api-key": key, "lumen-api-secret": secret, ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const code = body.code || body.error?.code || `HTTP ${response.status}`;
    throw new ApiError(`Lumen request failed (${String(code).slice(0, 100)}).`, response.status);
  }
  return response.json();
}
export async function jsonBody(request: Request, limit = 50000) {
  const text = await request.text();
  if (text.length > limit) throw new ApiError("Request is too large.", 413);
  return JSON.parse(text);
}
