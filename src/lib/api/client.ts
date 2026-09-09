import { getCapexApiConfig } from "@/lib/api/config";

export class CapexApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "CapexApiError";
    this.status = status;
    this.body = body;
  }
}

export async function capexFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getCapexApiConfig();
  if (!config) {
    throw new CapexApiError("Capex API is not configured", 0, null);
  }

  const headers = new Headers(init.headers);
  headers.set("X-Bootstrap-Key", config.bootstrapKey);
  headers.set("X-User-Email", config.userEmail);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${response.status})`;
    throw new CapexApiError(message, response.status, body);
  }

  return body as T;
}
