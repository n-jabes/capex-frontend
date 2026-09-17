import type { AppCatalogs, CapexTreeNode, TreeNodeType } from "@/types/capex";
import type { BenchmarkCandidate, BenchmarkDimension } from "./types";

const TREE_TYPE_BY_DIMENSION: Partial<
  Record<BenchmarkDimension, TreeNodeType>
> = {
  countries: "country",
  deliveries: "delivery",
  domains: "domain",
  vendorNodeNames: "vendorNodeName",
};

function walk(
  nodes: CapexTreeNode[],
  path: CapexTreeNode[],
  visit: (node: CapexTreeNode, path: CapexTreeNode[]) => void,
) {
  for (const node of nodes) {
    const next = [...path, node];
    visit(node, next);
    if (node.children.length) walk(node.children, next, visit);
  }
}

function pathLabel(path: CapexTreeNode[], node: CapexTreeNode): string {
  const ancestors = path
    .slice(0, -1)
    .map((n) => n.name)
    .filter(Boolean);
  if (ancestors.length === 0) return node.name;
  // Keep label readable: node name + nearest context
  const context = ancestors.slice(-2).join(" · ");
  return `${node.name} · ${context}`;
}

function yearNamesForVnn(node: CapexTreeNode): string[] {
  const names = (node.licenseYears ?? []).map((y) => y.name).filter(Boolean);
  return [...new Set(names)];
}

export function collectCandidates(
  dimension: BenchmarkDimension,
  tree: CapexTreeNode[],
  catalogs: AppCatalogs,
  options?: { licensePackageFilter?: string },
): BenchmarkCandidate[] {
  const treeType = TREE_TYPE_BY_DIMENSION[dimension];
  if (treeType) {
    const items: BenchmarkCandidate[] = [];
    walk(tree, [], (node, path) => {
      if (node.type !== treeType) return;
      items.push({
        id: node.id,
        label: pathLabel(path, node),
        description: node.catalogId ? `Catalog ref · ${node.name}` : undefined,
        yearNames:
          treeType === "vendorNodeName" ? yearNamesForVnn(node) : undefined,
      });
    });
    return items.sort((a, b) => a.label.localeCompare(b.label));
  }

  if (dimension === "packages") {
    const filter = options?.licensePackageFilter?.trim();
    return catalogs.packages
      .filter((pkg) => !filter || pkg.licensePackage === filter)
      .map((pkg) => ({
        id: pkg.id,
        label: pkg.name,
        description: `${pkg.licensePackage} · ${pkg.unit}`,
        licensePackage: pkg.licensePackage,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // licensePackages — aggregate by license package name
  const byLicense = new Map<
    string,
    { count: number; prices: number[]; unit: string }
  >();
  for (const pkg of catalogs.packages) {
    const key = pkg.licensePackage.trim() || "(Unlabeled)";
    const entry = byLicense.get(key) ?? { count: 0, prices: [], unit: pkg.unit };
    entry.count += 1;
    entry.prices.push(pkg.unitPrice);
    entry.unit = pkg.unit || entry.unit;
    byLicense.set(key, entry);
  }

  return [...byLicense.entries()]
    .map(([name, meta]) => ({
      id: encodeLicensePackageId(name),
      label: name,
      description: `${meta.count} package${meta.count === 1 ? "" : "s"} · ${meta.unit || "—"}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function encodeLicensePackageId(name: string): string {
  return `lp:${encodeURIComponent(name)}`;
}

export function decodeLicensePackageId(id: string): string | null {
  if (!id.startsWith("lp:")) return null;
  try {
    return decodeURIComponent(id.slice(3));
  } catch {
    return null;
  }
}

export function listLicensePackageOptions(catalogs: AppCatalogs): string[] {
  return [
    ...new Set(
      catalogs.packages
        .map((p) => p.licensePackage.trim())
        .filter((name) => name.length > 0),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

export function listYearOptionsFromCandidates(
  candidates: BenchmarkCandidate[],
): string[] {
  const years = new Set<string>();
  for (const c of candidates) {
    for (const y of c.yearNames ?? []) years.add(y);
  }
  return [...years].sort((a, b) => a.localeCompare(b));
}
