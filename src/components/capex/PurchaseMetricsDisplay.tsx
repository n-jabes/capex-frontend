import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  expansionUtilToneClass,
} from "@/lib/format";
import type { ComputedPackageMetrics } from "@/lib/calculations";

interface PurchaseMetricsDisplayProps {
  metrics: ComputedPackageMetrics;
  className?: string;
}

export function PurchaseMetricsDisplay({
  metrics,
  className,
}: PurchaseMetricsDisplayProps) {
  const expTone = expansionUtilToneClass(
    metrics.expansionUtilization,
    metrics.currentUtilization,
  );
  const expImproved =
    metrics.expansionUtilization < metrics.currentUtilization;
  const expWorsened =
    metrics.expansionUtilization > metrics.currentUtilization;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            New License Qty
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatNumber(metrics.expansionQty)}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Total Price
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrency(metrics.totalPrice)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            C. Utilization
          </p>
          <p className="text-2xl font-bold tabular-nums text-primary">
            {formatPercent(metrics.currentUtilization)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            C. traffic ÷ existing qty
          </p>
        </div>
        <div
          className={cn(
            "rounded-lg border-2 px-3 py-3",
            expImproved && "border-emerald-500/20 bg-emerald-500/5",
            expWorsened && "border-red-500/20 bg-red-500/5",
            !expImproved && !expWorsened && "border-border bg-muted/30",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Exp. Utilization
          </p>
          <p className={cn("text-2xl font-bold tabular-nums", expTone || "text-foreground")}>
            {formatPercent(metrics.expansionUtilization)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            C. traffic ÷ expanded pool
          </p>
        </div>
      </div>
    </div>
  );
}
