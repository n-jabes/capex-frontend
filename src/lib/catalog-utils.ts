import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_CATALOGS,
} from "@/data/seedCatalogs";
import { fixCatalogItemName } from "@/lib/catalog-display";
import { withDefaultRelationshipsIfEmpty } from "@/lib/relationship-utils";
import type {
  AppCatalogs,
  AppSettings,
  CatalogItem,
  PackageCatalogItem,
  PackagePurchaseData,
  SimpleCatalogKey,
  TreeNodeType,
  VendorNodeNameCatalogItem,
} from "@/types/capex";
import { generateId } from "@/lib/tree-utils";

type LegacyStringSettings = {
  defaultProjectNames?: string[];
  defaultDeliveries?: string[];
  defaultDomains?: string[];
  defaultNodes?: string[];
  defaultVendors?: string[];
  defaultVendorNodeNames?: string[];
  defaultPackages?: string[];
  defaultCompanies?: string[];
  defaultNetworkDomains?: string[];
  defaultNodeNames?: string[];
  features?: unknown;
  nodeNameDBMapping?: unknown;
};

type LegacyAppSettings = Partial<AppSettings> & LegacyStringSettings;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stringsToCatalog(
  names: string[] | undefined,
  prefix: string,
  fallback: CatalogItem[],
): CatalogItem[] {
  if (!names?.length) return fallback;
  return names.map((name) => ({
    id: `${prefix}-${slugify(name)}-${generateId().slice(-6)}`,
    name,
  }));
}

function stringsToVendorNodeNames(
  names: string[] | undefined,
  nodes: CatalogItem[],
  vendors: CatalogItem[],
  fallback: VendorNodeNameCatalogItem[],
): VendorNodeNameCatalogItem[] {
  if (!names?.length) return fallback;
  const nodeId = nodes[0]?.id ?? "";
  const vendorId = vendors[0]?.id ?? "";
  return names.map((name) => ({
    id: `vnn-${slugify(name)}-${generateId().slice(-6)}`,
    nodeId,
    vendorId,
    name,
  }));
}

function packagesNeedNormalization(
  packages: Array<PackageCatalogItem & { vendorNodeNameId?: string }> | undefined,
): boolean {
  if (!packages?.length) return false;
  return packages.some(
    (pkg) =>
      !Array.isArray(pkg.vendorNodeNameIds) ||
      (!!pkg.vendorNodeNameId && !pkg.vendorNodeNameIds?.length),
  );
}

export function getPackageVendorNodeNameIds(
  item: PackageCatalogItem & { vendorNodeNameId?: string },
): string[] {
  if (item.vendorNodeNameIds?.length) return item.vendorNodeNameIds;
  if (item.vendorNodeNameId) return [item.vendorNodeNameId];
  return [];
}
function normalizePackageItem(
  item: PackageCatalogItem & { vendorNodeNameId?: string },
): PackageCatalogItem {
  const vendorNodeNameIds = getPackageVendorNodeNameIds(item);
  const { vendorNodeNameId: _legacy, ...rest } = item;
  return { ...rest, vendorNodeNameIds };
}

function normalizeCatalogs(catalogs: AppCatalogs): AppCatalogs {
  return {
    projectNames: catalogs.projectNames.map(fixCatalogItemName),
    deliveries: catalogs.deliveries.map(fixCatalogItemName),
    domains: catalogs.domains.map(fixCatalogItemName),
    nodes: catalogs.nodes.map(fixCatalogItemName),
    vendors: catalogs.vendors.map(fixCatalogItemName),
    vendorNodeNames: catalogs.vendorNodeNames.map((item) => ({
      ...item,
      name: fixCatalogItemName({ id: item.id, name: item.name }).name,
    })),
    packages: catalogs.packages.map(normalizePackageItem),
  };
}
function stringsToPackages(
  names: string[] | undefined,
  vendorNodeNames: VendorNodeNameCatalogItem[],
  fallback: PackageCatalogItem[],
): PackageCatalogItem[] {
  if (!names?.length) return fallback;
  const vendorNodeNameIds = vendorNodeNames[0]?.id ? [vendorNodeNames[0].id] : [];
  return names.map((name) => ({
    id: `pkg-${slugify(name)}-${generateId().slice(-6)}`,
    vendorNodeNameIds,
    name,
    licensePackage: name,
    unit: "",
    unitPrice: 0,
  }));
}

function mergeCatalog(
  existing: CatalogItem[] | undefined,
  fallback: CatalogItem[],
): CatalogItem[] {
  return existing?.length ? existing : fallback;
}

