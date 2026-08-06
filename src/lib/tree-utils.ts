import type {
  CapexTreeNode,
  LicensePackageInstance,
  LicenseYear,
  PackagePurchaseData,
  SelectedNode,
  SummaryMetrics,
} from "@/types/capex";
import {
  applyDiscountToMetrics,
  computePackageMetrics,
  normalizeMultiplier,
  normalizePackagePurchaseData,
} from "@/lib/calculations";

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createInitialTree(): CapexTreeNode[] {
  return [
    {
      id: "country-rwanda",
      type: "country",
      name: "Rwanda",
      children: [
        {
          id: "project-yas",
          type: "projectName",
          name: "YAS CAPEX",
          children: [],
        },
      ],
    },
  ];
}

export function findNode(
  nodes: CapexTreeNode[],
  id: string,
): CapexTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

export function findNodePath(
  nodes: CapexTreeNode[],
  id: string,
  path: CapexTreeNode[] = [],
): CapexTreeNode[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node];
    if (node.id === id) return currentPath;
    const found = findNodePath(node.children, id, currentPath);
    if (found) return found;
  }
  return null;
}

export function updateNodeInTree(
  nodes: CapexTreeNode[],
  id: string,
  updater: (node: CapexTreeNode) => CapexTreeNode,
): CapexTreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    return { ...node, children: updateNodeInTree(node.children, id, updater) };
  });
}

export function deleteNodeFromTree(
  nodes: CapexTreeNode[],
  id: string,
): CapexTreeNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: deleteNodeFromTree(node.children, id),
    }));
}

export function addChildToNode(
  nodes: CapexTreeNode[],
  parentId: string,
  child: CapexTreeNode,
): CapexTreeNode[] {
  return updateNodeInTree(nodes, parentId, (node) => ({
    ...node,
    children: [...node.children, child],
  }));
}

/** Flatten license package instances under a node (including nested VNNs). */
export function collectLicensePackages(
  node: CapexTreeNode,
): Array<LicensePackageInstance & { yearId: string; yearName: string; vnnName: string }> {
  const results: Array<
    LicensePackageInstance & { yearId: string; yearName: string; vnnName: string }
  > = [];

  if (node.type === "vendorNodeName") {
    for (const year of node.licenseYears ?? []) {
      for (const pkg of year.packages) {
        results.push({
          ...pkg,
          yearId: year.id,
          yearName: year.name,
          vnnName: node.name,
        });
      }
    }
  }

  // Legacy package children (pre-migration)
  if (node.type === "package") {
    results.push({
      id: node.id,
      catalogId: node.catalogId ?? "",
      name: node.name,
      packageData: node.packageData,
      yearId: "",
      yearName: "Year One",
      vnnName: node.name,
    });
  }

  for (const child of node.children) {
    results.push(...collectLicensePackages(child));
  }
  return results;
}

/** @deprecated Prefer collectLicensePackages — kept for adapters during transition */
export function collectPackageNodes(node: CapexTreeNode): CapexTreeNode[] {
  return collectLicensePackages(node).map((pkg) => ({
    id: pkg.id,
    type: "package" as const,
    name: pkg.name,
    children: [],
    catalogId: pkg.catalogId,
    packageData: pkg.packageData,
  }));
}

