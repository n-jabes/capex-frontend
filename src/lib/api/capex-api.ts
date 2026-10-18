import { capexFetch } from "@/lib/api/client";
import type { AppCatalogs, CatalogRelationships, CapexTreeNode } from "@/types/capex";

export type PortfolioSummary = {
  id: string;
  name: string;
  status: string;
  version: number;
  updatedAt: string;
  createdAt: string;
};

export type PortfolioDetail = PortfolioSummary & {
  organizationId: string;
  ownerUserId: string;
  tree: CapexTreeNode[];
};

export type CatalogsResponse = {
  catalogs: AppCatalogs;
  relationships: CatalogRelationships;
  version: number;
};

export function listPortfolios() {
  return capexFetch<PortfolioSummary[]>("/api/portfolios");
}

export function getPortfolio(id: string) {
  return capexFetch<PortfolioDetail>(`/api/portfolios/${id}`);
}

export function updatePortfolioTree(
  id: string,
  body: { tree: CapexTreeNode[]; version: number },
) {
  return capexFetch<PortfolioDetail>(`/api/portfolios/${id}/tree`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function getMyCatalogs() {
  return capexFetch<CatalogsResponse>("/api/orgs/me/catalogs");
}

export function putMyCatalogs(body: {
  catalogs: AppCatalogs;
  relationships: CatalogRelationships;
  version: number;
}) {
  return capexFetch<CatalogsResponse>("/api/orgs/me/catalogs", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function importCatalogTemplate(body: {
  key: string;
  replaceTree?: boolean;
}) {
  return capexFetch<CatalogsResponse>("/api/orgs/me/catalogs/import-template", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type OrgSummary = {
  id: string;
  name: string;
  catalogVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type OrgMember = {
  membershipId: string;
  userId: string;
  email: string;
  status: string;
  role: string;
  joinedAt: string;
};

export type OrgInvitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  token: string;
  acceptUrl?: string;
};

export type InvitePreview = {
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  expiresAt: string;
};

export function getMyOrganization() {
  return capexFetch<OrgSummary>("/api/orgs/me");
}

export function renameOrganization(name: string) {
  return capexFetch<OrgSummary>("/api/orgs/me", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function listOrgMembers() {
  return capexFetch<OrgMember[]>("/api/orgs/me/members");
}

export function updateOrgMemberRole(
  userId: string,
  role: "admin" | "editor" | "viewer",
) {
  return capexFetch<{ userId: string; role: string }>(
    `/api/orgs/me/members/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export function removeOrgMember(userId: string) {
  return capexFetch<{ ok: boolean }>(`/api/orgs/me/members/${userId}`, {
    method: "DELETE",
  });
}

export function listOrgInvitations() {
  return capexFetch<OrgInvitation[]>("/api/orgs/me/invitations");
}

export function createOrgInvitation(body: {
  email: string;
  role: "admin" | "editor" | "viewer";
}) {
  return capexFetch<OrgInvitation>("/api/orgs/me/invitations", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "X-App-Origin":
        typeof window !== "undefined" ? window.location.origin : "",
    },
  });
}

export function revokeOrgInvitation(id: string) {
  return capexFetch<{ ok: boolean }>(`/api/orgs/me/invitations/${id}`, {
    method: "DELETE",
  });
}

export function getInvitationPreview(token: string) {
  return capexFetch<InvitePreview>(`/api/invitations/${token}`);
}

export function acceptInvitation(token: string) {
  return capexFetch<{ user: { id: string; email: string; organizationId: string; role: string } }>(
    `/api/invitations/${token}/accept`,
    { method: "POST" },
  );
}
