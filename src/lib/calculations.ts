import type { PackagePurchaseData } from "@/types/capex";

export function calcCurrentUtilization(
  currentTraffic: number,
  existingQty: number,
): number {
  if (existingQty <= 0) return 0;
  return (currentTraffic / existingQty) * 100;
}

export function calcExpansionUtilization(
  currentTraffic: number,
  existingQty: number,
  expansionQty: number,
): number {
  const pool = existingQty + expansionQty;
  if (pool <= 0) return 0;
  return (currentTraffic / pool) * 100;
}

export function calcPackageTotalPrice(
  expansionQty: number,
  unitPrice: number,
): number {
  return expansionQty * unitPrice;
}

export interface ComputedPackageMetrics {
  expansionQty: number;
  currentUtilization: number;
  expansionUtilization: number;
  totalPrice: number;
}

export function computePackageMetrics(
  data: PackagePurchaseData,
): ComputedPackageMetrics {
  return {
    expansionQty: data.expansionQty,
    currentUtilization: calcCurrentUtilization(
      data.currentTraffic,
      data.existingQty,
    ),
    expansionUtilization: calcExpansionUtilization(
      data.currentTraffic,
      data.existingQty,
      data.expansionQty,
    ),
    totalPrice: calcPackageTotalPrice(data.expansionQty, data.unitPrice),
  };
}
