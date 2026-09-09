export function getApiBaseUrl(): string | null {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  return baseUrl || null;
}

/** True when the frontend should talk to the Nest API (cookie auth). */
export function isCapexApiConfigured(): boolean {
  return getApiBaseUrl() !== null;
}
