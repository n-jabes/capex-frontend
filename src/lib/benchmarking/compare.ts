import type { AppCatalogs, CapexTreeNode, SummaryMetrics } from "@/types/capex";
import {
  applyDiscountToMetrics,
  computePackageMetrics,
} from "@/lib/calculations";
import { computeSummaryForNode, findNode } from "@/lib/tree-utils";
import { decodeLicensePackageId } from "./collect";
import type {
  BenchmarkColumn,
  BenchmarkComparison,
  BenchmarkDimension,
  BenchmarkMetricDefinition,
  BenchmarkMetricKey,
} from "./types";

const TREE_METRICS: BenchmarkMetricDefinition[] = [
  {
    key: "totalCost",
    label: "Total cost",
    format: "currency",
    primary: true,
    source: "tree",
    tooltip:
      "Rolled up from CAPEX Tree package quantities and unit prices under this node.",
  },
  {
    key: "netTotal",
    label: "After discount",
    format: "currency",
    primary: true,
    source: "tree",
    tooltip: "Total cost after the node discount percent is applied (when set).",
  },
  {
    key: "discountPercent",
    label: "Discount %",
    format: "percent",
    source: "tree",
    tooltip: "Discount percent configured on this tree node.",
  },
  {
    key: "discountAmount",
    label: "Discount amount",
    format: "currency",
    source: "tree",
    tooltip: "Absolute discount amount applied to the rolled-up subtotal.",
  },
  {
    key: "costPerExpansion",
    label: "Cost / expansion qty",
    format: "currency",
    source: "derived",
    tooltip:
      "Net total divided by expansion quantity — normalizes cost when quantities differ.",
  },
  {
    key: "expansionQuantity",
    label: "Expansion qty",
    format: "number",
    source: "tree",
    tooltip: "Sum of new license quantities under this node.",
  },
  {
    key: "packageCount",
    label: "Packages",
    format: "number",
    source: "tree",
    tooltip: "Number of license package instances under this node.",
  },
  {
    key: "packagesWithData",
    label: "Packages with data",
    format: "number",
    source: "tree",
    tooltip: "Packages that have CAPEX quantity / price data entered.",
  },
];

const PACKAGE_METRICS: BenchmarkMetricDefinition[] = [
  {
    key: "unitPrice",
    label: "Unit price",
    format: "currency",
    primary: true,
    source: "catalog",
    tooltip: "Catalog list unit price for this package.",
  },
  {
    key: "unit",
    label: "Unit",
    format: "text",
    source: "catalog",
    tooltip: "Pricing unit from the package catalog.",
  },
  {
    key: "licensePackage",
    label: "License package",
    format: "text",
    source: "catalog",
    tooltip: "License package family this catalog entry belongs to.",
  },
];

const LICENSE_PACKAGE_METRICS: BenchmarkMetricDefinition[] = [
  {
    key: "avgUnitPrice",
    label: "Avg unit price",
    format: "currency",
    primary: true,
    source: "catalog",
    tooltip: "Average catalog unit price across packages in this license family.",
  },
  {
    key: "minUnitPrice",
    label: "Min unit price",
    format: "currency",
    primary: true,
    source: "catalog",
    tooltip: "Lowest catalog unit price in this license family.",
  },
  {
    key: "maxUnitPrice",
    label: "Max unit price",
    format: "currency",
    primary: true,
    source: "catalog",
    tooltip: "Highest catalog unit price in this license family.",
  },
  {
    key: "packageCount",
    label: "Packages",
    format: "number",
    source: "catalog",
    tooltip: "Number of catalog packages sharing this license package name.",
  },
  {
    key: "unit",
    label: "Unit (sample)",
    format: "text",
    source: "catalog",
    tooltip: "Unit from the first package in the group (may vary).",
  },
];

function summaryToValues(
  metrics: SummaryMetrics,
): Partial<Record<BenchmarkMetricKey, string | number | null>> {
  const net = metrics.netTotal ?? metrics.totalCost;
  const expansion = metrics.expansionQuantity;
  return {
    totalCost: metrics.totalCost,
    netTotal: net,
    discountPercent: metrics.discountPercent ?? 0,
    discountAmount: metrics.discountAmount ?? 0,
    expansionQuantity: expansion,
    packageCount: metrics.packageCount,
    packagesWithData: metrics.packagesWithData,
    costPerExpansion: expansion > 0 ? net / expansion : null,
  };
}

