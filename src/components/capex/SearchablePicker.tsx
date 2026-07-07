"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface SearchablePickerItem {
  id: string;
  label: string;
  description?: string;
  badge?: string;
}

interface SearchablePickerProps {
  items: SearchablePickerItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function SearchablePicker({
  items,
  selectedId,
  onSelect,
  placeholder = "Type to search...",
  emptyMessage = "No matches found.",
  className,
}: SearchablePickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q),
    );
  }, [items, query]);

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

      <ScrollArea className="h-[220px] rounded-md border">
        <div className="p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                  selectedId === item.id && "bg-primary/10 ring-1 ring-primary/30",
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </span>
                {item.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {item.description}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {query && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {items.length} results
        </p>
      )}
    </div>
  );
}
