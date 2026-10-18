"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface CatalogTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
}

interface CatalogCrudTableProps<T extends { id: string }> {
  title: string;
  description: string;
  items: T[];
  columns: CatalogTableColumn<T>[];
  searchPlaceholder?: string;
  searchKeys?: Array<(item: T) => string | undefined>;
  emptyMessage?: string;
  addLabel: string;
  addDialogTitle: string;
  addDialogDescription: string;
  renderAddForm: (props: {
    onSubmit: () => void;
    onCancel: () => void;
    canSubmit: boolean;
  }) => React.ReactNode;
  renderEditForm?: (props: {
    item: T;
    onSubmit: () => void;
    onCancel: () => void;
    canSubmit: boolean;
  }) => React.ReactNode;
  onAdd: () => void;
  onDelete: (id: string) => void;
  canSubmitAdd: boolean;
  pageSize?: number;
  /** When true, hide add/edit/delete controls (viewer role). */
  readOnly?: boolean;
}

type SortDirection = "asc" | "desc";

export function CatalogCrudTable<T extends { id: string }>({
  title,
  description,
  items,
  columns,
  searchPlaceholder = "Search catalog...",
  searchKeys,
  emptyMessage = "No catalog entries yet.",
  addLabel,
  addDialogTitle,
  addDialogDescription,
  renderAddForm,
  renderEditForm,
  onAdd,
  onDelete,
  canSubmitAdd,
  pageSize = 10,
  readOnly = false,
}: CatalogCrudTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(
    columns.find((column) => column.sortable)?.key ?? null,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [deleteItem, setDeleteItem] = useState<T | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = items;
    if (q) {
      result = items.filter((item) => {
        const keys =
          searchKeys ??
          columns.map((column) => () => String(column.render(item) ?? ""));
        return keys.some((getValue) =>
          getValue(item)?.toLowerCase().includes(q),
        );
      });
    }
    if (sortKey) {
      const column = columns.find((entry) => entry.key === sortKey);
      if (column) {
        result = [...result].sort((a, b) => {
          const left = String(column.render(a) ?? "").toLowerCase();
          const right = String(column.render(b) ?? "").toLowerCase();
          if (left < right) return sortDirection === "asc" ? -1 : 1;
          if (left > right) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return result;
  }, [items, query, searchKeys, columns, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );

  useEffect(() => {
    setPage(0);
  }, [query, sortKey, sortDirection]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const toggleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <>
      <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {readOnly ? (
            <span className="text-xs text-muted-foreground">View only</span>
          ) : (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key, column.sortable)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {column.header}
                        {sortKey === column.key ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : null}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
                {readOnly ? null : (
                  <TableHead className="w-[88px] text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (readOnly ? 0 : 1)}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render(item)}
                      </TableCell>
                    ))}
                    {readOnly ? null : (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {renderEditForm ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditItem(item)}
                              aria-label="Edit entry"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteItem(item)}
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filtered.length > pageSize ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {safePage * pageSize + 1}–
              {Math.min((safePage + 1) * pageSize, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === 0}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
            {query ? ` matching "${query}"` : ""}
          </p>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden sm:max-w-md">
          <DialogHeader className="shrink-0">
            <DialogTitle>{addDialogTitle}</DialogTitle>
            <DialogDescription>{addDialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {renderAddForm({
              onSubmit: () => {
                onAdd();
                setAddOpen(false);
              },
              onCancel: () => setAddOpen(false),
              canSubmit: canSubmitAdd,
            })}
          </div>
        </DialogContent>
      </Dialog>

      {renderEditForm && editItem ? (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden sm:max-w-md">
            <DialogHeader className="shrink-0">
              <DialogTitle>Edit entry</DialogTitle>
              <DialogDescription>
                Update catalog details. Tree instances keep their snapshot name.
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {renderEditForm({
                item: editItem,
                onSubmit: () => setEditItem(null),
                onCancel: () => setEditItem(null),
                canSubmit: true,
              })}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete catalog entry?</DialogTitle>
            <DialogDescription>
              This removes the catalog entry from settings. Existing tree nodes
              are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteItem) onDelete(deleteItem.id);
                setDeleteItem(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CatalogNameField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function CatalogFormFooter({
  onCancel,
  onSubmit,
  submitLabel,
  canSubmit,
  className,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  canSubmit: boolean;
  className?: string;
}) {
  return (
    <DialogFooter className={cn("shrink-0 border-t bg-background pt-4", className)}>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSubmit} disabled={!canSubmit}>
        {submitLabel}
      </Button>
    </DialogFooter>
  );
}
