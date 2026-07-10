import type { AppCatalogs, AppSettings } from "@/types/capex";

/** Stable seed IDs for default catalogs and Phase 3 relationship wiring. */
export const SEED_NODE_IDS = {
  sgsnMme: "node-sgsn-mme",
  sgwPgw: "node-sgw-pgw",
  pcrf: "node-pcrf",
} as const;

export const SEED_VENDOR_IDS = {
  ericsson: "vendor-ericsson",
  huawei: "vendor-huawei",
  nokia: "vendor-nokia",
} as const;

export const SEED_VENDOR_NODE_NAME_IDS = {
  pcc: "vnn-pcc",
  unc: "vnn-unc",
  udg: "vnn-udg",
  epg: "vnn-epg",
} as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function catalogFromNames(
  names: readonly string[],
  prefix: string,
): Array<{ id: string; name: string }> {
  return names.map((name) => ({
    id: `${prefix}-${slugify(name)}`,
    name,
  }));
}

export const DEFAULT_CATALOGS: AppCatalogs = {
  projectNames: catalogFromNames(["YAS CAPEX"], "proj"),
  deliveries: catalogFromNames(
    ["Software", "Hardware", "Professional Services"],
    "del",
  ),
  domains: catalogFromNames(
    [
      "CS",
      "Packet Core",
      "IMS",
      "Signaling",
      "UDM",
      "BSS",
      "Provisioning",
      "NMS",
    ],
    "dom",
  ),
  nodes: catalogFromNames(
    [
      "SGSN-MME",
      "SGW-C & PGW-C",
      "SGW-U & PGW-U",
      "SGW & PGW",
      "PCRF",
      "iDNS",
      "eDNS",
      "Internet DNS",
      "HLR-FE",
      "HLR-BE",
      "HSS-FE",
      "HSS-BE",
      "EIR-FE",
      "UDR",
    ],
    "node",
  ),
  vendors: [
    { id: SEED_VENDOR_IDS.ericsson, name: "Ericsson" },
    { id: SEED_VENDOR_IDS.huawei, name: "Huawei" },
    { id: SEED_VENDOR_IDS.nokia, name: "Nokia" },
  ],
  vendorNodeNames: [
    {
      id: SEED_VENDOR_NODE_NAME_IDS.pcc,
      nodeId: SEED_NODE_IDS.sgsnMme,
      vendorId: SEED_VENDOR_IDS.ericsson,
      name: "PCC",
    },
    {
      id: SEED_VENDOR_NODE_NAME_IDS.unc,
      nodeId: SEED_NODE_IDS.sgsnMme,
      vendorId: SEED_VENDOR_IDS.huawei,
      name: "UNC",
    },
    {
      id: SEED_VENDOR_NODE_NAME_IDS.udg,
      nodeId: SEED_NODE_IDS.sgwPgw,
      vendorId: SEED_VENDOR_IDS.ericsson,
      name: "UDG",
    },
    {
      id: SEED_VENDOR_NODE_NAME_IDS.epg,
      nodeId: SEED_NODE_IDS.pcrf,
      vendorId: SEED_VENDOR_IDS.nokia,
      name: "EPG",
    },
  ],
  packages: [
    {
      id: "pkg-basic-pcc",
      vendorNodeNameIds: [SEED_VENDOR_NODE_NAME_IDS.pcc],
      name: "Basic Package",
      licensePackage: "Basic Att KSAU",
      unit: "KSAU",
      unitPrice: 1,
    },
  ],
};

export const DEFAULT_RELATIONSHIPS: AppSettings["relationships"] = {
  deliveryDomains: {
    "del-software": ["dom-packet-core", "dom-udm", "dom-ims", "dom-signaling"],
    "del-hardware": ["dom-packet-core", "dom-bss"],
    "del-professional-services": ["dom-provisioning", "dom-nms"],
  },
  domainNodes: {
    "dom-packet-core": [
      "node-sgsn-mme",
      "node-sgw-c-pgw-c",
      "node-sgw-u-pgw-u",
      "node-sgw-pgw",
      "node-pcrf",
      "node-idns",
      "node-edns",
      "node-internet-dns",
    ],
    "dom-udm": [
      "node-hlr-fe",
      "node-hlr-be",
      "node-hss-fe",
      "node-hss-be",
      "node-eir-fe",
      "node-udr",
    ],
  },
  countryVendors: {
    "country-rwanda": [
      SEED_VENDOR_IDS.ericsson,
      SEED_VENDOR_IDS.huawei,
      SEED_VENDOR_IDS.nokia,
    ],
  },
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  catalogs: DEFAULT_CATALOGS,
  relationships: DEFAULT_RELATIONSHIPS,
};