/** VNN summary limited to a single license year name (Phase 3). */
export function computeVnnSummaryForYear(
  node: CapexTreeNode,
  yearName: string,
): SummaryMetrics {
  const year = (node.licenseYears ?? []).find((y) => y.name === yearName);
  if (!year) {
    return {
      totalCost: 0,
      expansionQuantity: 0,
      avgCurrentUtilization: 0,
      avgPostExpansionUtilization: 0,
      packageCount: 0,
      packagesWithData: 0,
    };
  }

  const withData = year.packages.filter((p) => p.packageData);
  let totalCost = 0;
  let expansionQuantity = 0;
  let currentUtilSum = 0;
  let postExpSum = 0;

  for (const pkg of withData) {
    const m = computePackageMetrics(pkg.packageData!);
    totalCost += m.totalPrice;
    expansionQuantity += m.expansionQty;
    currentUtilSum += m.currentUtilization;
    postExpSum += m.expansionUtilization;
  }

  const base: SummaryMetrics = {
    totalCost,
    expansionQuantity,
    avgCurrentUtilization: withData.length
      ? currentUtilSum / withData.length
      : 0,
    avgPostExpansionUtilization: withData.length
      ? postExpSum / withData.length
      : 0,
    packageCount: year.packages.length,
    packagesWithData: withData.length,
  };
  return applyDiscountToMetrics(base, node.discountPercent ?? 0);
}

function treeColumn(
  id: string,
  tree: CapexTreeNode[],
  yearFilter?: string,
): BenchmarkColumn | null {
  const node = findNode(tree, id);
  if (!node) return null;
  const metrics =
    node.type === "vendorNodeName" && yearFilter
      ? computeVnnSummaryForYear(node, yearFilter)
      : computeSummaryForNode(node);
  return {
    id,
    label: node.name,
    description: node.type,
    values: summaryToValues(metrics),
  };
}

export function metricsForDimension(
  dimension: BenchmarkDimension,
): BenchmarkMetricDefinition[] {
  if (dimension === "packages") return PACKAGE_METRICS;
  if (dimension === "licensePackages") return LICENSE_PACKAGE_METRICS;
  return TREE_METRICS;
}

export function sortMetricForDimension(
  dimension: BenchmarkDimension,
): BenchmarkMetricKey {
  if (dimension === "packages") return "unitPrice";
  if (dimension === "licensePackages") return "avgUnitPrice";
  return "netTotal";
}

export function buildComparison(
  dimension: BenchmarkDimension,
  selectedIds: string[],
  tree: CapexTreeNode[],
  catalogs: AppCatalogs,
  options?: { yearFilter?: string },
): BenchmarkComparison {
  const metrics = metricsForDimension(dimension);
  const sortMetric = sortMetricForDimension(dimension);
  const columns: BenchmarkColumn[] = [];

  if (
    dimension === "countries" ||
    dimension === "deliveries" ||
    dimension === "domains" ||
    dimension === "vendorNodeNames"
  ) {
    for (const id of selectedIds) {
      const col = treeColumn(
        id,
        tree,
        dimension === "vendorNodeNames" ? options?.yearFilter : undefined,
      );
      if (col) columns.push(col);
    }
  } else if (dimension === "packages") {
    for (const id of selectedIds) {
      const pkg = catalogs.packages.find((p) => p.id === id);
      if (!pkg) continue;
      columns.push({
        id: pkg.id,
        label: pkg.name,
        description: pkg.licensePackage,
        values: {
          unitPrice: pkg.unitPrice,
          unit: pkg.unit,
          licensePackage: pkg.licensePackage,
        },
      });
    }
  } else {
    for (const id of selectedIds) {
      const name = decodeLicensePackageId(id);
      if (name == null) continue;
      const pkgs = catalogs.packages.filter(
        (p) => (p.licensePackage.trim() || "(Unlabeled)") === name,
      );
      if (pkgs.length === 0) continue;
      const prices = pkgs.map((p) => p.unitPrice);
      const avg = prices.reduce((s, n) => s + n, 0) / prices.length;
      columns.push({
        id,
        label: name,
        description: `${pkgs.length} packages`,
        values: {
          avgUnitPrice: avg,
          minUnitPrice: Math.min(...prices),
          maxUnitPrice: Math.max(...prices),
          packageCount: pkgs.length,
          unit: pkgs[0]?.unit ?? "",
        },
      });
    }
  }

  return { dimension, metrics, columns, sortMetric };
}

export function numericValue(
  column: BenchmarkColumn,
  key: BenchmarkMetricKey,
): number | null {
  const raw = column.values[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}
