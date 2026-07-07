import type { FeatureCatalogItem } from "@/types/capex";

export const FEATURES: FeatureCatalogItem[] = [
  { id: "csf", name: "CSF", unit: "Subscribers", unitPrice: 2.5, nodeNameDBId: "sgsn-mme" },
  { id: "psf", name: "PSF", unit: "Subscribers", unitPrice: 3.0, nodeNameDBId: "sgsn-mme" },
  { id: "mme-cap", name: "MME Capacity", unit: "Subscribers", unitPrice: 1.8, nodeNameDBId: "sgsn-mme" },
  { id: "udm-sub", name: "UDM Subscribers", unit: "Subscribers", unitPrice: 2.2, nodeNameDBId: "udm" },
  { id: "udm-profiles", name: "UDM Profiles", unit: "Profiles", unitPrice: 0.5, nodeNameDBId: "udm" },
  { id: "pcrf-sessions", name: "PCRF Sessions", unit: "Sessions", unitPrice: 0.15, nodeNameDBId: "pcrf" },
  { id: "pcrf-rules", name: "PCRF Rules", unit: "Rules", unitPrice: 0.08, nodeNameDBId: "pcrf" },
  { id: "hss-subscribers", name: "HSS Subscribers", unit: "Subscribers", unitPrice: 1.5, nodeNameDBId: "hss" },
  { id: "pgw-throughput", name: "PGW Throughput", unit: "Gbps", unitPrice: 120, nodeNameDBId: "pgw" },
  { id: "pgw-sessions", name: "PGW Sessions", unit: "Sessions", unitPrice: 0.12, nodeNameDBId: "pgw" },
];
