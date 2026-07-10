import type {
  CapexTreeNode,
  PackagePurchaseData,
  SelectedNode,
  SummaryMetrics,
} from "@/types/capex";
import { computePackageMetrics } from "@/lib/calculations";

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

export function collectPackageNodes(node: CapexTreeNode): CapexTreeNode[] {
  const packages: CapexTreeNode[] = [];
  if (node.type === "package") {
    packages.push(node);
  }
  for (const child of node.children) {
    packages.push(...collectPackageNodes(child));
  }
  return packages;
}

export function computeSummaryForNode(node: CapexTreeNode): SummaryMetrics {
  const packageNodes = collectPackageNodes(node);
  const withData = packageNodes.filter((p) => p.packageData);

  if (withData.length === 0) {
    return {
      totalCost: 0,
      expansionQuantity: 0,
      avgCurrentUtilization: 0,
      avgPostExpansionUtilization: 0,
      packageCount: packageNodes.length,
      packagesWithData: 0,
    };
  }

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

  return {
    totalCost,
    expansionQuantity,
    avgCurrentUtilization: currentUtilSum / withData.length,
    avgPostExpansionUtilization: postExpSum / withData.length,
    packageCount: packageNodes.length,
    packagesWithData: withData.length,
  };
}

export interface ChildRollupRow {
  id: string;
  name: string;
  type: CapexTreeNode["type"];
  metrics: SummaryMetrics;
}

export function computeChildRollups(node: CapexTreeNode): ChildRollupRow[] {
  return node.children.map((child) => ({
    id: child.id,
    name: child.name,
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
    vendorNodeName: "package",
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
    vendor: "Vendor",
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
    vendor: "vendors",
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
    migrated.packageData = {
      licensePackage: node.name,
      unit: "",
      expansionQty: Math.max(
        0,
        node.purchase.newLicenseQty - node.purchase.currentLicenseQty,
      ),
      existingQty: node.purchase.currentLicenseQty,
      currentTraffic: usedQty,
      unitPrice: 0,
    };
  } else if (node.packageData) {
    migrated.packageData = node.packageData;
  }

  if (node.catalogId) migrated.catalogId = node.catalogId;

  return migrated;
}

export function treeNeedsHierarchyMigration(nodes: CapexTreeNode[]): boolean {
  let needs = false;
  walkTreeNodes(nodes, (node) => {
    if (LEGACY_TREE_TYPES.has(node.type as string)) needs = true;
  });
  return needs;
}

export function migrateTreeHierarchy(nodes: CapexTreeNode[]): CapexTreeNode[] {
  return nodes.map((node) => sanitizeTreeNode(node as LegacyTreeNode));
}

export function migrateSelectedNodeType(
  type: string,
): CapexTreeNode["type"] | null {
  if (LEGACY_TREE_TYPES.has(type)) return mapLegacyNodeType(type);
  return type as CapexTreeNode["type"];
}
