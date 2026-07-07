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
import { PaginatedSearchList } from "@/components/capex/PaginatedSearchList";
import { PurchaseMetricsDisplay } from "@/components/capex/PurchaseMetricsDisplay";
import { useCapex } from "@/context/CapexContext";
import type { FeaturePurchaseData } from "@/types/capex";
import { computePurchaseMetrics } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import { findNode } from "@/lib/tree-utils";

interface FeatureEntryRow {
  featureId: string;
  name: string;
  unit: string;
  unitPrice: number;
  currentLicenseQty: string;
  newLicenseQty: string;
  trafficQty: string;
  vendor: string;
  selected: boolean;
}

interface FeatureEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeNameDBTreeNodeId: string;
  nodeNameDBId: string;
  nodeNameDBName: string;
}

function createRow(
  feature: { id: string; name: string; unit: string; unitPrice: number },
  existing?: FeaturePurchaseData,
): FeatureEntryRow {
  return {
    featureId: feature.id,
    name: feature.name,
    unit: feature.unit,
    unitPrice: feature.unitPrice,
    currentLicenseQty: existing ? String(existing.currentLicenseQty) : "",
    newLicenseQty: existing ? String(existing.newLicenseQty) : "",
    trafficQty: existing ? String(existing.trafficQty) : "",
    vendor: existing?.vendor ?? "",
    selected: !!existing,
  };
}

function isRowComplete(row: FeatureEntryRow): boolean {
  return (
    !!row.currentLicenseQty &&
    !!row.newLicenseQty &&
    !!row.vendor.trim()
  );
}

