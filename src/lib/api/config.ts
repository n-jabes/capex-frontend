/**
 * API base URL for browser fetches.
 * - unset → localStorage-only demo mode
 * - "same-origin" / "" / "/" → same-origin `/api` via Next rewrite (custom domain / later)
 * - absolute URL → direct Nest (interim Vercel↔Railway CORS + SameSite=None)
 */
export function getApiBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw === undefined) return null;
  const trimmed = raw.trim().replace(/\/$/, "");
  if (trimmed === "" || trimmed === "/" || trimmed.toLowerCase() === "same-origin") {
    return "";
  }
  return trimmed;
}

/** True when the frontend should talk to the Nest API (cookie auth). */
export function isCapexApiConfigured(): boolean {
  return getApiBaseUrl() !== null;
}

/** Browser hits this Next host `/api` (first-party cookies). */
export function isSameOriginApiMode(): boolean {
  const base = getApiBaseUrl();
  return base === "";
}

/** Build a request URL for an API path that always starts with `/api`. */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (base === null) {
    throw new Error("Capex API is not configured");
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
