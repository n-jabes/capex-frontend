"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { useCapex, generateId } from "@/context/CapexContext";
import { getPackageVendorNodeNameIds } from "@/lib/catalog-utils";
import { getFilteredPresetsForChild } from "@/lib/relationship-utils";
import type { CapexTreeNode, LicenseYear } from "@/types/capex";
import { findNodePath } from "@/lib/tree-utils";
import {
  PackageSelectionTable,
  type PackageSelectionRow,
} from "@/components/capex/PackageSelectionTable";
import { cn } from "@/lib/utils";

interface ConfigureLicensePackagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorNodeName: CapexTreeNode;
}

function yearLabel(index: number): string {
  const words = [
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
  ];
  return `Year ${words[index] ?? index + 1}`;
}

export function ConfigureLicensePackagesDialog({
  open,
  onOpenChange,
  vendorNodeName,
}: ConfigureLicensePackagesDialogProps) {
  const { settings, tree, updateVendorNodeLicenseYears } = useCapex();
  const [years, setYears] = useState<LicenseYear[]>([]);
  const [activeYearId, setActiveYearId] = useState("");

  useEffect(() => {
    if (!open) return;
    const existing = vendorNodeName.licenseYears ?? [];
    if (existing.length > 0) {
      setYears(existing.map((year) => ({ ...year, packages: [...year.packages] })));
      setActiveYearId(existing[0].id);
    } else {
      const first: LicenseYear = {
        id: `year-${generateId()}`,
        name: "Year One",
        packages: [],
      };
      setYears([first]);
      setActiveYearId(first.id);
    }
  }, [open, vendorNodeName]);

  const parentPath = findNodePath(tree, vendorNodeName.id) ?? [vendorNodeName];
  const packagePresets = getFilteredPresetsForChild(
    settings,
    vendorNodeName,
    parentPath,
    "package",
  );

  const catalogPackages = useMemo(() => {
    const vendorNodeNameId = vendorNodeName.catalogId;
    const fromCatalog = vendorNodeNameId
      ? settings.catalogs.packages.filter((item) =>
          getPackageVendorNodeNameIds(item).includes(vendorNodeNameId),
        )
      : settings.catalogs.packages;

    const presetIds = new Set(packagePresets.map((item) => item.id));
    const filtered =
      packagePresets.length > 0
        ? fromCatalog.filter((item) => presetIds.has(item.id))
        : fromCatalog;

    const activeYear = years.find((year) => year.id === activeYearId);
    const selectedCatalogIds = new Set(
      (activeYear?.packages ?? []).map((pkg) => pkg.catalogId),
    );

    return filtered.map(
      (item): PackageSelectionRow => ({
        id: item.id,
        name: item.name,
        licensePackage: item.licensePackage,
        unit: item.unit,
        unitPrice: item.unitPrice,
        alreadyAdded: false,
      }),
    );
  }, [
    settings.catalogs.packages,
    packagePresets,
    vendorNodeName.catalogId,
    years,
    activeYearId,
  ]);

  const activeYear = years.find((year) => year.id === activeYearId);
  const selectedIds = (activeYear?.packages ?? []).map((pkg) => pkg.catalogId);

  const handleSelectionChange = (ids: string[]) => {
    setYears((prev) =>
      prev.map((year) => {
        if (year.id !== activeYearId) return year;
        const existingByCatalog = new Map(
          year.packages.map((pkg) => [pkg.catalogId, pkg]),
        );
        const nextPackages = ids.map((catalogId) => {
          const existing = existingByCatalog.get(catalogId);
          if (existing) return existing;
          const catalog = settings.catalogs.packages.find(
            (item) => item.id === catalogId,
          );
          return {
            id: generateId(),
            catalogId,
            name: catalog?.name ?? catalogId,
          };
        });
        return { ...year, packages: nextPackages };
      }),
    );
  };

  const addYear = () => {
    const next: LicenseYear = {
      id: `year-${generateId()}`,
      name: yearLabel(years.length),
      packages: [],
    };
    setYears((prev) => [...prev, next]);
    setActiveYearId(next.id);
  };

  const removeYear = (yearId: string) => {
    setYears((prev) => {
      const next = prev.filter((year) => year.id !== yearId);
      if (next.length === 0) {
        const fallback: LicenseYear = {
          id: `year-${generateId()}`,
          name: "Year One",
          packages: [],
        };
        setActiveYearId(fallback.id);
        return [fallback];
      }
      if (activeYearId === yearId) setActiveYearId(next[0].id);
      return next;
    });
  };

  const renameYear = (yearId: string, name: string) => {
    setYears((prev) =>
      prev.map((year) => (year.id === yearId ? { ...year, name } : year)),
    );
  };

  const handleSave = () => {
    updateVendorNodeLicenseYears(vendorNodeName.id, years);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Configure license packages</DialogTitle>
          <DialogDescription>
            Add years and select which packages apply to{" "}
            <strong>{vendorNodeName.name}</strong> in each year.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden py-2">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {years.map((year) => (
              <button
                key={year.id}
                type="button"
                onClick={() => setActiveYearId(year.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  year.id === activeYearId
                    ? "border-primary bg-primary/10 font-medium"
                    : "hover:bg-muted",
                )}
              >
                {year.name}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({year.packages.length})
                </span>
              </button>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addYear}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add year
            </Button>
          </div>

          {activeYear ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              <div className="flex shrink-0 items-end gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="year-name">Year name</Label>
                  <Input
                    id="year-name"
                    value={activeYear.name}
                    onChange={(event) =>
                      renameYear(activeYear.id, event.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeYear(activeYear.id)}
                  aria-label="Remove year"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <PackageSelectionTable
                  rows={catalogPackages}
                  selectedIds={selectedIds}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
