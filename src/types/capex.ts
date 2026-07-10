export type TreeNodeType =
  | "country"
  | "projectName"
  | "delivery"
  | "domain"
  | "node"
  | "vendor"
  | "vendorNodeName"
  | "package";

/** CAPEX quantity data for a package leaf — full form in Phase 4. */
export interface PackagePurchaseData {
  licensePackage: string;
  unit: string;
  expansionQty: number;
  existingQty: number;
  currentTraffic: number;
  unitPrice: number;
}

export interface CapexTreeNode {
  id: string;
  type: TreeNodeType;
  name: string;
  children: CapexTreeNode[];
  /** Reference to a catalog entry when created from a preset */
  catalogId?: string;
  /** Populated when package CAPEX is entered (Phase 4) */
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
