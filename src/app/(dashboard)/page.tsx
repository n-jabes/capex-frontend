"use client";

import {
  DollarSign,
  Layers,
  Activity,
  Globe,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PlaceholderChart } from "@/components/dashboard/PlaceholderChart";
import { useCapex } from "@/context/CapexContext";
import { computeSummaryForNode } from "@/lib/tree-utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useMemo } from "react";

export default function DashboardPage() {
  const { tree, settings, isHydrated } = useCapex();

  const stats = useMemo(() => {
    let totalCapex = 0;
    let totalFeatures = 0;
    let utilSum = 0;
    let utilCount = 0;
    const countries = new Set<string>();

    for (const country of tree) {
      countries.add(country.name);
      const m = computeSummaryForNode(country, settings.features);
      totalCapex += m.totalCost;
      totalFeatures += m.featureCount;
      if (m.featureCount > 0) {
        utilSum += m.avgCurrentUtilization;
        utilCount++;
      }
    }

    return {
      totalCapex,
      totalFeatures,
      avgUtilization: utilCount > 0 ? utilSum / utilCount : 0,
      countryCount: countries.size,
    };
  }, [tree, settings.features]);

  if (!isHydrated) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Overview of CAPEX spending and license utilization across your telecom portfolio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total CAPEX"
          value={formatCurrency(stats.totalCapex)}
          subtitle="Across all countries"
          icon={DollarSign}
        />
        <KpiCard
          title="Total Features"
          value={String(stats.totalFeatures)}
          subtitle="Licensed feature entries"
          icon={Layers}
        />
        <KpiCard
          title="Average Utilization"
          value={formatPercent(stats.avgUtilization)}
          subtitle="License capacity consumed (not unused)"
          icon={Activity}
        />
        <KpiCard
          title="Countries"
          value={String(stats.countryCount)}
          subtitle="Active markets"
          icon={Globe}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlaceholderChart
          title="CAPEX by Delivery"
          description="Distribution of spending across Software, Hardware, and Services"
        />
        <PlaceholderChart
          title="Utilization Trend"
          description="License consumption before and after expansion"
        />
      </div>
    </div>
  );
}
