"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  computePackageMetrics,
  normalizeMultiplier,
} from "@/lib/calculations";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CapexTreeNode,
  LicensePackageInstance,
} from "@/types/capex";

export interface LicenseTableRow {
  instance: LicensePackageInstance;
  yearId: string;
  yearName: string;
  vnnName: string;
}

interface VendorNodeLicenseTableProps {
  vendorNodeName: CapexTreeNode;
}

export function VendorNodeLicenseTable({
  vendorNodeName,
}: VendorNodeLicenseTableProps) {
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<LicenseTableRow | null>(null);

  const years = vendorNodeName.licenseYears ?? [];

  const rows: LicenseTableRow[] = useMemo(() => {
    return years.flatMap((year) =>
      year.packages.map((instance) => ({
        instance,
        yearId: year.id,
        yearName: year.name,
        vnnName: vendorNodeName.name,
      })),
    );
  }, [years, vendorNodeName.name]);

  const filtered = useMemo(() => {
    let result = rows;
    if (yearFilter !== "all") {
      result = result.filter((row) => row.yearId === yearFilter);
    }
    if (selectedOnly) {
      result = result.filter((row) => selectedIds.includes(row.instance.id));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (row) =>
          row.instance.name.toLowerCase().includes(q) ||
          row.instance.packageData?.licensePackage.toLowerCase().includes(q) ||
          row.yearName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [rows, yearFilter, selectedOnly, selectedIds, query]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No license packages configured. Use &quot;Configure license
        packages&quot; on this vendor node name to add years and packages.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter rows..."
            className="pl-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Year</Label>
          <Select
            value={yearFilter}
            onValueChange={(value) => setYearFilter(value ?? "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
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
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border"
            checked={selectedOnly}
            onChange={(event) => setSelectedOnly(event.target.checked)}
          />
          Selected only ({selectedIds.length})
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 w-10 bg-card"> </TableHead>
              <TableHead className="sticky left-10 z-10 min-w-[120px] bg-card">
                Vendor Node Name
              </TableHead>
              <TableHead className="min-w-[120px]">Packages</TableHead>
              <TableHead className="min-w-[160px]">License Package | Unit</TableHead>
              <TableHead className="text-right">New License Qty</TableHead>
              <TableHead className="text-right">Ex License Qty</TableHead>
              <TableHead className="text-right">C. traffic</TableHead>
              <TableHead className="text-right">C. util</TableHead>
              <TableHead className="text-right">Exp. util</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Multiplier</TableHead>
              <TableHead className="text-right">Total Price</TableHead>
              <TableHead>Year</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const data = row.instance.packageData;
              const metrics = data ? computePackageMetrics(data) : null;
              const selected = selectedIds.includes(row.instance.id);
              const licenseUnit = data
                ? `${data.licensePackage} | ${data.unit || "—"}`
                : "—";

              return (
                <TableRow
                  key={`${row.yearId}-${row.instance.id}`}
                  className={cn(
                    "cursor-pointer",
                    selected && "bg-primary/5",
                  )}
                  onClick={() => setEditing(row)}
                >
                  <TableCell
                    className="sticky left-0 z-10 bg-card"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSelect(row.instance.id);
                    }}
                  >
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded border",
                        selected &&
                          "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {selected ? "✓" : null}
                    </span>
                  </TableCell>
                  <TableCell className="sticky left-10 z-10 bg-card font-medium">
                    {row.vnnName}
                  </TableCell>
                  <TableCell>{row.instance.name}</TableCell>
                  <TableCell>{licenseUnit}</TableCell>
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
                    <Badge variant="outline">{row.yearName}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
