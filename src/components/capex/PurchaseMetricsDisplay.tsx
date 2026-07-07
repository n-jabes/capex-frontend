import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { ComputedPurchase } from "@/lib/calculations";

interface PurchaseMetricsDisplayProps {
  metrics: ComputedPurchase;
  className?: string;
}

export function PurchaseMetricsDisplay({
  metrics,
  className,
}: PurchaseMetricsDisplayProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Buying Qty
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatNumber(metrics.buyingQuantity)}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Total Price (new qty)
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrency(metrics.totalPrice)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Current Used %
          </p>
          <p className="text-2xl font-bold tabular-nums text-primary">
            {formatPercent(metrics.currentLicensePercent)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Used ÷ current license
          </p>
        </div>
        <div className="rounded-lg border-2 border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            After Expansion Used %
          </p>
          <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatPercent(metrics.afterExpansionPercent)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Same used qty ÷ new license
          </p>
        </div>
      </div>
    </div>
  );
}