export function computeSummaryForNode(node: CapexTreeNode): SummaryMetrics {
  if (node.type === "vendorNodeName") {
    const packages = collectLicensePackages(node);
    const withData = packages.filter((p) => p.packageData);
    let totalCost = 0;
    let expansionQuantity = 0;
    let currentUtilSum = 0;
    let postExpSum = 0;

    for (const pkg of withData) {
      const metrics = computePackageMetrics(pkg.packageData!);
      totalCost += metrics.totalPrice;
      expansionQuantity += metrics.expansionQty;
      currentUtilSum += metrics.currentUtilization;
      postExpSum += metrics.expansionUtilization;
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
      packageCount: packages.length,
      packagesWithData: withData.length,
    };
    return applyDiscountToMetrics(base, node.discountPercent ?? 0);
  }

  if (node.children.length > 0) {
    const childMetrics = node.children.map(computeSummaryForNode);
    const packages = collectLicensePackages(node);
    const withData = packages.filter((p) => p.packageData);
    let expansionQuantity = 0;
    let currentUtilSum = 0;
    let postExpSum = 0;
    for (const pkg of withData) {
      const metrics = computePackageMetrics(pkg.packageData!);
      expansionQuantity += metrics.expansionQty;
      currentUtilSum += metrics.currentUtilization;
      postExpSum += metrics.expansionUtilization;
    }
    return {
      totalCost: childMetrics.reduce((sum, m) => sum + m.totalCost, 0),
      expansionQuantity,
      avgCurrentUtilization: withData.length
        ? currentUtilSum / withData.length
        : 0,
      avgPostExpansionUtilization: withData.length
        ? postExpSum / withData.length
        : 0,
      packageCount: packages.length,
      packagesWithData: withData.length,
    };
  }

  // Legacy package leaf
  if (node.type === "package" && node.packageData) {
    const metrics = computePackageMetrics(node.packageData);
    return {
      totalCost: metrics.totalPrice,
      expansionQuantity: metrics.expansionQty,
      avgCurrentUtilization: metrics.currentUtilization,
      avgPostExpansionUtilization: metrics.expansionUtilization,
      packageCount: 1,
      packagesWithData: 1,
    };
  }

  return {
    totalCost: 0,
    expansionQuantity: 0,
    avgCurrentUtilization: 0,
    avgPostExpansionUtilization: 0,
    packageCount: 0,
    packagesWithData: 0,
  };
}

export function computeVendorNodeMetricsForYear(
  node: CapexTreeNode,
  yearId: string | "all",
): SummaryMetrics {
  if (node.type !== "vendorNodeName") {
    return computeSummaryForNode(node);
  }

  const years = node.licenseYears ?? [];
  const packages =
    yearId === "all"
      ? years.flatMap((year) => year.packages)
      : (years.find((year) => year.id === yearId)?.packages ?? []);

  const withData = packages.filter((pkg) => pkg.packageData);
  let totalCost = 0;
  let expansionQuantity = 0;
  let currentUtilSum = 0;
  let postExpSum = 0;

  for (const pkg of withData) {
    const metrics = computePackageMetrics(pkg.packageData!);
    totalCost += metrics.totalPrice;
    expansionQuantity += metrics.expansionQty;
    currentUtilSum += metrics.currentUtilization;
    postExpSum += metrics.expansionUtilization;
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
    packageCount: packages.length,
    packagesWithData: withData.length,
  };

  return applyDiscountToMetrics(base, node.discountPercent ?? 0);
}

export function displayVendorNodeName(node: CapexTreeNode): string {
  if (node.type !== "vendor") return node.name;
  const site = node.siteName?.trim();
  if (site) return `${site} (${node.name})`;
  return node.name;
}

export interface ChildRollupRow {
  id: string;
  name: string;
  type: CapexTreeNode["type"];
  metrics: SummaryMetrics;
}

export function computeChildRollups(node: CapexTreeNode): ChildRollupRow[] {
  return node.children
    .filter((child) => child.type !== "package")
    .map((child) => ({
      id: child.id,
      name:
        child.type === "vendor" ? displayVendorNodeName(child) : child.name,
      type: child.type,
      metrics: computeSummaryForNode(child),
    }));
}

export function getChildTypeForParent(
  parentType: CapexTreeNode["type"],
): CapexTreeNode["type"] | null {
  const map: Record<CapexTreeNode["type"], CapexTreeNode["type"] | null> = {
    country: "projectName",
    projectName: "delivery",
    delivery: "domain",
    domain: "node",
    node: "vendor",
    vendor: "vendorNodeName",
    vendorNodeName: null,
    package: null,
  };
  return map[parentType];
}

export function nodeTypeLabel(type: CapexTreeNode["type"]): string {
  const labels: Record<CapexTreeNode["type"], string> = {
    country: "Country",
    projectName: "Project Name",
    delivery: "Delivery",
    domain: "Domain",
    node: "Node",
    vendor: "Site Name",
    vendorNodeName: "Vendor Node Name",
    package: "Package",
  };
  return labels[type];
}

