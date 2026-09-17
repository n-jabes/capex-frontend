"use client";

import {
  ArrowUpDown,
  Copy,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComparisonMatrix } from "@/components/benchmarking/ComparisonMatrix";
import { ComparisonBarChart } from "@/components/benchmarking/ComparisonBarChart";
import type { BenchmarkComparison } from "@/lib/benchmarking";
import { cn } from "@/lib/utils";

type ComparisonResultsViewProps = {
  comparison: BenchmarkComparison;
  baselineId: string | null;
  onSetBaseline: (id: string) => void;
  showDeltas: boolean;
  onToggleDeltas: () => void;
  sortByPrice: boolean;
  onToggleSort: () => void;
  onCopy: () => void;
  onExport: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  className?: string;
};

export function ComparisonResultsView({
  comparison,
  baselineId,
  onSetBaseline,
  showDeltas,
  onToggleDeltas,
  sortByPrice,
  onToggleSort,
  onCopy,
  onExport,
  expanded,
  onToggleExpand,
  className,
}: ComparisonResultsViewProps) {
  return (
    <div className={cn("flex min-h-0 flex-col gap-4", className)}>
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium sm:text-base">
            {expanded ? "Price comparison" : "3. Compare prices"}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Green = lowest · Amber = highest for numeric rows. Deltas are vs
            baseline. Press Esc to exit full screen.
          </p>
        </div>
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="toolbar"
          aria-label="Comparison actions"
        >
          <Button
            type="button"
            variant={sortByPrice ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleSort}
            aria-pressed={sortByPrice}
          >
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Sort by price
          </Button>
          <Button
            type="button"
            variant={showDeltas ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleDeltas}
            aria-pressed={showDeltas}
          >
            Deltas
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCopy}>
            <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Copy
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            CSV
          </Button>
          <Button
            type="button"
            variant={expanded ? "secondary" : "default"}
            size="sm"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            aria-controls="benchmark-comparison-panel"
            title={
              expanded
                ? "Exit full screen (Esc)"
                : "Expand comparison to full screen"
            }
          >
            {expanded ? (
              <Minimize2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            ) : (
              <Maximize2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            )}
            {expanded ? "Exit full screen" : "Expand"}
          </Button>
        </div>
      </div>

      <div
        id="benchmark-comparison-panel"
        className="min-h-0 flex-1 space-y-4 overflow-auto"
      >
        <ComparisonMatrix
          comparison={comparison}
          baselineId={baselineId}
          onSetBaseline={onSetBaseline}
          showDeltas={showDeltas}
        />
        <ComparisonBarChart comparison={comparison} />
      </div>
    </div>
  );
}
