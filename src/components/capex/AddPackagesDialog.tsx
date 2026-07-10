"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCapex, generateId } from "@/context/CapexContext";
import { getPackageVendorNodeNameIds } from "@/lib/catalog-utils";
import { getFilteredPresetsForChild } from "@/lib/relationship-utils";
import type { CapexTreeNode } from "@/types/capex";
import { findNodePath } from "@/lib/tree-utils";
import {
  PackageSelectionTable,
  type PackageSelectionRow,
} from "@/components/capex/PackageSelectionTable";

interface AddPackagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentNode: CapexTreeNode;
  onAdded: (children: CapexTreeNode[]) => void;
}

export function AddPackagesDialog({
  open,
  onOpenChange,
  parentNode,
  onAdded,
}: AddPackagesDialogProps) {
  const { settings, tree } = useCapex();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const parentPath = findNodePath(tree, parentNode.id) ?? [parentNode];
  const packagePresets = getFilteredPresetsForChild(
    settings,
    parentNode,
    parentPath,
    "package",
  );

  const catalogPackages = useMemo(() => {
    const vendorNodeNameId = parentNode.catalogId;
    const fromCatalog = vendorNodeNameId
      ? settings.catalogs.packages.filter(
          (item) =>
            getPackageVendorNodeNameIds(item).includes(vendorNodeNameId),
        )
      : settings.catalogs.packages;

    const presetIds = new Set(packagePresets.map((item) => item.id));
    const filtered =
      packagePresets.length > 0
        ? fromCatalog.filter((item) => presetIds.has(item.id))
        : fromCatalog;

    const existingCatalogIds = new Set(
      parentNode.children
        .map((child) => child.catalogId)
        .filter((id): id is string => !!id),
    );

    return filtered.map(
      (item): PackageSelectionRow => ({
        id: item.id,
        name: item.name,
        licensePackage: item.licensePackage,
        unit: item.unit,
        unitPrice: item.unitPrice,
        alreadyAdded: existingCatalogIds.has(item.id),
      }),
    );
  }, [settings.catalogs.packages, packagePresets, parentNode]);

  const reset = () => setSelectedIds([]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleAdd = () => {
    const selected = catalogPackages.filter((row) =>
      selectedIds.includes(row.id),
    );
    if (selected.length === 0) return;

    const children: CapexTreeNode[] = selected.map((row) =>
      createPackageNode(row),
    );
    onAdded(children);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Packages</DialogTitle>
          <DialogDescription>
            Choose one or more license packages under{" "}
            <strong>{parentNode.name}</strong>. You can enter CAPEX quantities
            after adding.
          </DialogDescription>
        </DialogHeader>

        <PackageSelectionTable
          rows={catalogPackages}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedIds.length === 0}>
            Add {selectedIds.length || ""} package
            {selectedIds.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function createPackageNode(row: PackageSelectionRow): CapexTreeNode {
  return {
    id: generateId(),
    type: "package",
    name: row.name,
    catalogId: row.id,
    children: [],
  };
}
