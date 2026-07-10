/** Standard telecom nodes — domain-specific filtering comes in Phase 3. */
export const DEFAULT_NODES = [
  // Packet Core
  "SGSN-MME",
  "SGW-C & PGW-C",
  "SGW-U & PGW-U",
  "SGW & PGW",
  "PCRF",
  "iDNS",
  "eDNS",
  "Internet DNS",
  // UDM
  "HLR-FE",
  "HLR-BE",
  "HSS-FE",
  "HSS-BE",
  "EIR-FE",
  "UDR",
] as const;
