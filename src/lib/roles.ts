/** Mirrors backend `common/roles.ts` for UI gating. Server remains source of truth. */

const WRITE_ROLES = new Set(["owner", "admin", "editor"]);

export type MembershipRole = "owner" | "admin" | "editor" | "viewer";

export function canMutateWorkspace(role: string | undefined | null): boolean {
  if (!role) return false;
  return WRITE_ROLES.has(role);
}

export function isOwnerOrAdmin(role: string | undefined | null): boolean {
  return role === "owner" || role === "admin";
}

export function roleLabel(role: string | undefined | null): string {
  if (!role) return "Unknown";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
