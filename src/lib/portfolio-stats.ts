import type { CapexTreeNode } from "@/types/capex";
import { computeSummaryForNode } from "@/lib/tree-utils";

export interface CountryPortfolioRow {
  id: string;
  name: string;
  totalCost: number;
  expansionQuantity: number;
  packageCount: number;
  packagesWithData: number;
  avgCurrentUtilization: number;
  avgPostExpansionUtilization: number;
}

export interface PortfolioStats {
  totalCost: number;
  totalExpansionQty: number;
  packageCount: number;
  packagesWithData: number;
  avgCurrentUtilization: number;
  avgPostExpansionUtilization: number;
  countryCount: number;
  countries: CountryPortfolioRow[];
}

export function computePortfolioStats(tree: CapexTreeNode[]): PortfolioStats {
  const countries = tree.map((country) => {
    const metrics = computeSummaryForNode(country);
    return {
      id: country.id,
      name: country.name,
      totalCost: metrics.totalCost,
      expansionQuantity: metrics.expansionQuantity,
      packageCount: metrics.packageCount,
      packagesWithData: metrics.packagesWithData,
      avgCurrentUtilization: metrics.avgCurrentUtilization,
      avgPostExpansionUtilization: metrics.avgPostExpansionUtilization,
    };
  });

  const totals = countries.reduce(
    (acc, country) => {
      acc.totalCost += country.totalCost;
      acc.totalExpansionQty += country.expansionQuantity;
      acc.packageCount += country.packageCount;
      acc.packagesWithData += country.packagesWithData;
      if (country.packagesWithData > 0) {
        acc.currentUtilSum += country.avgCurrentUtilization;
        acc.postUtilSum += country.avgPostExpansionUtilization;
        acc.utilCountryCount += 1;
      }
      return acc;
    },
    {
      totalCost: 0,
      totalExpansionQty: 0,
      packageCount: 0,
      packagesWithData: 0,
      currentUtilSum: 0,
      postUtilSum: 0,
      utilCountryCount: 0,
    },
  );

  return {
    totalCost: totals.totalCost,
    totalExpansionQty: totals.totalExpansionQty,
    packageCount: totals.packageCount,
    packagesWithData: totals.packagesWithData,
    avgCurrentUtilization:
      totals.utilCountryCount > 0
        ? totals.currentUtilSum / totals.utilCountryCount
        : 0,
    avgPostExpansionUtilization:
      totals.utilCountryCount > 0
        ? totals.postUtilSum / totals.utilCountryCount
        : 0,
    countryCount: tree.length,
    countries,
  };
}
