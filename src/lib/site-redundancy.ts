import type { CapexTreeNode } from "@/types/capex";
import { computePackageMetrics } from "@/lib/calculations";
import { collectLicensePackages, displayVendorNodeName } from "@/lib/tree-utils";

/** N+1 survivability: sum of site utils above this is unsafe if one site fails. */
export const SITE_REDUNDANCY_THRESHOLD = 80;

export interface SiteRedundancyWarningHit {
  nodeId: string;
  nodeName: string;
  siteCount: number;
  sumCurrentUtil: number;
  sumExpansionUtil: number;
  breachedMetric: "current" | "expansion" | "both";
  sites: Array<{
    id: string;
    name: string;
    currentUtil: number;
    expansionUtil: number;
  }>;
}

function averageSiteUtilizations(site: CapexTreeNode): {
  currentUtil: number;
  expansionUtil: number;
} | null {
  const packages = collectLicensePackages(site).filter((pkg) => pkg.packageData);
  if (packages.length === 0) return null;

  let currentSum = 0;
  let expansionSum = 0;
  for (const pkg of packages) {
    const metrics = computePackageMetrics(pkg.packageData!);
    currentSum += metrics.currentUtilization;
    expansionSum += metrics.expansionUtilization;
  }

  return {
    currentUtil: currentSum / packages.length,
    expansionUtil: expansionSum / packages.length,
  };
}

/** Evaluate one node’s direct vendor (site) children for N+1 risk. */
export function evaluateNodeSiteRedundancy(
  node: CapexTreeNode,
): SiteRedundancyWarningHit | null {
  if (node.type !== "node") return null;

  const sites = node.children.filter((child) => child.type === "vendor");
  const siteUtils: SiteRedundancyWarningHit["sites"] = [];

  for (const site of sites) {
    const utils = averageSiteUtilizations(site);
    if (!utils) continue;
    siteUtils.push({
      id: site.id,
      name: displayVendorNodeName(site),
      currentUtil: utils.currentUtil,
      expansionUtil: utils.expansionUtil,
    });
  }

  if (siteUtils.length < 2) return null;

  const sumCurrentUtil = siteUtils.reduce((sum, s) => sum + s.currentUtil, 0);
  const sumExpansionUtil = siteUtils.reduce(
    (sum, s) => sum + s.expansionUtil,
    0,
  );

  const currentBreach = sumCurrentUtil > SITE_REDUNDANCY_THRESHOLD;
  const expansionBreach = sumExpansionUtil > SITE_REDUNDANCY_THRESHOLD;
  if (!currentBreach && !expansionBreach) return null;

  return {
    nodeId: node.id,
    nodeName: node.name,
    siteCount: siteUtils.length,
    sumCurrentUtil,
    sumExpansionUtil,
    breachedMetric:
      currentBreach && expansionBreach
        ? "both"
        : currentBreach
          ? "current"
          : "expansion",
    sites: siteUtils,
  };
}

/** Collect N+1 warnings for every node in the subtree (node level and above). */
export function collectSiteRedundancyWarnings(
  root: CapexTreeNode,
): SiteRedundancyWarningHit[] {
  const hits: SiteRedundancyWarningHit[] = [];

  const walk = (current: CapexTreeNode) => {
    if (current.type === "node") {
      const hit = evaluateNodeSiteRedundancy(current);
      if (hit) hits.push(hit);
    }
    for (const child of current.children) {
      walk(child);
    }
  };

  walk(root);
  return hits;
}

export function nodeHasSiteRedundancyWarning(node: CapexTreeNode): boolean {
  return collectSiteRedundancyWarnings(node).length > 0;
}

export function findFirstRedundancyNode(
  node: CapexTreeNode,
): CapexTreeNode | null {
  if (node.type === "node") {
    return evaluateNodeSiteRedundancy(node) ? node : null;
  }
  for (const child of node.children) {
    const found = findFirstRedundancyNode(child);
    if (found) return found;
  }
  return null;
}
