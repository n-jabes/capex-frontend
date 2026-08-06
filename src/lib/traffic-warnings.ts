import type { CapexTreeNode } from "@/types/capex";
import { isTrafficOverExisting } from "@/lib/package-entry-validation";

export interface TrafficWarningHit {
  vendorNodeId: string;
  vendorNodeName: string;
  packageId: string;
  packageName: string;
  yearName: string;
  currentTraffic: number;
  existingQty: number;
}

export function collectTrafficWarnings(
  node: CapexTreeNode,
): TrafficWarningHit[] {
  const hits: TrafficWarningHit[] = [];

  const walk = (current: CapexTreeNode) => {
    if (current.type === "vendorNodeName") {
      for (const year of current.licenseYears ?? []) {
        for (const pkg of year.packages) {
          if (!pkg.packageData) continue;
          if (!isTrafficOverExisting(pkg.packageData)) continue;
          hits.push({
            vendorNodeId: current.id,
            vendorNodeName: current.name,
            packageId: pkg.id,
            packageName:
              pkg.packageData.licensePackage?.trim() || pkg.name,
            yearName: year.name,
            currentTraffic: pkg.packageData.currentTraffic,
            existingQty: pkg.packageData.existingQty,
          });
        }
      }
    }

    for (const child of current.children) {
      walk(child);
    }
  };

  walk(node);
  return hits;
}

export function nodeHasTrafficWarning(node: CapexTreeNode): boolean {
  return collectTrafficWarnings(node).length > 0;
}

/** First vendor node name in the subtree that has a traffic capacity warning. */
export function findFirstWarningVendorNode(
  node: CapexTreeNode,
): CapexTreeNode | null {
  if (node.type === "vendorNodeName") {
    return collectTrafficWarnings(node).length > 0 ? node : null;
  }
  for (const child of node.children) {
    const found = findFirstWarningVendorNode(child);
    if (found) return found;
  }
  return null;
}
