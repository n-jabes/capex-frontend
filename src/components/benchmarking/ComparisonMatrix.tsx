"use client";

import { Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { BenchmarkComparison } from "@/lib/benchmarking";
import {
  deltaVsBaseline,
  formatMetricValue,
  minMaxForMetric,
} from "@/lib/benchmarking";

export function ComparisonMatrix({
  comparison,
  baselineId,
  onSetBaseline,
  showDeltas,
}: {
  comparison: BenchmarkComparison;
  baselineId: string | null;
  onSetBaseline: (id: string) => void;
  showDeltas: boolean;
}) {
  const baseline =
    comparison.columns.find((c) => c.id === baselineId) ??
    comparison.columns[0] ??
    null;

  if (comparison.columns.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Select at least two items to build a comparison.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-[160px] bg-background">
              Metric
            </TableHead>
            {comparison.columns.map((col) => {
              const isBaseline = baseline?.id === col.id;
              return (
                <TableHead key={col.id} className="min-w-[140px]">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-foreground">
                        {col.label}
                      </span>
                      {isBaseline ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Baseline
                        </Badge>
                      ) : (
                        <button
                          type="button"
                          className="text-[10px] text-muted-foreground underline-offset-2 hover:underline"
                          onClick={() => onSetBaseline(col.id)}
                        >
                          Set baseline
                        </button>
                      )}
                    </div>
                    {col.description ? (
                      <p className="text-[11px] font-normal text-muted-foreground">
                        {col.description}
                      </p>
                    ) : null}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparison.metrics.map((metric) => {
            const { min, max } = minMaxForMetric(
              comparison.columns,
              metric.key,
            );
            const canHighlight =
              metric.format === "currency" ||
              metric.format === "number" ||
              metric.format === "percent";

            return (
              <TableRow key={metric.key}>
                <TableCell className="sticky left-0 z-10 bg-background font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {metric.label}
                    <Tooltip>
                      <TooltipTrigger
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`About ${metric.label}`}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{metric.tooltip}</p>
                        <p className="mt-1 opacity-80">
                          Source:{" "}
                          {metric.source === "catalog"
                            ? "Catalog list price"
                            : metric.source === "tree"
                              ? "Rolled up from CAPEX Tree"
                              : "Derived from compare metrics"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    {metric.primary ? (
                      <Badge variant="outline" className="text-[10px]">
                        Price
                      </Badge>
                    ) : null}
                  </span>
                </TableCell>
                {comparison.columns.map((col) => {
                  const raw = col.values[metric.key];
                  const num = typeof raw === "number" ? raw : null;
                  const isMin =
                    canHighlight && num != null && min != null && num === min;
                  const isMax =
                    canHighlight &&
                    num != null &&
                    max != null &&
                    num === max &&
                    min !== max;
                  const delta =
                    showDeltas && baseline && col.id !== baseline.id
                      ? deltaVsBaseline(col, baseline, metric.key)
                      : null;

                  return (
                    <TableCell
                      key={`${col.id}-${metric.key}`}
                      className={cn(
                        "tabular-nums",
                        isMin && "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                        isMax && "bg-amber-500/10 text-amber-900 dark:text-amber-200",
                      )}
                    >
                      <div>
                        {formatMetricValue(raw, metric.format)}
                        {delta?.absolute != null &&
                        metric.format !== "text" ? (
                          <p className="text-[11px] text-muted-foreground">
                            {delta.absolute >= 0 ? "+" : ""}
                            {formatMetricValue(delta.absolute, metric.format)}
                            {delta.percent != null
                              ? ` (${delta.percent >= 0 ? "+" : ""}${delta.percent.toFixed(1)}%)`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
