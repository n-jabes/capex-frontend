"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LicensePackageEntryDialog } from "@/components/capex/LicensePackageEntryDialog";
import { ResizableTableHead } from "@/components/capex/ResizableTableHead";
import { useColumnWidths } from "@/hooks/useColumnWidths";
import { useCapex, generateId } from "@/context/CapexContext";
import { getPackageVendorNodeNameIds } from "@/lib/catalog-utils";
import {
  computePackageMetrics,
  normalizeMultiplier,
} from "@/lib/calculations";
import { formatCurrency, formatNumber, formatPercent, currentUtilHotClass } from "@/lib/format";
import { isTrafficOverExisting } from "@/lib/package-entry-validation";
import {
  getSitePackageUtilHotSets,
  packageCatalogHotKey,
} from "@/lib/site-redundancy";
import { findNodePath } from "@/lib/tree-utils";
import { cn } from "@/lib/utils";
import type {
  CapexTreeNode,
  LicensePackageInstance,
  LicenseYear,
  PackageCatalogItem,
} from "@/types/capex";

const VNN_WIDTHS = {
  select: 44,
  licensePackage: 200,
  unit: 90,
  expansionQty: 130,
  existingQty: 120,
  currentTraffic: 100,
  currentUtil: 90,
  expansionUtil: 90,
  unitPrice: 110,
  multiplier: 100,
  totalPrice: 120,
};

interface VendorNodeLicenseTableProps {
  vendorNodeName: CapexTreeNode;
  /** "all" for stats-only aggregate; table editing requires a concrete year */
  yearFilter: string;
  onYearFilterChange: (yearId: string) => void;
}

