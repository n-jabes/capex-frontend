import type {
  AppCatalogs,
  AppSettings,
  CapexTreeNode,
  CatalogItem,
  CatalogRelationships,
  TreeNodeType,
  VendorNodeNameCatalogItem,
} from "@/types/capex";
import { DEFAULT_RELATIONSHIPS } from "@/data/seedCatalogs";
import { getPackageVendorNodeNameIds } from "@/lib/catalog-utils";

export function relationshipsAreEmpty(
  relationships: CatalogRelationships | undefined,
): boolean {
  if (!relationships) return true;
  return (
    Object.keys(relationships.deliveryDomains ?? {}).length === 0 &&
    Object.keys(relationships.domainNodes ?? {}).length === 0 &&
    Object.keys(relationships.countryVendors ?? {}).length === 0
  );
}

export function withDefaultRelationshipsIfEmpty(
  relationships: CatalogRelationships | undefined,
): CatalogRelationships {
  if (!relationships || relationshipsAreEmpty(relationships)) {
    return {
      deliveryDomains: { ...DEFAULT_RELATIONSHIPS.deliveryDomains },
      domainNodes: { ...DEFAULT_RELATIONSHIPS.domainNodes },
      countryVendors: { ...DEFAULT_RELATIONSHIPS.countryVendors },
    };
  }
  return relationships;
}

export function getRelationshipTargets(
  mapping: Record<string, string[]>,
  sourceId: string,
): string[] {
  return mapping[sourceId] ?? [];
}

export function setRelationshipTargets(
  mapping: Record<string, string[]>,
  sourceId: string,
  targetIds: string[],
): Record<string, string[]> {
  const unique = [...new Set(targetIds)];
  if (unique.length === 0) {
    const { [sourceId]: _removed, ...rest } = mapping;
    return rest;
  }
  return { ...mapping, [sourceId]: unique };
}

export function resolveCatalogId(
  node: CapexTreeNode,
  catalogs: AppCatalogs,
  childType?: TreeNodeType,
): string | undefined {
  if (node.catalogId) return node.catalogId;

  const type = childType ?? node.type;
  const list = catalogListForType(catalogs, type);
  const match = list.find(
    (item) => item.name.toLowerCase() === node.name.toLowerCase(),
  );
  return match?.id;
}

function catalogListForType(
  catalogs: AppCatalogs,
  type: TreeNodeType,
): CatalogItem[] {
  switch (type) {
    case "projectName":
      return catalogs.projectNames;
    case "delivery":
      return catalogs.deliveries;
    case "domain":
      return catalogs.domains;
    case "node":
      return catalogs.nodes;
    case "vendor":
      return catalogs.vendors;
    case "vendorNodeName":
      return catalogs.vendorNodeNames.map((item) => ({
        id: item.id,
        name: item.name,
      }));
    case "package":
      return catalogs.packages.map((item) => ({
        id: item.id,
        name: item.name,
      }));
    default:
      return [];
  }
}

export function findAncestorInPath(
  path: CapexTreeNode[],
  type: TreeNodeType,
): CapexTreeNode | undefined {
  return [...path].reverse().find((node) => node.type === type);
}

export function findVendorNodeNameMapping(
  vendorNodeNames: VendorNodeNameCatalogItem[],
  nodeId: string,
  vendorId: string,
): VendorNodeNameCatalogItem | undefined {
  return vendorNodeNames.find(
    (item) => item.nodeId === nodeId && item.vendorId === vendorId,
  );
}

export function getFilteredPresetsForChild(
  settings: AppSettings,
  parentNode: CapexTreeNode,
  parentPath: CapexTreeNode[],
  childType: TreeNodeType,
): CatalogItem[] {
  const { catalogs, relationships } = settings;
  const maps = relationships ?? {
    deliveryDomains: {},
    domainNodes: {},
    countryVendors: {},
  };
  const all = catalogListForType(catalogs, childType);

  if (childType === "domain") {
    const deliveryId = resolveCatalogId(parentNode, catalogs, "delivery");
    if (!deliveryId) return all;
    const allowed = getRelationshipTargets(
      maps.deliveryDomains,
      deliveryId,
    );
    return allowed.length
      ? all.filter((item) => allowed.includes(item.id))
      : all;
  }

  if (childType === "node") {
    const domainId = resolveCatalogId(parentNode, catalogs, "domain");
    if (!domainId) return all;
    const allowed = getRelationshipTargets(maps.domainNodes, domainId);
    return allowed.length
      ? all.filter((item) => allowed.includes(item.id))
      : all;
  }

  if (childType === "vendor") {
    const country = findAncestorInPath(parentPath, "country");
    if (!country) return all;
    const allowed = getRelationshipTargets(
      maps.countryVendors,
      country.id,
    );
    return allowed.length
      ? all.filter((item) => allowed.includes(item.id))
      : all;
  }

  if (childType === "vendorNodeName") {
    const node = findAncestorInPath(parentPath, "node");
    const vendorId = resolveCatalogId(parentNode, catalogs, "vendor");
    if (!node || !vendorId) return all;
    const nodeId = resolveCatalogId(node, catalogs, "node");
    if (!nodeId) return all;
    const mapped = catalogs.vendorNodeNames
      .filter((item) => item.nodeId === nodeId && item.vendorId === vendorId)
      .map((item) => ({ id: item.id, name: item.name }));
    return mapped.length ? mapped : all;
  }

  if (childType === "package") {
    const vendorNodeNameId = resolveCatalogId(
      parentNode,
      catalogs,
      "vendorNodeName",
    );
    if (!vendorNodeNameId) return all;
    const mapped = catalogs.packages
      .filter((item) =>
        getPackageVendorNodeNameIds(item).includes(vendorNodeNameId),
      )
      .map((item) => ({ id: item.id, name: item.name }));
    return mapped.length ? mapped : all;
  }

  return all;
}

export function removeIdFromRelationshipMaps(
  relationships: CatalogRelationships | undefined,
  id: string,
): CatalogRelationships {
  const base = relationships ?? {
    deliveryDomains: {},
    domainNodes: {},
    countryVendors: {},
  };
  const strip = (mapping: Record<string, string[]>) => {
    const next: Record<string, string[]> = {};
    for (const [sourceId, targets] of Object.entries(mapping)) {
      if (sourceId === id) continue;
      const filtered = targets.filter((targetId) => targetId !== id);
      if (filtered.length > 0) next[sourceId] = filtered;
    }
    return next;
  };

  return {
    deliveryDomains: strip(base.deliveryDomains),
    domainNodes: strip(base.domainNodes),
    countryVendors: strip(base.countryVendors),
  };
}
