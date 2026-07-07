import type {
  CapexTreeNode,
  FeatureCatalogItem,
  SelectedNode,
  SummaryMetrics,
} from "@/types/capex";
import { computePurchaseMetrics } from "@/lib/calculations";

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
          id: "company-yas",
          type: "company",
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

export function collectFeatureNodes(node: CapexTreeNode): CapexTreeNode[] {
  const features: CapexTreeNode[] = [];
  if (node.type === "feature" && node.purchase && node.featureId) {
    features.push(node);
  }
  for (const child of node.children) {
    features.push(...collectFeatureNodes(child));
  }
  return features;
}

export function computeSummaryForNode(
  node: CapexTreeNode,
  features: FeatureCatalogItem[],
): SummaryMetrics {
  const featureNodes = collectFeatureNodes(node);

  if (featureNodes.length === 0) {
    return {
      totalCost: 0,
      buyingQuantity: 0,
      avgCurrentUtilization: 0,
      avgPostExpansionUtilization: 0,
      featureCount: 0,
    };
  }

  let totalCost = 0;
  let buyingQuantity = 0;
  let currentUtilSum = 0;
  let postExpSum = 0;

  for (const fn of featureNodes) {
    const catalogFeature = features.find((f) => f.id === fn.featureId);
    if (!catalogFeature || !fn.purchase) continue;

    const metrics = computePurchaseMetrics(fn.purchase, catalogFeature.unitPrice);
    totalCost += metrics.totalPrice;
    buyingQuantity += metrics.buyingQuantity;
    currentUtilSum += metrics.currentLicensePercent;
    postExpSum += metrics.afterExpansionPercent;
  }

  return {
    totalCost,
    buyingQuantity,
    avgCurrentUtilization: currentUtilSum / featureNodes.length,
    avgPostExpansionUtilization: postExpSum / featureNodes.length,
    featureCount: featureNodes.length,
  };
}

export function getChildTypeForParent(
  parentType: CapexTreeNode["type"],
): CapexTreeNode["type"] | null {
  const map: Record<CapexTreeNode["type"], CapexTreeNode["type"] | null> = {
    country: "company",
    company: "delivery",
    delivery: "networkDomain",
    networkDomain: "nodeName",
    nodeName: "nodeNameDB",
    nodeNameDB: "feature",
    feature: null,
  };
  return map[parentType];
}

export function nodeTypeLabel(type: CapexTreeNode["type"]): string {
  const labels: Record<CapexTreeNode["type"], string> = {
    country: "Country",
    company: "Company",
    delivery: "Delivery",
    networkDomain: "Network Domain",
    nodeName: "Node Name",
    nodeNameDB: "Node Name DB",
    feature: "Feature",
  };
  return labels[type];
}

export function toSelectedNode(node: CapexTreeNode): SelectedNode {
  return { id: node.id, type: node.type, name: node.name };
}
