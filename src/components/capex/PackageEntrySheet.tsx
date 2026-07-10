"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCapex } from "@/context/CapexContext";
import { getPackageCatalogItem } from "@/lib/catalog-utils";
import { computePackageMetrics } from "@/lib/calculations";
import {
  validatePackagePurchaseData,
  type PackageEntryField,
} from "@/lib/package-entry-validation";
import type { CapexTreeNode, PackagePurchaseData } from "@/types/capex";
import { PurchaseMetricsDisplay } from "@/components/capex/PurchaseMetricsDisplay";
import { cn } from "@/lib/utils";

function createDefaultForm(
  node: CapexTreeNode,
  catalogDefaults?: {
    licensePackage: string;
    unit: string;
    unitPrice: number;
  },
): PackagePurchaseData {
  if (node.packageData) return { ...node.packageData };
  return {
    licensePackage: catalogDefaults?.licensePackage ?? node.name,
    unit: catalogDefaults?.unit ?? "",
    expansionQty: 0,
    existingQty: 0,
    currentTraffic: 0,
    unitPrice: catalogDefaults?.unitPrice ?? 0,
  };
}

interface PackageEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageNode: CapexTreeNode;
}

export function PackageEntrySheet({
  open,
  onOpenChange,
  packageNode,
}: PackageEntrySheetProps) {
  const { settings, updatePackageData } = useCapex();
  const catalogItem = getPackageCatalogItem(settings, packageNode.catalogId);

  const [form, setForm] = useState<PackagePurchaseData>(() =>
    createDefaultForm(packageNode, catalogItem),
  );
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(createDefaultForm(packageNode, catalogItem));
    setShowErrors(false);
  }, [open, packageNode, catalogItem]);

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
    updatePackageData(packageNode.id, form);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Package CAPEX Entry</SheetTitle>
          <SheetDescription>
            Enter quantities and pricing for <strong>{packageNode.name}</strong>.
            Utilization metrics update live as you type.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
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
                className={cn(fieldError("licensePackage") && "border-destructive")}
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
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exp-qty" required>
                Exp. quantity
              </Label>
              <Input
                id="exp-qty"
                type="number"
                min={0}
                step="1"
                value={form.expansionQty}
                onChange={(event) =>
                  patch({ expansionQty: parseNumber(event.target.value) })
                }
                className={cn(fieldError("expansionQty") && "border-destructive")}
              />
              {fieldError("expansionQty") ? (
                <p className="text-xs text-destructive">
                  {fieldError("expansionQty")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="et-qty" required>
                Et. quantity
              </Label>
              <Input
                id="et-qty"
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
                className={cn(fieldError("currentTraffic") && "border-destructive")}
              />
              <p className="text-xs text-muted-foreground">
                Used portion of existing (Et.) quantity
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

        <SheetFooter className="px-4 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save CAPEX entry</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
