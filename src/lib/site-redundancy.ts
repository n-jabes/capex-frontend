import type { CapexTreeNode } from "@/types/capex";
import { computePackageMetrics } from "@/lib/calculations";
import { collectLicensePackages, displayVendorNodeName } from "@/lib/tree-utils";

/** N+1 survivability: sum of utils above this is unsafe if one peer fails. */
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

function packageGroupKey(catalogId: string, name: string): string {
  const catalog = catalogId.trim();
  if (catalog) return `catalog:${catalog}`;
  return `name:${name.trim().toLowerCase()}`;
}

export function packageCatalogHotKey(catalogId: string, name: string): string {
  return packageGroupKey(catalogId, name);
}

/**
 * Within one site (vendor), find catalog packages that appear on 2+ vendor node
 * names whose combined C. util exceeds the N+1 threshold.
 */
export function getSitePackageUtilHotSets(
  site: CapexTreeNode,
  threshold = SITE_REDUNDANCY_THRESHOLD,
): { catalogKeys: Set<string>; instanceIds: Set<string> } {
  const catalogKeys = new Set<string>();
  const instanceIds = new Set<string>();
  if (site.type !== "vendor") return { catalogKeys, instanceIds };

  type Entry = {
    instanceId: string;
    currentUtil: number;
    expansionUtil: number;
  };

  /** Per package key → one entry per VNN (max C. util across years). */
  const byKey = new Map<string, Entry[]>();

  for (const vnn of site.children) {
    if (vnn.type !== "vendorNodeName") continue;

    const bestByKey = new Map<string, Entry>();
    for (const year of vnn.licenseYears ?? []) {
      for (const pkg of year.packages) {
        if (!pkg.packageData) continue;
        const key = packageGroupKey(pkg.catalogId, pkg.name);
        const metrics = computePackageMetrics(pkg.packageData);
        const prev = bestByKey.get(key);
        if (!prev || metrics.currentUtilization > prev.currentUtil) {
          bestByKey.set(key, {
            instanceId: pkg.id,
            currentUtil: metrics.currentUtilization,
            expansionUtil: metrics.expansionUtilization,
          });
        }
      }
    }

    for (const [key, entry] of bestByKey) {
      const list = byKey.get(key) ?? [];
      list.push(entry);
      byKey.set(key, list);
    }
  }

  for (const [key, entries] of byKey) {
    if (entries.length < 2) continue;
    const sumCurrent = entries.reduce((sum, e) => sum + e.currentUtil, 0);
    if (sumCurrent <= threshold) continue;
    catalogKeys.add(key);
    for (const entry of entries) instanceIds.add(entry.instanceId);
  }

  // Also mark every package instance under the site that matches a hot catalog key
  // (covers other years beyond the per-VNN representative used for the sum).
  if (catalogKeys.size > 0) {
    for (const vnn of site.children) {
      if (vnn.type !== "vendorNodeName") continue;
      for (const year of vnn.licenseYears ?? []) {
        for (const pkg of year.packages) {
          if (!pkg.packageData) continue;
          const key = packageGroupKey(pkg.catalogId, pkg.name);
          if (catalogKeys.has(key)) instanceIds.add(pkg.id);
        }
      }
    }
  }

  return { catalogKeys, instanceIds };
}

/** Hot package instance ids under every site in the subtree. */
export function collectPackageUtilHotInstanceIds(
  root: CapexTreeNode,
  threshold = SITE_REDUNDANCY_THRESHOLD,
): Set<string> {
  const hot = new Set<string>();

  const walk = (node: CapexTreeNode) => {
    if (node.type === "vendor") {
      const { instanceIds } = getSitePackageUtilHotSets(node, threshold);
      for (const id of instanceIds) hot.add(id);
    }
    for (const child of node.children) walk(child);
  };

  walk(root);
  return hot;
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
