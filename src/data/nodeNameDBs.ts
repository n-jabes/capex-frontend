import type { NodeNameDBCatalogItem } from "@/types/capex";

export const NODE_NAME_DBS: NodeNameDBCatalogItem[] = [
  { id: "sgsn-mme", name: "SGSN-MME", description: "Combined SGSN/MME node" },
  { id: "udm", name: "UDM", description: "Unified Data Management" },
  { id: "pcrf", name: "PCRF", description: "Policy and Charging Rules Function" },
  { id: "hss", name: "HSS", description: "Home Subscriber Server" },
  { id: "pgw", name: "PGW", description: "Packet Data Network Gateway" },
];
