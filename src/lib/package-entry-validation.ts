import type { PackagePurchaseData } from "@/types/capex";

export type PackageEntryField = keyof PackagePurchaseData;

export interface PackageEntryValidation {
  valid: boolean;
  errors: Partial<Record<PackageEntryField, string>>;
}

export function validatePackagePurchaseData(
  data: PackagePurchaseData,
): PackageEntryValidation {
  const errors: Partial<Record<PackageEntryField, string>> = {};

  if (!data.licensePackage.trim()) {
    errors.licensePackage = "License package is required.";
  }
  if (!data.unit.trim()) {
    errors.unit = "Unit is required.";
  }
  if (data.unitPrice < 0) {
    errors.unitPrice = "Unit price cannot be negative.";
  }
  if (data.expansionQty < 0) {
    errors.expansionQty = "New License Quantity cannot be negative.";
  }
  if (data.existingQty < 0) {
    errors.existingQty = "Ex License Quantity cannot be negative.";
  }
  if (data.currentTraffic < 0) {
    errors.currentTraffic = "C. traffic cannot be negative.";
  }
  if (data.multiplier < 0) {
    errors.multiplier = "Multiplier cannot be negative.";
  }
  if (data.existingQty > 0 && data.currentTraffic > data.existingQty) {
    errors.currentTraffic =
      "C. traffic cannot exceed Ex License Quantity.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
