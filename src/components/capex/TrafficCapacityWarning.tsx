"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/format";
import type { TrafficWarningHit } from "@/lib/traffic-warnings";
import type { SiteRedundancyWarningHit } from "@/lib/site-redundancy";
import { SITE_REDUNDANCY_THRESHOLD } from "@/lib/site-redundancy";

const warningShellClass =
  "border-2 border-amber-500 bg-amber-100 text-amber-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/60 dark:border-amber-500 dark:bg-amber-950/70 dark:text-amber-50 dark:ring-amber-500/40";

interface TrafficCapacityWarningProps {
  warnings: TrafficWarningHit[];
  onGoTo?: (vendorNodeId: string) => void;
  compact?: boolean;
}

/** Non-dismissible amber warning for traffic exceeding Ex License Quantity. */
export function TrafficCapacityWarning({
  warnings,
  onGoTo,
  compact = false,
}: TrafficCapacityWarningProps) {
  if (warnings.length === 0) return null;

  return (
    <Alert className={cn(warningShellClass, "relative overflow-hidden")}>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-amber-500" />
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
      <AlertTitle className="text-base font-semibold tracking-tight">
        Traffic exceeds existing licenses
      </AlertTitle>
      <AlertDescription className="text-sm text-amber-950/90 dark:text-amber-50/90">
        <p className="mb-2 font-medium">
          {warnings.length} package{warnings.length === 1 ? "" : "s"} ha
          {warnings.length === 1 ? "s" : "ve"} C. traffic greater than Ex License
          Quantity. This warning cannot be dismissed until values are corrected.
        </p>
        {!compact ? (
          <ul className="space-y-2 text-sm">
            {warnings.slice(0, 6).map((hit) => (
              <li
                key={`${hit.vendorNodeId}-${hit.packageId}`}
                className="flex flex-wrap items-center gap-2 rounded-md bg-amber-50/80 px-2 py-1.5 dark:bg-amber-900/40"
              >
                <span>
                  <strong>{hit.packageName}</strong> ({hit.vendorNodeName}
                  {hit.yearName ? ` · ${hit.yearName}` : ""}) — traffic{" "}
                  {formatNumber(hit.currentTraffic)} vs Ex{" "}
                  {formatNumber(hit.existingQty)}
                </span>
                {onGoTo ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 border-amber-600 bg-white px-2.5 text-xs font-semibold text-amber-950 hover:bg-amber-50"
                    onClick={() => onGoTo(hit.vendorNodeId)}
                  >
                    Open
                  </Button>
                ) : null}
              </li>
            ))}
            {warnings.length > 6 ? (
              <li className="text-amber-900/70 dark:text-amber-100/70">
                +{warnings.length - 6} more
              </li>
            ) : null}
          </ul>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

interface SiteRedundancyWarningProps {
  warnings: SiteRedundancyWarningHit[];
  onGoTo?: (nodeId: string) => void;
  compact?: boolean;
}

/** Non-dismissible warning when site util sums exceed N+1 threshold (80%). */
export function SiteRedundancyWarning({
  warnings,
  onGoTo,
  compact = false,
}: SiteRedundancyWarningProps) {
  if (warnings.length === 0) return null;

  return (
    <Alert className={cn(warningShellClass, "relative overflow-hidden")}>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-amber-500" />
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
      <AlertTitle className="text-base font-semibold tracking-tight">
        Site redundancy at risk (N+1)
      </AlertTitle>
      <AlertDescription className="text-sm text-amber-950/90 dark:text-amber-50/90">
        <p className="mb-2 font-medium">
          Combined site utilization is above {SITE_REDUNDANCY_THRESHOLD}%. If
          one site fails, the remaining site(s) may not carry the full traffic
          safely. This warning stays until site loads are rebalanced.
        </p>
        {!compact ? (
          <ul className="space-y-2 text-sm">
            {warnings.slice(0, 4).map((hit) => (
              <li
                key={hit.nodeId}
                className="rounded-md bg-amber-50/80 px-2 py-1.5 dark:bg-amber-900/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    <strong>{hit.nodeName}</strong> — {hit.siteCount} sites ·
                    C. util sum {formatPercent(hit.sumCurrentUtil)} · Exp. util
                    sum {formatPercent(hit.sumExpansionUtil)}
                  </span>
                  {onGoTo ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 border-amber-600 bg-white px-2.5 text-xs font-semibold text-amber-950 hover:bg-amber-50"
                      onClick={() => onGoTo(hit.nodeId)}
                    >
                      Open node
                    </Button>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
                  {hit.sites
                    .map(
                      (site) =>
                        `${site.name}: C ${formatPercent(site.currentUtil)} / Exp ${formatPercent(site.expansionUtil)}`,
                    )
                    .join(" · ")}
                </p>
              </li>
            ))}
            {warnings.length > 4 ? (
              <li className="text-amber-900/70 dark:text-amber-100/70">
                +{warnings.length - 4} more nodes
              </li>
            ) : null}
          </ul>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
