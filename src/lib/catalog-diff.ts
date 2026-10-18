import type {
  AppCatalogs,
  AppSettings,
  CatalogItem,
  CatalogRelationships,
  PackageCatalogItem,
  SimpleCatalogKey,
  VendorNodeNameCatalogItem,
} from "@/types/capex";

export type CatalogOp =
  | {
      op: "upsertSimple";
      resource: SimpleCatalogKey;
      item: CatalogItem;
    }
  | {
      op: "deleteSimple";
      resource: SimpleCatalogKey;
      id: string;
    }
  | {
      op: "upsertVendorNodeName";
      item: VendorNodeNameCatalogItem;
    }
  | {
      op: "deleteVendorNodeName";
      id: string;
    }
  | {
      op: "upsertPackage";
      item: PackageCatalogItem;
    }
  | {
      op: "deletePackage";
      id: string;
    }
  | {
      op: "setRel";
      relKey: keyof CatalogRelationships;
      sourceId: string;
      targetIds: string[];
    };

const SIMPLE_KEYS: SimpleCatalogKey[] = [
  "projectNames",
  "deliveries",
  "domains",
  "nodes",
  "vendors",
];

const MAX_OPS_BEFORE_FULL_PUT = 200;

function sameSimple(a: CatalogItem, b: CatalogItem) {
  return a.id === b.id && a.name === b.name;
}

function sameVnn(a: VendorNodeNameCatalogItem, b: VendorNodeNameCatalogItem) {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.nodeId === b.nodeId &&
    a.vendorId === b.vendorId
  );
}

function samePkg(a: PackageCatalogItem, b: PackageCatalogItem) {
  if (
    a.id !== b.id ||
    a.name !== b.name ||
    a.licensePackage !== b.licensePackage ||
    a.unit !== b.unit ||
    a.unitPrice !== b.unitPrice
  ) {
    return false;
  }
  const aa = [...(a.vendorNodeNameIds ?? [])].sort();
  const bb = [...(b.vendorNodeNameIds ?? [])].sort();
  if (aa.length !== bb.length) return false;
  return aa.every((id, i) => id === bb[i]);
}

function sameIdList(a: string[] | undefined, b: string[] | undefined) {
  const aa = [...(a ?? [])].sort();
  const bb = [...(b ?? [])].sort();
  if (aa.length !== bb.length) return false;
  return aa.every((id, i) => id === bb[i]);
}

function diffSimpleList(
  resource: SimpleCatalogKey,
  prev: CatalogItem[],
  next: CatalogItem[],
  ops: CatalogOp[],
) {
  const prevMap = new Map(prev.map((item) => [item.id, item]));
  const nextMap = new Map(next.map((item) => [item.id, item]));

  for (const item of next) {
    const before = prevMap.get(item.id);
    if (!before || !sameSimple(before, item)) {
      ops.push({ op: "upsertSimple", resource, item });
    }
  }
  for (const item of prev) {
    if (!nextMap.has(item.id)) {
      ops.push({ op: "deleteSimple", resource, id: item.id });
    }
  }
}

function diffRelMap(
  relKey: keyof CatalogRelationships,
  prev: Record<string, string[]>,
  next: Record<string, string[]>,
  ops: CatalogOp[],
) {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const sourceId of keys) {
    const before = prev[sourceId] ?? [];
    const after = next[sourceId] ?? [];
    if (!sameIdList(before, after)) {
      ops.push({
        op: "setRel",
        relKey,
        sourceId,
        targetIds: after,
      });
    }
  }
}

/** Build incremental ops from previous synced settings → current settings. */
export function diffCatalogSettings(
  prev: AppSettings,
  next: AppSettings,
): CatalogOp[] {
  const ops: CatalogOp[] = [];

  for (const key of SIMPLE_KEYS) {
    diffSimpleList(key, prev.catalogs[key], next.catalogs[key], ops);
  }

  const prevVnn = new Map(
    prev.catalogs.vendorNodeNames.map((item) => [item.id, item]),
  );
  const nextVnn = new Map(
    next.catalogs.vendorNodeNames.map((item) => [item.id, item]),
  );
  for (const item of next.catalogs.vendorNodeNames) {
    const before = prevVnn.get(item.id);
    if (!before || !sameVnn(before, item)) {
      ops.push({ op: "upsertVendorNodeName", item });
    }
  }
  for (const item of prev.catalogs.vendorNodeNames) {
    if (!nextVnn.has(item.id)) {
      ops.push({ op: "deleteVendorNodeName", id: item.id });
    }
  }

  const prevPkg = new Map(prev.catalogs.packages.map((item) => [item.id, item]));
  const nextPkg = new Map(next.catalogs.packages.map((item) => [item.id, item]));
  for (const item of next.catalogs.packages) {
    const before = prevPkg.get(item.id);
    if (!before || !samePkg(before, item)) {
      ops.push({ op: "upsertPackage", item });
    }
  }
  for (const item of prev.catalogs.packages) {
    if (!nextPkg.has(item.id)) {
      ops.push({ op: "deletePackage", id: item.id });
    }
  }

  diffRelMap(
    "deliveryDomains",
    prev.relationships.deliveryDomains,
    next.relationships.deliveryDomains,
    ops,
  );
  diffRelMap(
    "domainNodes",
    prev.relationships.domainNodes,
    next.relationships.domainNodes,
    ops,
  );
  diffRelMap(
    "countryVendors",
    prev.relationships.countryVendors,
    next.relationships.countryVendors,
    ops,
  );

  return ops;
}

export function shouldUseFullCatalogPut(ops: CatalogOp[]) {
  return ops.length > MAX_OPS_BEFORE_FULL_PUT;
}

export function cloneAppSettings(settings: AppSettings): AppSettings {
  return structuredClone(settings) as AppSettings;
}

/** Empty catalogs for first-diff baseline when needed. */
export function emptyAppSettings(): AppSettings {
  const catalogs: AppCatalogs = {
    projectNames: [],
    deliveries: [],
    domains: [],
    nodes: [],
    vendors: [],
    vendorNodeNames: [],
    packages: [],
  };
  return {
    catalogs,
    relationships: {
      deliveryDomains: {},
      domainNodes: {},
      countryVendors: {},
    },
  };
}
