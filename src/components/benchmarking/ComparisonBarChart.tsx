"use client";

import type { BenchmarkComparison } from "@/lib/benchmarking";
import { formatMetricValue, numericValue, primaryMetrics } from "@/lib/benchmarking";

export function ComparisonBarChart({
  comparison,
}: {
  comparison: BenchmarkComparison;
}) {
  const metric = primaryMetrics(comparison.metrics)[0];
  if (!metric || comparison.columns.length === 0) return null;

  const values = comparison.columns.map((col) => ({
    id: col.id,
    label: col.label,
    value: numericValue(col, metric.key),
  }));
  const max = Math.max(
    0,
    ...values.map((v) => (v.value != null && v.value > 0 ? v.value : 0)),
  );

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div>
        <p className="text-sm font-medium">{metric.label}</p>
        <p className="text-xs text-muted-foreground">
          Visual compare of the primary price metric (same data as the table).
        </p>
      </div>
      <div className="space-y-2.5">
        {values.map((row) => {
          const pct =
            max > 0 && row.value != null && row.value > 0
              ? (row.value / max) * 100
              : 0;
          return (
            <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_88px] items-center gap-3">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-xs font-medium">{row.label}</p>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-[width]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <p className="text-right text-xs tabular-nums text-muted-foreground">
                {formatMetricValue(row.value, metric.format)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
