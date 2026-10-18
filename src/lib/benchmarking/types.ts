export type BenchmarkDimension =
  | "countries"
  | "deliveries"
  | "domains"
  | "vendorNodeNames"
  | "packages"
  | "licensePackages";

export type BenchmarkMetricFormat = "currency" | "number" | "percent" | "text";

export type BenchmarkMetricKey =
  | "unitPrice"
  | "avgUnitPrice"
  | "minUnitPrice"
  | "maxUnitPrice"
  | "totalCost"
  | "netTotal"
  | "discountPercent"
  | "discountAmount"
  | "packageCount"
  | "packagesWithData"
  | "expansionQuantity"
  | "costPerExpansion"
  | "unit"
  | "licensePackage"
  | "path";

export interface BenchmarkCandidate {
  id: string;
  label: string;
  description?: string;
  /** License package label for package dimension filtering */
  licensePackage?: string;
  /** Distinct year names under a VNN (tree) */
  yearNames?: string[];
}

export interface BenchmarkMetricDefinition {
  key: BenchmarkMetricKey;
  label: string;
  format: BenchmarkMetricFormat;
  primary?: boolean;
  source: "catalog" | "tree" | "derived";
  tooltip: string;
}

export interface BenchmarkColumn {
  id: string;
  label: string;
  description?: string;
  values: Partial<Record<BenchmarkMetricKey, string | number | null>>;
}

export interface BenchmarkComparison {
  dimension: BenchmarkDimension;
  metrics: BenchmarkMetricDefinition[];
  columns: BenchmarkColumn[];
  /** Metric used for min/max highlight and sorting */
  sortMetric: BenchmarkMetricKey;
}
