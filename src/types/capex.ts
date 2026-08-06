export type TreeNodeType =
  | "country"
  | "projectName"
  | "delivery"
  | "domain"
  | "node"
  | "vendor"
  | "vendorNodeName"
  | "package";

/** CAPEX quantity data for a license package instance. */
export interface PackagePurchaseData {
  licensePackage: string;
  unit: string;
  /** UI label: New License Quantity */
  expansionQty: number;
  /** UI label: Ex License Quantity */
  existingQty: number;
  currentTraffic: number;
  unitPrice: number;
  /** Unit scale factor (e.g. 1000 for KSAU→SAU). Default 1, never negative. */
  multiplier: number;
}

/** Selected package within a license year under a vendor node name. */
export interface LicensePackageInstance {
  id: string;
  catalogId: string;
  name: string;
  packageData?: PackagePurchaseData;
}

/** Year bucket of selected packages under a vendor node name. */
export interface LicenseYear {
  id: string;
  name: string;
  packages: LicensePackageInstance[];
}

export interface CapexTreeNode {
  id: string;
  type: TreeNodeType;
  name: string;
  children: CapexTreeNode[];
  /** Reference to a catalog entry when created from a preset */
  catalogId?: string;
  /** Free-text site name when type === "vendor" (name holds vendor catalog name) */
  siteName?: string;
  /** Discount % (0–100) for delivery → vendorNodeName levels */
  discountPercent?: number;
  /** Year-scoped package selections when type === "vendorNodeName" */
  licenseYears?: LicenseYear[];
  /** Legacy package leaf CAPEX data (migrated into licenseYears) */
  packageData?: PackagePurchaseData;
}

export interface SelectedNode {
  id: string;
  type: TreeNodeType;
  name: string;
}

export interface SummaryMetrics {
  totalCost: number;
  expansionQuantity: number;
  avgCurrentUtilization: number;
  avgPostExpansionUtilization: number;
  packageCount: number;
  packagesWithData: number;
  /** Pre-discount subtotal (VNN nodes) */
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  netTotal?: number;
}

/** Simple name-based catalog entry (project names, deliveries, domains, nodes, vendors). */
export interface CatalogItem {
  id: string;
  name: string;
}

/** Vendor-specific node name tied to a standard node and vendor. */
export interface VendorNodeNameCatalogItem {
  id: string;
  nodeId: string;
  vendorId: string;
  name: string;
}

/** Package catalog entry with default pricing metadata for Phase 4. */
export interface PackageCatalogItem {
  id: string;
  /** One package definition can apply to many vendor node names. */
  vendorNodeNameIds: string[];
  name: string;
  licensePackage: string;
  unit: string;
  unitPrice: number;
}

/** Many-to-many relationship maps — configured in Phase 3. */
export interface CatalogRelationships {
  deliveryDomains: Record<string, string[]>;
  domainNodes: Record<string, string[]>;
  countryVendors: Record<string, string[]>;
}

export interface AppCatalogs {
  projectNames: CatalogItem[];
  deliveries: CatalogItem[];
  domains: CatalogItem[];
  nodes: CatalogItem[];
  vendors: CatalogItem[];
  vendorNodeNames: VendorNodeNameCatalogItem[];
  packages: PackageCatalogItem[];
}

export interface AppSettings {
  catalogs: AppCatalogs;
  relationships: CatalogRelationships;
}

export type SimpleCatalogKey =
  | "projectNames"
  | "deliveries"
  | "domains"
  | "nodes"
  | "vendors";
