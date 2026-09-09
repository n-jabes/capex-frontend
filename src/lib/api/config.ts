export function getApiBaseUrl(): string | null {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  return baseUrl || null;
}

/** True when the frontend should talk to the Nest API (cookie auth and/or bootstrap). */
export function isCapexApiConfigured(): boolean {
  return getApiBaseUrl() !== null;
}

export function getBootstrapHeaders(): HeadersInit | null {
  const key = process.env.NEXT_PUBLIC_BOOTSTRAP_KEY ?? "";
  const email = (process.env.NEXT_PUBLIC_USER_EMAIL ?? "").trim().toLowerCase();
  if (!key || !email) return null;
  return {
    "X-Bootstrap-Key": key,
    "X-User-Email": email,
  };
}
