import type { FeatureCatalogItem, FeaturePurchaseData } from "@/types/capex";

export function calcBuyingQuantity(current: number, newQty: number): number {
  return newQty - current;
}

export function calcUsedQuantity(licenseQty: number, unusedQty: number): number {
  return Math.max(0, licenseQty - unusedQty);
}

export function calcCurrentLicensePercent(unused: number, current: number): number {
  if (current <= 0) return 0;
  const used = calcUsedQuantity(current, unused);
  return (used / current) * 100;
}

/** Used consumption stays the same after expansion; only the license pool grows. */
export function calcAfterExpansionPercent(
  unused: number,
  current: number,
  newQty: number,
): number {
  if (newQty <= 0) return 0;
  const used = calcUsedQuantity(current, unused);
  return (used / newQty) * 100;
}

export function calcTotalPrice(buyingQty: number, unitPrice: number): number {
  return buyingQty * unitPrice;
}

export interface ComputedPurchase {
  buyingQuantity: number;
  usedQuantity: number;
  usedQuantityAfterExpansion: number;
  currentLicensePercent: number;
  afterExpansionPercent: number;
  totalPrice: number;
}

export function computePurchaseMetrics(
  purchase: FeaturePurchaseData,
  unitPrice: number,
): ComputedPurchase {
  const buyingQuantity = calcBuyingQuantity(
    purchase.currentLicenseQty,
    purchase.newLicenseQty,
  );
  const usedQuantity = calcUsedQuantity(
    purchase.currentLicenseQty,
    purchase.trafficQty,
  );
  return {
    buyingQuantity,
    usedQuantity,
    usedQuantityAfterExpansion: usedQuantity,
    currentLicensePercent: calcCurrentLicensePercent(
      purchase.trafficQty,
      purchase.currentLicenseQty,
    ),
    afterExpansionPercent: calcAfterExpansionPercent(
      purchase.trafficQty,
      purchase.currentLicenseQty,
      purchase.newLicenseQty,
    ),
    totalPrice: calcTotalPrice(buyingQuantity, unitPrice),
  };
}

export function getFeatureById(
  features: FeatureCatalogItem[],
  featureId: string,
): FeatureCatalogItem | undefined {
  return features.find((f) => f.id === featureId);
}
