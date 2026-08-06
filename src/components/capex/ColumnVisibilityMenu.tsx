"use client";

import { Columns3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface TableColumnDef {
  id: string;
  label: string;
  /** Always shown; cannot be toggled off */
  locked?: boolean;
}

function normalizeVisibleIds(
  stored: unknown,
  columns: TableColumnDef[],
): string[] {
  const defaults = columns.map((column) => column.id);
  const fromStore = Array.isArray(stored)
    ? stored.filter(
        (id): id is string =>
          typeof id === "string" && columns.some((column) => column.id === id),
      )
    : [];
  const next = new Set(fromStore.length ? fromStore : defaults);
  for (const column of columns) {
    if (column.locked) next.add(column.id);
  }
  return columns.map((column) => column.id).filter((id) => next.has(id));
}

export function useColumnVisibility(
  storageKey: string,
  columns: TableColumnDef[],
) {
  const defaultVisible = columns.map((column) => column.id);
  const [visible, setVisible] = useLocalStorage<string[]>(
    storageKey,
    defaultVisible,
  );

  const visibleIds = normalizeVisibleIds(visible, columns);
  const visibleSet = new Set(visibleIds);

  const isVisible = (id: string) => visibleSet.has(id);

  const setColumnVisible = (id: string, nextVisible: boolean) => {
    const column = columns.find((item) => item.id === id);
    if (!column || column.locked) return;

    setVisible((prev) => {
      const current = new Set(normalizeVisibleIds(prev, columns));
      if (nextVisible) {
        current.add(id);
      } else {
        if (current.size <= 1) return normalizeVisibleIds(prev, columns);
        current.delete(id);
      }
      for (const locked of columns.filter((c) => c.locked)) {
        current.add(locked.id);
      }
      return columns.map((c) => c.id).filter((colId) => current.has(colId));
    });
  };

  return { isVisible, setColumnVisible, columns };
}

interface ColumnVisibilityMenuProps {
  columns: TableColumnDef[];
  isVisible: (id: string) => boolean;
  onToggle?: (id: string) => void;
  onSetVisible?: (id: string, visible: boolean) => void;
}

export function ColumnVisibilityMenu({
  columns,
  isVisible,
  onToggle,
  onSetVisible,
}: ColumnVisibilityMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">
        <Columns3 className="h-3.5 w-3.5" />
        Columns
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={isVisible(column.id)}
            disabled={column.locked}
            onCheckedChange={(checked) => {
              if (typeof checked !== "boolean") return;
              if (onSetVisible) {
                onSetVisible(column.id, checked);
                return;
              }
              onToggle?.(column.id);
            }}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
