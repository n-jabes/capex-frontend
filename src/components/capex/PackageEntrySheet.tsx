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
import {
  computePackageMetrics,
  normalizeMultiplier,
} from "@/lib/calculations";
import {
  validatePackagePurchaseData,
  isTrafficOverExisting,
  type PackageEntryField,
} from "@/lib/package-entry-validation";
import type { CapexTreeNode, PackagePurchaseData } from "@/types/capex";
import { PurchaseMetricsDisplay } from "@/components/capex/PurchaseMetricsDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function createDefaultForm(
  node: CapexTreeNode,
  catalogDefaults?: {
    licensePackage: string;
    unit: string;
    unitPrice: number;
  },
): PackagePurchaseData {
  if (node.packageData) {
    return {
      ...node.packageData,
      multiplier: normalizeMultiplier(node.packageData.multiplier),
    };
  }
  return {
    licensePackage: catalogDefaults?.licensePackage ?? node.name,
    unit: catalogDefaults?.unit ?? "",
    expansionQty: 0,
    existingQty: 0,
    currentTraffic: 0,
    unitPrice: catalogDefaults?.unitPrice ?? 0,
    multiplier: 1,
  };
}

interface PackageEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageNode: CapexTreeNode;
}

/** Legacy sheet for package tree leaves — prefer LicensePackageEntryDialog. */
export function PackageEntrySheet({
  open,
  onOpenChange,
  packageNode,
}: PackageEntrySheetProps) {
  const { settings, updatePackageData, canMutate } = useCapex();
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

  const trafficWarning = isTrafficOverExisting(form)
    ? validation.warnings.currentTraffic
    : undefined;

  const handleSave = () => {
    if (!canMutate) return;
    setShowErrors(true);
    if (!validation.valid) return;
    updatePackageData(packageNode.id, {
      ...form,
      multiplier: normalizeMultiplier(form.multiplier),
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Package CAPEX Entry</SheetTitle>
          <SheetDescription>
            Enter quantities and pricing for <strong>{packageNode.name}</strong>.
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
                className={cn(
                  fieldError("licensePackage") && "border-destructive",
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit" required>
                Unit
              </Label>
              <Input
                id="unit"
                value={form.unit}
                onChange={(event) => patch({ unit: event.target.value })}
              />
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
              />
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
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exp-qty" required>
                New License Quantity
              </Label>
              <Input
                id="exp-qty"
                type="number"
                min={0}
                value={form.expansionQty}
                onChange={(event) =>
                  patch({ expansionQty: parseNumber(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="et-qty" required>
                Ex License Quantity
              </Label>
              <Input
                id="et-qty"
                type="number"
                min={0}
                value={form.existingQty}
                onChange={(event) =>
                  patch({ existingQty: parseNumber(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-traffic" required>
                C. traffic
              </Label>
              <Input
                id="c-traffic"
                type="number"
                min={0}
                value={form.currentTraffic}
                onChange={(event) =>
                  patch({ currentTraffic: parseNumber(event.target.value) })
                }
                className={cn(
                  fieldError("currentTraffic") && "border-destructive",
                  trafficWarning &&
                    !fieldError("currentTraffic") &&
                    "border-amber-500",
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

          {trafficWarning ? (
            <Alert className="relative overflow-hidden border-2 border-amber-500 bg-amber-100 text-amber-950 shadow-md ring-2 ring-amber-400/60 dark:border-amber-500 dark:bg-amber-950/70 dark:text-amber-50">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-amber-500" />
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-base font-semibold">
                Traffic capacity warning
              </AlertTitle>
              <AlertDescription className="text-sm font-medium">
                {trafficWarning}
              </AlertDescription>
            </Alert>
          ) : null}

          <PurchaseMetricsDisplay metrics={metrics} />
        </div>

        <SheetFooter className="px-4 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {canMutate ? "Cancel" : "Close"}
          </Button>
          {canMutate ? (
            <Button onClick={handleSave}>Save CAPEX entry</Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
