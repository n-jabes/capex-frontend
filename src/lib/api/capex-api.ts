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
