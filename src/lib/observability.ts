/**
 * Optional Sentry hook. No-ops unless NEXT_PUBLIC_SENTRY_DSN is set.
 * Wire a real SDK later without changing call sites.
 */
export function captureClientError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  console.error("[sentry:client]", error, context ?? {});
}
