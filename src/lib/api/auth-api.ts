import { capexFetch } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/api/config";

export type AuthUser = {
  id: string;
  email: string;
  organizationId: string;
  role: string;
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

export function authApiConfigured() {
  return getApiBaseUrl() !== null;
}
