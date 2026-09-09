"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Layers,
  TrendingUp,
  Activity,
  ShoppingCart,
  Globe2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCapex } from "@/context/CapexContext";
import { computePortfolioStats } from "@/lib/portfolio-stats";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export default function DashboardPage() {
  const { tree, isHydrated } = useCapex();

  const stats = useMemo(() => computePortfolioStats(tree), [tree]);

  if (!isHydrated) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  const kpis = [
    {
      title: "Total CAPEX",
      value: formatCurrency(stats.totalCost),
      subtitle: "Sum of package total prices",
      icon: DollarSign,
    },
    {
      title: "New License Qty",
      value: formatNumber(stats.totalExpansionQty),
      subtitle: "Expansion qty across portfolio",
      icon: ShoppingCart,
    },
    {
      title: "Packages",
      value: `${stats.packagesWithData}/${stats.packageCount}`,
      subtitle: "With CAPEX data entered",
      icon: Layers,
    },
    {
      title: "Avg C. Utilization",
      value: formatPercent(stats.avgCurrentUtilization),
      subtitle: "Portfolio average",
      icon: Activity,
    },
    {
      title: "Avg Exp. Utilization",
      value: formatPercent(stats.avgPostExpansionUtilization),
      subtitle: "Post-expansion average",
      icon: TrendingUp,
    },
    {
      title: "Countries",
      value: String(stats.countryCount),
      subtitle: "Active markets",
      icon: Globe2,
    },
  ];

  const maxCountryCost = Math.max(
    ...stats.countries.map((country) => country.totalCost),
    1,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Portfolio-wide CAPEX visibility across countries, deliveries, and
          packages.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">CAPEX by country</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.countries.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Add countries in Settings to begin tracking CAPEX.
              </div>
            ) : stats.totalCost === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Enter package CAPEX data in the tree to populate this chart.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.countries.map((country) => (
                  <div key={country.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{country.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(country.totalCost)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(country.totalCost / maxCountryCost) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Country summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.countries.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No countries configured yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">New License Qty</TableHead>
                    <TableHead className="text-right">Total price</TableHead>
                    <TableHead className="text-right">Packages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.countries.map((country) => (
                    <TableRow key={country.id}>
                      <TableCell className="font-medium">
                        {country.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {country.packagesWithData > 0
                          ? formatNumber(country.expansionQuantity)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {country.packagesWithData > 0
                          ? formatCurrency(country.totalCost)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {country.packagesWithData}/{country.packageCount}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
