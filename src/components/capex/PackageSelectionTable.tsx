"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export interface PackageSelectionRow {
  id: string;
  name: string;
  licensePackage: string;
  unit: string;
  unitPrice: number;
  alreadyAdded?: boolean;
}

interface PackageSelectionTableProps {
  rows: PackageSelectionRow[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  pageSize?: number;
  emptyMessage?: string;
}

type SortKey = "name" | "licensePackage" | "unit" | "unitPrice";
type SortDirection = "asc" | "desc";

export function PackageSelectionTable({
  rows,
  selectedIds,
  onSelectionChange,
  pageSize = 8,
  emptyMessage = "No packages available for this vendor node name.",
}: PackageSelectionTableProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const selectableRows = rows.filter((row) => !row.alreadyAdded);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = rows;
    if (q) {
      result = rows.filter(
        (row) =>
          row.name.toLowerCase().includes(q) ||
          row.licensePackage.toLowerCase().includes(q) ||
          row.unit.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => {
      const left =
        sortKey === "unitPrice"
          ? a.unitPrice
          : String(a[sortKey]).toLowerCase();
      const right =
        sortKey === "unitPrice"
          ? b.unitPrice
          : String(b[sortKey]).toLowerCase();
      if (left < right) return sortDirection === "asc" ? -1 : 1;
      if (left > right) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, query, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );

  useEffect(() => {
    setPage(0);
  }, [query, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const toggleRow = (row: PackageSelectionRow) => {
    if (row.alreadyAdded) return;
    const next = selectedIds.includes(row.id)
      ? selectedIds.filter((id) => id !== row.id)
      : [...selectedIds, row.id];
    onSelectionChange(next);
  };

  const togglePage = () => {
    const pageIds = pageRows
      .filter((row) => !row.alreadyAdded)
      .map((row) => row.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)));
      return;
    }
    onSelectionChange([...new Set([...selectedIds, ...pageIds])]);
  };

  const SortHeader = ({
    label,
    column,
    className,
  }: {
    label: string;
    column: SortKey;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {sortKey === column ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : null}
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search packages..."
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} selected · {selectableRows.length} available
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <button
                  type="button"
                  onClick={togglePage}
                  className="inline-flex h-5 w-5 items-center justify-center rounded border"
                  aria-label="Toggle page selection"
                >
                  <Check className="h-3 w-3" />
                </button>
              </TableHead>
              <SortHeader label="Package" column="name" />
              <SortHeader label="License Package" column="licensePackage" />
              <SortHeader label="Unit" column="unit" />
              <SortHeader
                label="Unit Price"
                column="unitPrice"
                className="text-right"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const selected = selectedIds.includes(row.id);
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      row.alreadyAdded && "opacity-50",
                      !row.alreadyAdded && "cursor-pointer",
                    )}
                    onClick={() => toggleRow(row)}
                  >
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex h-5 w-5 items-center justify-center rounded border",
                          selected && "border-primary bg-primary text-primary-foreground",
                          row.alreadyAdded && "border-muted bg-muted",
                        )}
                      >
                        {selected ? <Check className="h-3 w-3" /> : null}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.name}
                      {row.alreadyAdded ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (in tree)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.licensePackage}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.unitPrice)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > pageSize ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {safePage + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
