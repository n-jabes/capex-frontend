"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCapex } from "@/context/CapexContext";
import { getPackageCatalogItem } from "@/lib/catalog-utils";
import {
  computePackageMetrics,
  normalizeMultiplier,
} from "@/lib/calculations";
import {
  validatePackagePurchaseData,
  type PackageEntryField,
} from "@/lib/package-entry-validation";
import type {
  LicensePackageInstance,
  PackagePurchaseData,
} from "@/types/capex";
import { PurchaseMetricsDisplay } from "@/components/capex/PurchaseMetricsDisplay";
import { cn } from "@/lib/utils";

function createDefaultForm(
  instance: LicensePackageInstance,
  catalogDefaults?: {
    licensePackage: string;
    unit: string;
    unitPrice: number;
  },
): PackagePurchaseData {
  if (instance.packageData) {
    return {
      ...instance.packageData,
      multiplier: normalizeMultiplier(instance.packageData.multiplier),
    };
  }
  return {
    licensePackage: catalogDefaults?.licensePackage ?? instance.name,
    unit: catalogDefaults?.unit ?? "",
    expansionQty: 0,
    existingQty: 0,
    currentTraffic: 0,
    unitPrice: catalogDefaults?.unitPrice ?? 0,
    multiplier: 1,
  };
}

interface LicensePackageEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorNodeNameId: string;
  instance: LicensePackageInstance;
  yearName?: string;
}

export function LicensePackageEntryDialog({
  open,
  onOpenChange,
  vendorNodeNameId,
  instance,
  yearName,
}: LicensePackageEntryDialogProps) {
  const { settings, updateLicensePackageData } = useCapex();
  const catalogItem = getPackageCatalogItem(settings, instance.catalogId);

  const [form, setForm] = useState<PackagePurchaseData>(() =>
    createDefaultForm(instance, catalogItem),
  );
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(createDefaultForm(instance, catalogItem));
    setShowErrors(false);
  }, [open, instance, catalogItem]);

  const validation = useMemo(
    () => validatePackagePurchaseData(form),
    [form],
  );
  const metrics = useMemo(() => computePackageMetrics(form), [form]);

  const patch = (patchData: Partial<PackagePurchaseData>) => {
    setForm((prev) => ({ ...prev, ...patchData }));
  };

  const parseNumber = (value: string) => {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const fieldError = (field: PackageEntryField) =>
    showErrors ? validation.errors[field] : undefined;

  const handleSave = () => {
    setShowErrors(true);
    if (!validation.valid) return;
    updateLicensePackageData(vendorNodeNameId, instance.id, {
      ...form,
      multiplier: normalizeMultiplier(form.multiplier),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>License package CAPEX</DialogTitle>
          <DialogDescription>
            Enter quantities and pricing for <strong>{instance.name}</strong>
            {yearName ? (
              <>
                {" "}
                ({yearName})
              </>
            ) : null}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2 pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="license-package" required>
                License package
              </Label>
              <Input
                id="license-package"
                value={form.licensePackage}
                onChange={(event) =>
                  patch({ licensePackage: event.target.value })
                }
                className={cn(
                  fieldError("licensePackage") && "border-destructive",
                )}
              />
              {fieldError("licensePackage") ? (
                <p className="text-xs text-destructive">
                  {fieldError("licensePackage")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit" required>
                Unit
              </Label>
              <Input
                id="unit"
                value={form.unit}
                onChange={(event) => patch({ unit: event.target.value })}
                className={cn(fieldError("unit") && "border-destructive")}
              />
              {fieldError("unit") ? (
                <p className="text-xs text-destructive">{fieldError("unit")}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-price" required>
                Unit price
              </Label>
              <Input
                id="unit-price"
                type="number"
                min={0}
                step="0.01"
                value={form.unitPrice}
                onChange={(event) =>
                  patch({ unitPrice: parseNumber(event.target.value) })
                }
                className={cn(fieldError("unitPrice") && "border-destructive")}
              />
              {fieldError("unitPrice") ? (
                <p className="text-xs text-destructive">
                  {fieldError("unitPrice")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="multiplier" required>
                Multiplier
              </Label>
              <Input
                id="multiplier"
                type="number"
                min={0}
                step="1"
                value={form.multiplier}
                onChange={(event) =>
                  patch({
                    multiplier: Math.max(0, parseNumber(event.target.value)),
                  })
                }
                className={cn(fieldError("multiplier") && "border-destructive")}
              />
              <p className="text-xs text-muted-foreground">
                Scale factor for negotiated unit (e.g. 1000 for KSAU→SAU).
                Default 1; cannot be negative.
              </p>
              {fieldError("multiplier") ? (
                <p className="text-xs text-destructive">
                  {fieldError("multiplier")}
                </p>
              ) : null}
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-license-qty" required>
                New License Quantity
              </Label>
              <Input
                id="new-license-qty"
                type="number"
                min={0}
                step="1"
                value={form.expansionQty}
                onChange={(event) =>
                  patch({ expansionQty: parseNumber(event.target.value) })
                }
                className={cn(
                  fieldError("expansionQty") && "border-destructive",
                )}
              />
              {fieldError("expansionQty") ? (
                <p className="text-xs text-destructive">
                  {fieldError("expansionQty")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-license-qty" required>
                Ex License Quantity
              </Label>
              <Input
                id="ex-license-qty"
                type="number"
                min={0}
                step="1"
                value={form.existingQty}
                onChange={(event) =>
                  patch({ existingQty: parseNumber(event.target.value) })
                }
                className={cn(fieldError("existingQty") && "border-destructive")}
              />
              {fieldError("existingQty") ? (
                <p className="text-xs text-destructive">
                  {fieldError("existingQty")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-traffic" required>
                C. traffic
              </Label>
              <Input
                id="c-traffic"
                type="number"
                min={0}
                step="1"
                value={form.currentTraffic}
                onChange={(event) =>
                  patch({ currentTraffic: parseNumber(event.target.value) })
                }
                className={cn(
                  fieldError("currentTraffic") && "border-destructive",
                )}
              />
              <p className="text-xs text-muted-foreground">
                Used portion of existing (Ex License) quantity
              </p>
              {fieldError("currentTraffic") ? (
                <p className="text-xs text-destructive">
                  {fieldError("currentTraffic")}
                </p>
              ) : null}
            </div>
          </div>

          <PurchaseMetricsDisplay metrics={metrics} />
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
