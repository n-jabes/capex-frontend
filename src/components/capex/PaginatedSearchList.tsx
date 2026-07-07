"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginatedSearchItem {
  id: string;
  label: string;
  description?: string;
  selected?: boolean;
}

interface PaginatedSearchListProps {
  items: PaginatedSearchItem[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  pageSize?: number;
  className?: string;
  listClassName?: string;
}

export function PaginatedSearchList({
  items,
  activeId,
  onSelect,
  placeholder = "Type to search...",
  emptyMessage = "No matches found.",
  pageSize = 8,
  className,
  listClassName,
}: PaginatedSearchListProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q),
    );
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );

  useEffect(() => {
    setPage(0);
  }, [query]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <div className={cn("max-h-[240px] overflow-y-auto p-1", listClassName)}>
          {pageItems.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            pageItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  activeId === item.id && "bg-primary/10 ring-1 ring-primary/30",
                  item.selected && activeId !== item.id && "bg-emerald-500/5",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    item.selected
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-muted-foreground/30",
                  )}
                >
                  {item.selected && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{item.label}</span>
                    {item.selected && (
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Selected
                      </span>
                    )}
                  </span>
                  {item.description && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>

        {filtered.length > pageSize && (
          <div className="flex items-center justify-between border-t px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {safePage + 1} of {totalPages}
              {query && ` · ${filtered.length} matches`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {!query && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} feature{filtered.length !== 1 ? "s" : ""} ·{" "}
          {items.filter((i) => i.selected).length} selected
        </p>
      )}
    </div>
  );
}
