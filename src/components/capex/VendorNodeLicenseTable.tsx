"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LicensePackageEntryDialog } from "@/components/capex/LicensePackageEntryDialog";
import { useCapex, generateId } from "@/context/CapexContext";
import {
  computePackageMetrics,
  normalizeMultiplier,
} from "@/lib/calculations";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CapexTreeNode,
  LicensePackageInstance,
  LicenseYear,
} from "@/types/capex";

export interface LicenseTableRow {
  instance: LicensePackageInstance;
  yearId: string;
  yearName: string;
}

interface VendorNodeLicenseTableProps {
  vendorNodeName: CapexTreeNode;
}

export function VendorNodeLicenseTable({
  vendorNodeName,
}: VendorNodeLicenseTableProps) {
  const {
    updateVendorNodeLicenseYears,
    removeLicensePackage,
  } = useCapex();

  const years = vendorNodeName.licenseYears ?? [];
  const [activeYearId, setActiveYearId] = useState(years[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<LicenseTableRow | null>(null);
  const [newYearName, setNewYearName] = useState("");
  const [showAddYear, setShowAddYear] = useState(false);

  useEffect(() => {
    if (!years.length) {
      setActiveYearId("");
      return;
    }
    if (!years.some((year) => year.id === activeYearId)) {
      setActiveYearId(years[0].id);
    }
  }, [years, activeYearId]);

  const activeYear = years.find((year) => year.id === activeYearId);

  const rows: LicenseTableRow[] = useMemo(() => {
    if (!activeYear) return [];
    return activeYear.packages.map((instance) => ({
      instance,
      yearId: activeYear.id,
      yearName: activeYear.name,
    }));
  }, [activeYear]);

  const filtered = useMemo(() => {
    let result = rows;
    if (selectedOnly) {
      result = result.filter((row) => selectedIds.includes(row.instance.id));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((row) => {
        const license =
          row.instance.packageData?.licensePackage ?? row.instance.name;
        const unit = row.instance.packageData?.unit ?? "";
        return (
          license.toLowerCase().includes(q) ||
          unit.toLowerCase().includes(q) ||
          row.instance.name.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [rows, selectedOnly, selectedIds, query]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const persistYears = (next: LicenseYear[]) => {
    updateVendorNodeLicenseYears(vendorNodeName.id, next);
  };

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
    setActiveYearId(year.id);
    setNewYearName("");
    setShowAddYear(false);
  };

  const handleRemovePackage = (packageInstanceId: string) => {
    removeLicensePackage(vendorNodeName.id, packageInstanceId);
    setSelectedIds((prev) => prev.filter((id) => id !== packageInstanceId));
    if (editing?.instance.id === packageInstanceId) setEditing(null);
  };

  const selectedRowClass =
    "bg-emerald-50/80 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Showing year
          </p>
          <h4 className="text-base font-semibold">
            {activeYear?.name ?? "No year selected"}
          </h4>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Select
              value={activeYearId}
              onValueChange={(value) => setActiveYearId(value ?? "")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select year...">
                  {activeYear?.name ?? "Select year..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
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
            placeholder="Filter license packages..."
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border"
            checked={selectedOnly}
            onChange={(event) => setSelectedOnly(event.target.checked)}
          />
          Selected only ({selectedIds.length})
        </label>
      </div>

      {!activeYear ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Add a year (e.g. 2026) to start configuring license packages.
        </p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No packages for {activeYear.name}. Use &quot;Configure license
          packages&quot; on this vendor node name to select packages for this
          year.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"> </TableHead>
                <TableHead className="sticky left-0 z-10 min-w-[180px] bg-card">
                  License Package
                </TableHead>
                <TableHead className="min-w-[80px]">Unit</TableHead>
                <TableHead className="text-right">New License Qty</TableHead>
                <TableHead className="text-right">Ex License Qty</TableHead>
                <TableHead className="text-right">C. traffic</TableHead>
                <TableHead className="text-right">C. util</TableHead>
                <TableHead className="text-right">Exp. util</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Multiplier</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
                <TableHead className="w-12"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const data = row.instance.packageData;
                const metrics = data ? computePackageMetrics(data) : null;
                const selected = selectedIds.includes(row.instance.id);
                const licenseName =
                  data?.licensePackage?.trim() || row.instance.name;

                return (
                  <TableRow
                    key={row.instance.id}
                    className={cn(
                      "cursor-pointer",
                      selected && selectedRowClass,
                    )}
                    onClick={() => setEditing(row)}
                  >
                    <TableCell
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSelect(row.instance.id);
                      }}
                    >
                      <span
                        className={cn(
                          "inline-flex h-5 w-5 items-center justify-center rounded border",
                          selected &&
                            "border-emerald-600 bg-emerald-600 text-white",
                        )}
                      >
                        {selected ? "✓" : null}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "sticky left-0 z-10 font-medium",
                        selected ? "bg-emerald-50/80 dark:bg-emerald-950/30" : "bg-card",
                      )}
                    >
                      {licenseName}
                    </TableCell>
                    <TableCell>{data?.unit || "—"}</TableCell>
                    <TableCell className="text-right">
                      {data ? formatNumber(data.expansionQty) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {data ? formatNumber(data.existingQty) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {data ? formatNumber(data.currentTraffic) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
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
                      {data ? formatCurrency(data.unitPrice) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {data
                        ? formatNumber(normalizeMultiplier(data.multiplier))
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {metrics ? formatCurrency(metrics.totalPrice) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove package"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemovePackage(row.instance.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {editing ? (
        <LicensePackageEntryDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          vendorNodeNameId={vendorNodeName.id}
          instance={editing.instance}
          yearName={editing.yearName}
        />
      ) : null}
    </div>
  );
}