export function toSelectedNode(node: CapexTreeNode): SelectedNode {
  return { id: node.id, type: node.type, name: node.name };
}

export type TreeExpansionState = Record<string, boolean>;

export function walkTreeNodes(
  nodes: CapexTreeNode[],
  visitor: (node: CapexTreeNode, depth: number) => void,
  depth = 0,
): void {
  for (const node of nodes) {
    visitor(node, depth);
    walkTreeNodes(node.children, visitor, depth + 1);
  }
}

export function buildDefaultExpansionState(
  nodes: CapexTreeNode[],
  defaultExpandedDepth = 3,
): TreeExpansionState {
  const state: TreeExpansionState = {};
  walkTreeNodes(nodes, (node, depth) => {
    state[node.id] = depth < defaultExpandedDepth;
  });
  return state;
}

/** Collapse every node so only top-level countries remain visible. */
export function collapseExpansionToCountries(
  nodes: CapexTreeNode[],
): TreeExpansionState {
  const state: TreeExpansionState = {};
  walkTreeNodes(nodes, (node) => {
    state[node.id] = false;
  });
  return state;
}

/** Expand a node and collapse all of its descendants. */
export function collapseExpansionToDirectChildren(
  node: CapexTreeNode,
): TreeExpansionState {
  const state: TreeExpansionState = { [node.id]: true };

  function walkDescendants(current: CapexTreeNode) {
    for (const child of current.children) {
      state[child.id] = false;
      walkDescendants(child);
    }
  }

  walkDescendants(node);
  return state;
}

export function collapseToChildTypeLabel(
  nodeType: CapexTreeNode["type"],
): string | null {
  const childType = getChildTypeForParent(nodeType);
  if (!childType) return null;

  const pluralLabels: Partial<Record<CapexTreeNode["type"], string>> = {
    projectName: "project names",
    delivery: "deliveries",
    domain: "domains",
    node: "nodes",
    vendor: "site names",
    vendorNodeName: "vendor node names",
    package: "packages",
  };

  return `Collapse to ${pluralLabels[childType] ?? `${nodeTypeLabel(childType).toLowerCase()}s`}`;
}

const LEGACY_TREE_TYPES = new Set([
  "company",
  "networkDomain",
  "nodeName",
  "nodeNameDB",
  "feature",
]);

const LEGACY_TYPE_MAP: Record<string, CapexTreeNode["type"]> = {
  company: "projectName",
  networkDomain: "domain",
  nodeName: "node",
  nodeNameDB: "vendorNodeName",
  feature: "package",
};

function mapLegacyNodeType(type: string): CapexTreeNode["type"] {
  return LEGACY_TYPE_MAP[type] ?? (type as CapexTreeNode["type"]);
}

type LegacyTreeNode = CapexTreeNode & {
  nodeNameDBId?: string;
  featureId?: string;
  purchase?: {
    currentLicenseQty: number;
    newLicenseQty: number;
    trafficQty: number;
    vendor: string;
  };
};

function sanitizeTreeNode(node: LegacyTreeNode): CapexTreeNode {
  const type = mapLegacyNodeType(node.type as string);
  let children = (node.children ?? []).map(sanitizeTreeNode);

  if (type === "node") {
    children = children.flatMap((child) => {
      if (child.type === "vendorNodeName") {
        return [
          {
            id: generateId(),
            type: "vendor" as const,
            name: "Ericsson",
            children: [child],
          },
        ];
      }
      return [child];
    });
  }

  const migrated: CapexTreeNode = {
    id: node.id,
    type,
    name: node.name,
    children,
  };

  if (type === "package" && node.purchase) {
    const usedQty = Math.max(
      0,
      node.purchase.currentLicenseQty - node.purchase.trafficQty,
    );
    migrated.packageData = normalizePackagePurchaseData({
      licensePackage: node.name,
      unit: "",
      expansionQty: Math.max(
        0,
        node.purchase.newLicenseQty - node.purchase.currentLicenseQty,
      ),
      existingQty: node.purchase.currentLicenseQty,
      currentTraffic: usedQty,
      unitPrice: 0,
      multiplier: 1,
    });
  } else if (node.packageData) {
    migrated.packageData = normalizePackagePurchaseData({
      ...node.packageData,
      multiplier: normalizeMultiplier(
        (node.packageData as PackagePurchaseData).multiplier,
      ),
    });
  }

  if (node.catalogId) migrated.catalogId = node.catalogId;
  if (node.siteName) migrated.siteName = node.siteName;
  if (node.discountPercent !== undefined) {
    migrated.discountPercent = node.discountPercent;
  }
  if (node.licenseYears) migrated.licenseYears = node.licenseYears;

  return migrated;
}

