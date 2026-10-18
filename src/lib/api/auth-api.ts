import { capexFetch } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/api/config";

export type AuthUser = {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  status?: string;
  emailVerifiedAt?: string | null;
  lastPortfolioId?: string | null;
};

export async function register(
  email: string,
  password: string,
  inviteToken?: string,
) {
  return capexFetch<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      ...(inviteToken ? { inviteToken } : {}),
    }),
  });
}

export async function login(email: string, password: string) {
  return capexFetch<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return capexFetch<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getMe() {
  return capexFetch<AuthUser & { status: string }>("/api/auth/me");
}

export async function forgotPassword(email: string) {
  return capexFetch<{
    ok: boolean;
    message: string;
    devResetUrl?: string;
  }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email,
      appOrigin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    }),
    headers: {
      "X-App-Origin":
        typeof window !== "undefined" ? window.location.origin : "",
    },
  });
}

export async function resetPassword(token: string, password: string) {
  return capexFetch<{ ok: boolean }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function verifyEmail(token: string) {
  return capexFetch<{ ok: boolean }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerification() {
  return capexFetch<{
    ok: boolean;
    alreadyVerified?: boolean;
    devVerifyUrl?: string;
  }>("/api/auth/resend-verification", {
    method: "POST",
    headers: {
      "X-App-Origin":
        typeof window !== "undefined" ? window.location.origin : "",
    },
  });
}

export function authApiConfigured() {
  return getApiBaseUrl() !== null;
}