export function FeatureEntrySheet({
  open,
  onOpenChange,
  nodeNameDBTreeNodeId,
  nodeNameDBId,
  nodeNameDBName,
}: FeatureEntrySheetProps) {
  const { settings, addFeaturePurchases, tree } = useCapex();
  const [entries, setEntries] = useState<Record<string, FeatureEntryRow>>({});
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);

  const catalogFeatures = useMemo(
    () => settings.features.filter((f) => f.nodeNameDBId === nodeNameDBId),
    [settings.features, nodeNameDBId],
  );

  useEffect(() => {
    if (!open) return;

    const dbNode = findNode(tree, nodeNameDBTreeNodeId);
    const existingChildren = dbNode?.children ?? [];
    const initial: Record<string, FeatureEntryRow> = {};

    for (const f of catalogFeatures) {
      const existingFeature = existingChildren.find((c) => c.featureId === f.id);
      if (existingFeature?.purchase) {
        initial[f.id] = createRow(f, existingFeature.purchase);
      }
    }

    setEntries(initial);
    setActiveFeatureId(null);
  }, [open, catalogFeatures, tree, nodeNameDBTreeNodeId]);

  const activeRow = activeFeatureId ? entries[activeFeatureId] : null;
  const formDialogOpen = activeFeatureId !== null;

  const handleSelectFeature = (featureId: string) => {
    setEntries((prev) => {
      if (prev[featureId]) return prev;
      const feature = catalogFeatures.find((f) => f.id === featureId);
      if (!feature) return prev;
      return { ...prev, [featureId]: createRow(feature) };
    });
    setActiveFeatureId(featureId);
  };

  const updateActive = (patch: Partial<FeatureEntryRow>) => {
    if (!activeFeatureId) return;
    setEntries((prev) => {
      const feature = catalogFeatures.find((f) => f.id === activeFeatureId);
      if (!feature) return prev;
      const current = prev[activeFeatureId] ?? createRow(feature);
      return {
        ...prev,
        [activeFeatureId]: { ...current, ...patch, selected: false },
      };
    });
  };

  const handleDoneWithFeature = () => {
    if (!activeFeatureId) return;
    const row = entries[activeFeatureId];
    if (!row || !isRowComplete(row)) return;

    setEntries((prev) => ({
      ...prev,
      [activeFeatureId]: { ...row, selected: true },
    }));
    setActiveFeatureId(null);
  };

  const handleFormDialogChange = (isOpen: boolean) => {
    if (!isOpen) setActiveFeatureId(null);
  };

  const handleSubmit = () => {
    const purchases: Array<{ featureId: string; purchase: FeaturePurchaseData }> =
      [];

    for (const row of Object.values(entries)) {
      if (!row.selected || !isRowComplete(row)) continue;

      purchases.push({
        featureId: row.featureId,
        purchase: {
          currentLicenseQty: parseFloat(row.currentLicenseQty) || 0,
          newLicenseQty: parseFloat(row.newLicenseQty) || 0,
          trafficQty: parseFloat(row.trafficQty) || 0,
          vendor: row.vendor.trim(),
        },
      });
    }

    addFeaturePurchases(nodeNameDBTreeNodeId, nodeNameDBTreeNodeId, purchases);
    onOpenChange(false);
  };

  const activeMetrics =
    activeRow && activeRow.currentLicenseQty && activeRow.newLicenseQty
      ? computePurchaseMetrics(
          {
            currentLicenseQty: parseFloat(activeRow.currentLicenseQty) || 0,
            newLicenseQty: parseFloat(activeRow.newLicenseQty) || 0,
            trafficQty: parseFloat(activeRow.trafficQty) || 0,
            vendor: activeRow.vendor,
          },
          activeRow.unitPrice,
        )
      : null;

  const selectedCount = Object.values(entries).filter((e) => e.selected).length;
  const canMarkDone = activeRow ? isRowComplete(activeRow) : false;

  const listItems = catalogFeatures.map((f) => ({
    id: f.id,
    label: f.name,
    description: `${f.unit} · ${formatCurrency(f.unitPrice)}`,
    selected: entries[f.id]?.selected ?? false,
  }));

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex h-full w-full flex-col overflow-hidden sm:max-w-xl">
          <SheetHeader className="shrink-0">
            <SheetTitle>Feature Entry — {nodeNameDBName}</SheetTitle>
            <SheetDescription>
              Search and select features from the catalog. License data opens in
              a separate dialog for each feature.
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 px-1 py-1">
            <div className="flex min-h-0 flex-1 flex-col space-y-2">
              <Label>Search features</Label>
              <PaginatedSearchList
                items={listItems}
                activeId={activeFeatureId}
                onSelect={handleSelectFeature}
                placeholder="Search features by name..."
                emptyMessage="No features match your search."
                pageSize={10}
                listClassName="min-h-[420px] max-h-[480px]"
              />
            </div>

            {selectedCount > 0 ? (
              <p className="shrink-0 text-center text-sm text-muted-foreground">
                {selectedCount} feature{selectedCount !== 1 ? "s" : ""} selected.
                Click another feature to add more, or save when finished.
              </p>
            ) : (
              <p className="shrink-0 text-center text-sm text-muted-foreground">
                Select a feature from the list to enter license data.
              </p>
            )}
          </div>

          <SheetFooter className="shrink-0 border-t pt-4">
            <p className="mr-auto text-xs text-muted-foreground">
              {selectedCount > 0
                ? `${selectedCount} feature(s) ready to save`
                : "Mark features as done before saving"}
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={selectedCount === 0}>
              Save Feature Entries
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={formDialogOpen} onOpenChange={handleFormDialogChange}>
        <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          {activeRow && (
            <>
              <DialogHeader className="shrink-0 border-b px-6 py-4">
                <DialogTitle>{activeRow.name}</DialogTitle>
                <DialogDescription>
                  Unit: {activeRow.unit} · Unit price:{" "}
                  {formatCurrency(activeRow.unitPrice)}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Current License Qty</Label>
                    <Input
                      type="number"
                      min={0}
                      value={activeRow.currentLicenseQty}
                      onChange={(e) =>
                        updateActive({ currentLicenseQty: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">New License Qty</Label>
                    <Input
                      type="number"
                      min={0}
                      value={activeRow.newLicenseQty}
                      onChange={(e) =>
                        updateActive({ newLicenseQty: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Traffic Qty (unused)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={activeRow.trafficQty}
                      onChange={(e) =>
                        updateActive({ trafficQty: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vendor</Label>
                    <Input
                      value={activeRow.vendor}
                      onChange={(e) => updateActive({ vendor: e.target.value })}
                      placeholder="e.g. Ericsson"
                    />
                  </div>
                </div>

                {activeMetrics && (
                  <>
                    <Separator className="my-4" />
                    <PurchaseMetricsDisplay metrics={activeMetrics} />
                  </>
                )}
              </div>

              <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
                <Button variant="outline" onClick={() => setActiveFeatureId(null)}>
                  Cancel
                </Button>
                <Button onClick={handleDoneWithFeature} disabled={!canMarkDone}>
                  Done — add to selection
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