function migrateVendorNodePackages(node: CapexTreeNode): CapexTreeNode {
  const children = node.children.map(migrateVendorNodePackages);

  if (node.type === "vendor") {
    return {
      ...node,
      siteName: node.siteName?.trim() || node.name,
      children,
    };
  }

  if (node.type !== "vendorNodeName") {
    return { ...node, children };
  }

  const packageChildren = children.filter((child) => child.type === "package");
  const otherChildren = children.filter((child) => child.type !== "package");

  let licenseYears: LicenseYear[] = (node.licenseYears ?? []).map((year) => ({
    ...year,
    packages: year.packages.map((pkg) => ({
      ...pkg,
      packageData: pkg.packageData
        ? normalizePackagePurchaseData({
            ...pkg.packageData,
            multiplier: normalizeMultiplier(pkg.packageData.multiplier),
          })
        : undefined,
    })),
  }));

  if (packageChildren.length > 0) {
    const migratedPackages: LicensePackageInstance[] = packageChildren.map(
      (child) => ({
        id: child.id,
        catalogId: child.catalogId ?? "",
        name: child.name,
        packageData: child.packageData
          ? normalizePackagePurchaseData({
              ...child.packageData,
              multiplier: normalizeMultiplier(child.packageData.multiplier),
            })
          : undefined,
      }),
    );

    if (licenseYears.length === 0) {
      licenseYears = [
        {
          id: `year-${generateId()}`,
          name: "Year One",
          packages: migratedPackages,
        },
      ];
    } else {
      const existingIds = new Set(
        licenseYears.flatMap((year) => year.packages.map((pkg) => pkg.id)),
      );
      const toAdd = migratedPackages.filter((pkg) => !existingIds.has(pkg.id));
      if (toAdd.length) {
        licenseYears = [
          {
            ...licenseYears[0],
            packages: [...licenseYears[0].packages, ...toAdd],
          },
          ...licenseYears.slice(1),
        ];
      }
    }
  }

  return {
    ...node,
    licenseYears,
    discountPercent: node.discountPercent ?? 0,
    children: otherChildren,
  };
}

export function treeNeedsHierarchyMigration(nodes: CapexTreeNode[]): boolean {
  let needs = false;
  walkTreeNodes(nodes, (node) => {
    if (LEGACY_TREE_TYPES.has(node.type as string)) needs = true;
  });
  return needs;
}

export function treeNeedsLicenseYearsMigration(nodes: CapexTreeNode[]): boolean {
  let needs = false;
  walkTreeNodes(nodes, (node) => {
    if (node.type === "vendor" && !node.siteName) needs = true;
    if (
      node.type === "vendorNodeName" &&
      node.children.some((child) => child.type === "package")
    ) {
      needs = true;
    }
    if (
      node.type === "vendorNodeName" &&
      (node.licenseYears ?? []).some((year) =>
        year.packages.some(
          (pkg) => pkg.packageData && pkg.packageData.multiplier === undefined,
        ),
      )
    ) {
      needs = true;
    }
  });
  return needs;
}

export function migrateTreeHierarchy(nodes: CapexTreeNode[]): CapexTreeNode[] {
  return nodes.map((node) => sanitizeTreeNode(node as LegacyTreeNode));
}

export function migrateLicenseYearsTree(nodes: CapexTreeNode[]): CapexTreeNode[] {
  return nodes.map(migrateVendorNodePackages);
}

export function migrateSelectedNodeType(
  type: string,
): CapexTreeNode["type"] | null {
  if (LEGACY_TREE_TYPES.has(type)) return mapLegacyNodeType(type);
  return type as CapexTreeNode["type"];
}
