export type CapexApiConfig = {
  baseUrl: string;
  bootstrapKey: string;
  userEmail: string;
};

export function getCapexApiConfig(): CapexApiConfig | null {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const bootstrapKey = process.env.NEXT_PUBLIC_BOOTSTRAP_KEY ?? "";
  const userEmail = (process.env.NEXT_PUBLIC_USER_EMAIL ?? "").trim().toLowerCase();

  if (!baseUrl || !bootstrapKey || !userEmail) return null;
  return { baseUrl, bootstrapKey, userEmail };
}

export function isCapexApiConfigured(): boolean {
  return getCapexApiConfig() !== null;
}
