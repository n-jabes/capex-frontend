export type TreeNodeType =
  | "country"
  | "company"
  | "delivery"
  | "networkDomain"
  | "nodeName"
  | "nodeNameDB"
  | "feature";

export interface FeaturePurchaseData {
  currentLicenseQty: number;
  newLicenseQty: number;
  trafficQty: number;
  vendor: string;
}

export interface CapexTreeNode {
  id: string;
  type: TreeNodeType;
  name: string;
  children: CapexTreeNode[];
  /** Reference to catalog Node Name DB */
  nodeNameDBId?: string;
  /** Reference to catalog feature */
  featureId?: string;
  purchase?: FeaturePurchaseData;
}

export interface SelectedNode {
  id: string;
  type: TreeNodeType;
  name: string;
}

export interface FeatureCatalogItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  nodeNameDBId: string;
}

export interface NodeNameDBCatalogItem {
  id: string;
  name: string;
  description?: string;
}

export interface SummaryMetrics {
  totalCost: number;
  buyingQuantity: number;
  avgCurrentUtilization: number;
  avgPostExpansionUtilization: number;
  featureCount: number;
}

export interface FeatureDetailMetrics extends SummaryMetrics {
  unitPrice: number;
  vendor: string;
  unit: string;
  currentLicenseQty: number;
  newLicenseQty: number;
  trafficQty: number;
}

export interface AppSettings {
  defaultDeliveries: string[];
  defaultNetworkDomains: string[];
  defaultNodeNames: string[];
  nodeNameDBMapping: Record<string, string[]>;
  features: FeatureCatalogItem[];
}
