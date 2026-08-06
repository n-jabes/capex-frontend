"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { TrafficWarningHit } from "@/lib/traffic-warnings";
import { formatNumber } from "@/lib/format";

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
    <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle>Traffic exceeds existing licenses</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          {warnings.length} package{warnings.length === 1 ? "" : "s"} ha
          {warnings.length === 1 ? "s" : "ve"} C. traffic greater than Ex License
          Quantity. This warning stays until values are corrected.
        </p>
        {!compact ? (
          <ul className="space-y-1.5 text-xs">
            {warnings.slice(0, 6).map((hit) => (
              <li
                key={`${hit.vendorNodeId}-${hit.packageId}`}
                className="flex flex-wrap items-center gap-2"
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
                    className="h-6 border-amber-400 bg-white/70 px-2 text-[11px] text-amber-950 hover:bg-white"
                    onClick={() => onGoTo(hit.vendorNodeId)}
                  >
                    Open
                  </Button>
                ) : null}
              </li>
            ))}
            {warnings.length > 6 ? (
              <li className="text-muted-foreground">
                +{warnings.length - 6} more
              </li>
            ) : null}
          </ul>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
