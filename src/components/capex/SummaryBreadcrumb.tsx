"use client";

import { ChevronRight } from "lucide-react";
import type { CapexTreeNode } from "@/types/capex";
import { nodeTypeLabel } from "@/lib/tree-utils";
import { cn } from "@/lib/utils";

interface SummaryBreadcrumbProps {
  path: CapexTreeNode[];
  className?: string;
}

export function SummaryBreadcrumb({ path, className }: SummaryBreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <nav
      aria-label="CAPEX path"
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {path.map((segment, index) => (
        <span key={segment.id} className="inline-flex items-center gap-1">
          {index > 0 ? (
            <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
          ) : null}
          <span className="rounded bg-muted px-1.5 py-0.5">
            <span className="font-medium text-foreground">{segment.name}</span>
            <span className="ml-1 opacity-70">
              ({nodeTypeLabel(segment.type)})
            </span>
          </span>
        </span>
      ))}
    </nav>
  );
}
