/**
 * Future PostgreSQL schema interfaces.
 * These types mirror planned database tables for when the MVP connects to a backend.
 */

/** @table countries */
export interface Country {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table companies */
export interface Company {
  id: string;
  countryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table deliveries */
export interface Delivery {
  id: string;
  companyId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table network_domains */
export interface NetworkDomain {
  id: string;
  deliveryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table node_names */
export interface NodeName {
  id: string;
  networkDomainId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table node_name_dbs — global catalog, constant across countries */
export interface NodeNameDB {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/** @table features — fixed unit prices managed by administrators */
export interface Feature {
  id: string;
  nodeNameDBId: string;
  name: string;
  unit: string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

/** @table feature_purchases — user-entered CAPEX entries */
export interface FeaturePurchase {
  id: string;
  nodeNameDBInstanceId: string;
  featureId: string;
  currentLicenseQty: number;
  newLicenseQty: number;
  trafficQty: number;
  vendor: string;
  createdAt: string;
  updatedAt: string;
}
