import { getApiBaseUrl, getBootstrapHeaders } from "@/lib/api/config";

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

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(baseUrl: string): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function capexFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new CapexApiError("Capex API is not configured", 0, null);
  }

  const headers = new Headers(init.headers);
  const bootstrap = getBootstrapHeaders();
  if (bootstrap) {
    for (const [key, value] of Object.entries(bootstrap)) {
      headers.set(key, value);
    }
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry && !path.startsWith("/api/auth/")) {
    const refreshed = await tryRefresh(baseUrl);
    if (refreshed) {
      return capexFetch<T>(path, init, false);
    }
  }

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