export function normalizeAppSettings(settings: LegacyAppSettings): AppSettings {
  if (settings.catalogs) {
    return {
      catalogs: normalizeCatalogs({
        projectNames: mergeCatalog(
          settings.catalogs.projectNames,
          DEFAULT_CATALOGS.projectNames,
        ),
        deliveries: mergeCatalog(
          settings.catalogs.deliveries,
          DEFAULT_CATALOGS.deliveries,
        ),
        domains: mergeCatalog(
          settings.catalogs.domains,
          DEFAULT_CATALOGS.domains,
        ),
        nodes: mergeCatalog(settings.catalogs.nodes, DEFAULT_CATALOGS.nodes),
        vendors: mergeCatalog(
          settings.catalogs.vendors,
          DEFAULT_CATALOGS.vendors,
        ),
        vendorNodeNames:
          settings.catalogs.vendorNodeNames?.length
            ? settings.catalogs.vendorNodeNames
            : DEFAULT_CATALOGS.vendorNodeNames,
        packages:
          settings.catalogs.packages?.length
            ? settings.catalogs.packages
            : DEFAULT_CATALOGS.packages,
      }),
      relationships: withDefaultRelationshipsIfEmpty(settings.relationships),
    };
  }

  const projectNames = stringsToCatalog(
    settings.defaultProjectNames ??
      settings.defaultCompanies ??
      DEFAULT_CATALOGS.projectNames.map((item) => item.name),
    "proj",
    DEFAULT_CATALOGS.projectNames,
  );
  const deliveries = stringsToCatalog(
    settings.defaultDeliveries,
    "del",
    DEFAULT_CATALOGS.deliveries,
  );
  const domains = stringsToCatalog(
    settings.defaultDomains ?? settings.defaultNetworkDomains,
    "dom",
    DEFAULT_CATALOGS.domains,
  );
  const nodes = stringsToCatalog(
    settings.defaultNodes ?? settings.defaultNodeNames,
    "node",
    DEFAULT_CATALOGS.nodes,
  );
  const vendors = stringsToCatalog(
    settings.defaultVendors,
    "vendor",
    DEFAULT_CATALOGS.vendors,
  );
  const vendorNodeNames = stringsToVendorNodeNames(
    settings.defaultVendorNodeNames,
    nodes,
    vendors,
    DEFAULT_CATALOGS.vendorNodeNames,
  );
  const packages = stringsToPackages(
    settings.defaultPackages,
    vendorNodeNames,
    DEFAULT_CATALOGS.packages,
  );

  return {
    catalogs: normalizeCatalogs({
      projectNames,
      deliveries,
      domains,
      nodes,
      vendors,
      vendorNodeNames,
      packages,
    }),
    relationships: withDefaultRelationshipsIfEmpty(settings.relationships),
  };
}

export function settingsNeedCatalogMigration(
  settings: LegacyAppSettings,
): boolean {
  if (!settings.catalogs) return true;
  if (!settings.relationships) return true;
  return (
    settings.defaultProjectNames !== undefined ||
    settings.defaultCompanies !== undefined ||
    settings.defaultDeliveries !== undefined ||
    settings.defaultDomains !== undefined ||
    settings.defaultNetworkDomains !== undefined ||
    settings.defaultNodes !== undefined ||
    settings.defaultNodeNames !== undefined ||
    settings.defaultVendors !== undefined ||
    settings.defaultVendorNodeNames !== undefined ||
    settings.defaultPackages !== undefined ||
    settings.features !== undefined ||
    settings.nodeNameDBMapping !== undefined ||
    !settings.catalogs.domains?.length ||
    !settings.catalogs.nodes?.length ||
    !settings.catalogs.vendors?.length ||
    !settings.catalogs.vendorNodeNames?.length ||
    !settings.catalogs.packages?.length ||
    packagesNeedNormalization(settings.catalogs.packages)
  );
}

export function getCatalogByKey(
  settings: AppSettings,
  key: SimpleCatalogKey,
): CatalogItem[] {
  return settings.catalogs[key];
}

export function getPresetsForChildType(
  settings: AppSettings,
  childType: TreeNodeType,
): CatalogItem[] {
  switch (childType) {
    case "projectName":
      return settings.catalogs.projectNames;
    case "delivery":
      return settings.catalogs.deliveries;
    case "domain":
      return settings.catalogs.domains;
    case "node":
      return settings.catalogs.nodes;
    case "vendor":
      return settings.catalogs.vendors;
    case "vendorNodeName":
      return settings.catalogs.vendorNodeNames.map((item) => ({
        id: item.id,
        name: item.name,
      }));
    case "package":
      return settings.catalogs.packages.map((item) => ({
        id: item.id,
        name: item.name,
      }));
    default:
      return [];
  }
}

export function getPackageCatalogItem(
  settings: AppSettings,
  catalogId: string | undefined,
): PackageCatalogItem | undefined {
  if (!catalogId) return undefined;
  return settings.catalogs.packages.find((item) => item.id === catalogId);
}

export function findCatalogItemName(
  settings: AppSettings,
  catalogId: string,
): string | undefined {
  const { catalogs } = settings;
  const simpleLists: CatalogItem[][] = [
    catalogs.projectNames,
    catalogs.deliveries,
    catalogs.domains,
    catalogs.nodes,
    catalogs.vendors,
  ];
  for (const list of simpleLists) {
    const match = list.find((item) => item.id === catalogId);
    if (match) return match.name;
  }
  const vendorNode = catalogs.vendorNodeNames.find(
    (item) => item.id === catalogId,
  );
  if (vendorNode) return vendorNode.name;
  const pkg = catalogs.packages.find((item) => item.id === catalogId);
  if (pkg) return pkg.name;
  return undefined;
}

export function createCatalogItem(name: string, prefix: string): CatalogItem {
  return {
    id: `${prefix}-${slugify(name)}-${generateId().slice(-6)}`,
    name,
  };
}

export { DEFAULT_APP_SETTINGS };
