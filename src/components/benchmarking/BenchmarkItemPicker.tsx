"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BenchmarkCandidate } from "@/lib/benchmarking";

const SOFT_MAX = 8;

export function BenchmarkItemPicker({
  items,
  selectedIds,
  onChange,
}: {
  items: BenchmarkCandidate[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q),
    );
  }, [items, query]);

  const toggle = (id: string) => {
    if (selected.has(id)) {
      onChange(selectedIds.filter((x) => x !== id));
      return;
    }
    if (selectedIds.length >= SOFT_MAX) return;
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Select items to compare</p>
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} selected · min 2 · max {SOFT_MAX}
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="pl-9"
        />
      </div>
      <div className="rounded-md border">
        <div className="max-h-[280px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matching items in this workspace.
            </p>
          ) : (
            filtered.map((item) => {
              const isOn = selected.has(item.id);
              const disabled = !isOn && selectedIds.length >= SOFT_MAX;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    isOn ? "bg-primary/10" : "hover:bg-muted",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      isOn
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isOn ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
      {selectedIds.length > 0 ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
          >
            Clear selection
          </Button>
        </div>
      ) : null}
    </div>
  );
}
