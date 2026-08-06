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

export function useColumnVisibility(
  storageKey: string,
  columns: TableColumnDef[],
) {
  const defaultVisible = columns.map((column) => column.id);
  const [visible, setVisible] = useLocalStorage<string[]>(
    storageKey,
    defaultVisible,
  );

  const visibleSet = new Set(visible);
  for (const column of columns) {
    if (column.locked) visibleSet.add(column.id);
  }

  const isVisible = (id: string) => visibleSet.has(id);

  const toggle = (id: string) => {
    const column = columns.find((item) => item.id === id);
    if (!column || column.locked) return;

    setVisible((prev) => {
      const lockedIds = columns.filter((c) => c.locked).map((c) => c.id);
      const next = new Set(prev.length ? prev : defaultVisible);
      for (const lockedId of lockedIds) next.add(lockedId);

      if (next.has(id)) {
        if (next.size <= 1) return Array.from(next);
        next.delete(id);
      } else {
        next.add(id);
      }
      return columns.map((c) => c.id).filter((colId) => next.has(colId));
    });
  };

  return { isVisible, toggle, columns };
}

interface ColumnVisibilityMenuProps {
  columns: TableColumnDef[];
  isVisible: (id: string) => boolean;
  onToggle: (id: string) => void;
}

export function ColumnVisibilityMenu({
  columns,
  isVisible,
  onToggle,
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
            onCheckedChange={() => onToggle(column.id)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
