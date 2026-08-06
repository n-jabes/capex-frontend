import type { PackagePurchaseData, SummaryMetrics } from "@/types/capex";

export function normalizeMultiplier(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value) || value < 0) return 1;
  return value;
}

export function normalizePackagePurchaseData(
  data: PackagePurchaseData,
): PackagePurchaseData {
  return {
    ...data,
    multiplier: normalizeMultiplier(data.multiplier),
  };
}

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
  multiplier = 1,
): number {
  return expansionQty * unitPrice * normalizeMultiplier(multiplier);
}

export function calcDiscountAmount(
  subtotal: number,
  discountPercent: number,
): number {
  const pct = Math.min(100, Math.max(0, discountPercent || 0));
  return (subtotal * pct) / 100;
}

export function calcNetTotal(subtotal: number, discountPercent: number): number {
  return Math.max(0, subtotal - calcDiscountAmount(subtotal, discountPercent));
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
  const multiplier = normalizeMultiplier(data.multiplier);
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
    totalPrice: calcPackageTotalPrice(
      data.expansionQty,
      data.unitPrice,
      multiplier,
    ),
  };
}

export function applyDiscountToMetrics(
  metrics: SummaryMetrics,
  discountPercent: number,
): SummaryMetrics {
  const subtotal = metrics.totalCost;
  const discountAmount = calcDiscountAmount(subtotal, discountPercent);
  const netTotal = calcNetTotal(subtotal, discountPercent);
  return {
    ...metrics,
    subtotal,
    discountPercent,
    discountAmount,
    netTotal,
    totalCost: netTotal,
  };
}
