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

/** @table project_names */
export interface ProjectName {
  id: string;
  countryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table deliveries */
export interface Delivery {
  id: string;
  projectNameId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table domains */
export interface Domain {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table delivery_domains — many-to-many */
export interface DeliveryDomain {
  deliveryId: string;
  domainId: string;
}

/** @table nodes — standard telecom nodes */
export interface Node {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table domain_nodes — many-to-many */
export interface DomainNode {
  domainId: string;
  nodeId: string;
}

/** @table vendors */
export interface Vendor {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table vendor_node_names */
export interface VendorNodeName {
  id: string;
  nodeId: string;
  vendorId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** @table packages */
export interface Package {
  id: string;
  vendorNodeNameIds: string[];
  name: string;
  licensePackage: string;
  unit: string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

/** @table package_purchases — user-entered CAPEX entries */
export interface PackagePurchase {
  id: string;
  packageInstanceId: string;
  expansionQty: number;
  existingQty: number;
  currentTraffic: number;
  unitPrice: number;
  multiplier: number;
  createdAt: string;
  updatedAt: string;
}