export function VendorNodeLicenseTable({
  vendorNodeName,
  yearFilter,
  onYearFilterChange,
}: VendorNodeLicenseTableProps) {
  const { tree, settings, updateVendorNodeLicenseYears } = useCapex();
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [editing, setEditing] = useState<LicensePackageInstance | null>(null);
  const [newYearName, setNewYearName] = useState("");
  const [showAddYear, setShowAddYear] = useState(false);
  const { widths, setWidth, totalWidth } = useColumnWidths(
    "capex-width-vnn-packages",
    VNN_WIDTHS,
  );

  const hotCatalogKeys = useMemo(() => {
    const path = findNodePath(tree, vendorNodeName.id) ?? [];
    const site = [...path].reverse().find((node) => node.type === "vendor");
    if (!site) return new Set<string>();
    return getSitePackageUtilHotSets(site).catalogKeys;
  }, [tree, vendorNodeName.id]);

  const years = vendorNodeName.licenseYears ?? [];
  const isAllYears = yearFilter === "all";
  const activeYear = years.find((year) => year.id === yearFilter);

  useEffect(() => {
    if (isAllYears) return;
    if (!years.length) return;
    if (!years.some((year) => year.id === yearFilter)) {
      onYearFilterChange(years[0].id);
    }
  }, [years, yearFilter, isAllYears, onYearFilterChange]);

  const catalogPackages = useMemo(() => {
    const vendorNodeNameId = vendorNodeName.catalogId;
    const packages = settings.catalogs.packages;
    if (!vendorNodeNameId) return packages;
    const mapped = packages.filter((item) =>
      getPackageVendorNodeNameIds(item).includes(vendorNodeNameId),
    );
    return mapped.length ? mapped : packages;
  }, [settings.catalogs.packages, vendorNodeName.catalogId]);

  const selectedByCatalogId = useMemo(() => {
    const map = new Map<string, LicensePackageInstance>();
    if (!activeYear) return map;
    for (const pkg of activeYear.packages) {
      map.set(pkg.catalogId, pkg);
    }
    return map;
  }, [activeYear]);

  const filteredCatalog = useMemo(() => {
    let result = catalogPackages;
    if (selectedOnly && !isAllYears) {
      result = result.filter((item) => selectedByCatalogId.has(item.id));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.licensePackage.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q),
      );
    }
    return result;
  }, [catalogPackages, selectedOnly, selectedByCatalogId, query, isAllYears]);

  const persistYears = (next: LicenseYear[]) => {
    updateVendorNodeLicenseYears(vendorNodeName.id, next);
  };

  const ensureYears = (list: LicenseYear[]) => list;

  const handleAddYear = () => {
    const name = newYearName.trim();
    if (!name) return;
    if (years.some((year) => year.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    const year: LicenseYear = {
      id: `year-${generateId()}`,
      name,
      packages: [],
    };
    persistYears([...years, year]);
    onYearFilterChange(year.id);
    setNewYearName("");
    setShowAddYear(false);
  };

  const toggleCatalogPackage = (catalog: PackageCatalogItem) => {
    if (isAllYears || !activeYear) return;

    const exists = selectedByCatalogId.get(catalog.id);
    if (exists) {
      persistYears(
        years.map((year) =>
          year.id === activeYear.id
            ? {
                ...year,
                packages: year.packages.filter(
                  (pkg) => pkg.catalogId !== catalog.id,
                ),
              }
            : year,
        ),
      );
      if (editing?.catalogId === catalog.id) setEditing(null);
      return;
    }

    const instance: LicensePackageInstance = {
      id: generateId(),
      catalogId: catalog.id,
      name: catalog.name,
      packageData: {
        licensePackage: catalog.licensePackage,
        unit: catalog.unit,
        expansionQty: 0,
        existingQty: 0,
        currentTraffic: 0,
        unitPrice: catalog.unitPrice,
        multiplier: 1,
      },
    };

    persistYears(
      ensureYears(
        years.map((year) =>
          year.id === activeYear.id
            ? { ...year, packages: [...year.packages, instance] }
            : year,
        ),
      ),
    );
    setEditing(instance);
  };

  const openEditor = (catalog: PackageCatalogItem) => {
    if (isAllYears || !activeYear) return;
    const existing = selectedByCatalogId.get(catalog.id);
    if (existing) {
      setEditing(existing);
      return;
    }
    toggleCatalogPackage(catalog);
  };

  const selectedRowClass =
    "bg-emerald-50/80 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40";

  const selectedCount = activeYear?.packages.length ?? 0;
  const yearLabel = isAllYears
    ? "All years"
    : (activeYear?.name ?? "Select a year");

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Year scope
          </p>
          <h4 className="text-base font-semibold">{yearLabel}</h4>
          <p className="text-xs text-muted-foreground">
            {isAllYears
              ? "Stats include all years. Pick a year below to select and edit packages."
              : "Selections and CAPEX values apply only to this year."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Select
              value={yearFilter}
              onValueChange={(value) => onYearFilterChange(value ?? "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year...">
                  {yearLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showAddYear ? (
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="new-year-name">
                  New year
                </Label>
                <Input
                  id="new-year-name"
                  value={newYearName}
                  onChange={(event) => setNewYearName(event.target.value)}
                  placeholder="e.g. 2026"
                  className="w-[120px]"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAddYear();
                  }}
                />
              </div>
              <Button type="button" size="sm" onClick={handleAddYear}>
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddYear(false);
                  setNewYearName("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAddYear(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add year
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search packages..."
            className="pl-9"
          />
        </div>
        {!isAllYears ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border"
              checked={selectedOnly}
              onChange={(event) => setSelectedOnly(event.target.checked)}
            />
            Selected only ({selectedCount})
          </label>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {isAllYears
            ? `${catalogPackages.length} packages available`
            : `${selectedCount} selected · ${catalogPackages.length} available`}
        </p>
      </div>

      {years.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Add a year (e.g. 2026) to start selecting license packages.
        </p>
      ) : (
        <>
          {isAllYears ? (
            <p className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Stats show all years. Pick a specific year above to select packages
              and enter CAPEX values for that year.
            </p>
          ) : null}
          <div className="overflow-x-auto rounded-md border">
            <Table
              className="table-fixed"
              style={{ width: totalWidth, minWidth: totalWidth }}
            >
              <TableHeader>
                <TableRow>
                  <ResizableTableHead
                    columnId="select"
                    width={widths.select}
                    onWidthChange={setWidth}
                    minWidth={40}
                  >
                    {" "}
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="licensePackage"
                    width={widths.licensePackage}
                    onWidthChange={setWidth}
                    minWidth={140}
                    className="sticky left-0 z-10 bg-card"
                  >
                    License Package
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="unit"
                    width={widths.unit}
                    onWidthChange={setWidth}
                    minWidth={60}
                  >
                    Unit
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="expansionQty"
                    width={widths.expansionQty}
                    onWidthChange={setWidth}
                    align="right"
                    minWidth={90}
                  >
                    New License Qty
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="existingQty"
                    width={widths.existingQty}
                    onWidthChange={setWidth}
                    align="right"
                    minWidth={90}
                  >
                    Ex License Qty
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="currentTraffic"
                    width={widths.currentTraffic}
                    onWidthChange={setWidth}
                    align="right"
                    minWidth={80}
                  >
                    C. traffic
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="currentUtil"
                    width={widths.currentUtil}
                    onWidthChange={setWidth}
                    align="right"
                    minWidth={70}
                  >
                    C. util
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="expansionUtil"
                    width={widths.expansionUtil}
                    onWidthChange={setWidth}
                    align="right"
                    minWidth={70}
                  >
                    Exp. util
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="unitPrice"
                    width={widths.unitPrice}
                    onWidthChange={setWidth}
                    align="right"
                    minWidth={80}
                  >
                    Unit Price
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="multiplier"
                    width={widths.multiplier}
                    onWidthChange={setWidth}
                    align="right"
                    minWidth={70}
                  >
                    Multiplier
                  </ResizableTableHead>
                  <ResizableTableHead
                    columnId="totalPrice"
                    width={widths.totalPrice}
                    onWidthChange={setWidth}
                    align="right"
                    minWidth={90}
                  >
                    Total Price
                  </ResizableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCatalog.map((catalog) => {
                  const instance = selectedByCatalogId.get(catalog.id);
                  const selected = !!instance;
                  const data = instance?.packageData;
                  const metrics = data ? computePackageMetrics(data) : null;
                  const licenseName =
                    data?.licensePackage?.trim() || catalog.licensePackage;
                  const canEdit = !isAllYears && !!activeYear;
                  const trafficWarn = data
                    ? isTrafficOverExisting(data)
                    : false;
                  const utilHot =
                    selected &&
                    hotCatalogKeys.has(
                      packageCatalogHotKey(catalog.id, catalog.name),
                    );

                  return (
                    <TableRow
                      key={catalog.id}
                      className={cn(
                        canEdit && "cursor-pointer",
                        !canEdit && "opacity-80",
                        selected && selectedRowClass,
                        trafficWarn &&
                          "bg-amber-50/90 dark:bg-amber-950/25 hover:bg-amber-50 dark:hover:bg-amber-950/35",
                      )}
                      onClick={() => {
                        if (canEdit) openEditor(catalog);
                      }}
                    >
                      <TableCell
                        onClick={(event) => {
                          event.stopPropagation();
                          if (canEdit) toggleCatalogPackage(catalog);
                        }}
                      >
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded border",
                            selected &&
                              "border-emerald-600 bg-emerald-600 text-white",
                            !canEdit && "opacity-50",
                          )}
                        >
                          {selected ? "✓" : null}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "sticky left-0 z-10 font-medium",
                          trafficWarn
                            ? "bg-amber-50/90 dark:bg-amber-950/25"
                            : selected
                              ? "bg-emerald-50/80 dark:bg-emerald-950/30"
                              : "bg-card",
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {trafficWarn ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                          ) : null}
                          {licenseName}
                        </span>
                      </TableCell>
                      <TableCell>
                        {data?.unit || catalog.unit || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {data ? formatNumber(data.expansionQty) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {data ? formatNumber(data.existingQty) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {data ? formatNumber(data.currentTraffic) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right",
                          currentUtilHotClass(utilHot),
                        )}
                      >
                        {metrics
                          ? formatPercent(metrics.currentUtilization)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {metrics
                          ? formatPercent(metrics.expansionUtilization)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {data
                          ? formatCurrency(data.unitPrice)
                          : formatCurrency(catalog.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {data
                          ? formatNumber(normalizeMultiplier(data.multiplier))
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {metrics ? formatCurrency(metrics.totalPrice) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {editing && activeYear ? (
        <LicensePackageEntryDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          vendorNodeNameId={vendorNodeName.id}
          instance={editing}
          yearName={activeYear.name}
        />
      ) : null}
    </div>
  );
}
