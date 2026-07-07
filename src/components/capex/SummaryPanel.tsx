"use client";

import { useMemo } from "react";
import {
  DollarSign,
  ShoppingCart,
  Activity,
  TrendingUp,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCapex } from "@/context/CapexContext";
import { findNode, computeSummaryForNode, nodeTypeLabel } from "@/lib/tree-utils";
import { computePurchaseMetrics } from "@/lib/calculations";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { PurchaseMetricsDisplay } from "@/components/capex/PurchaseMetricsDisplay";

export function SummaryPanel() {
  const { tree, selectedNode, settings, isHydrated } = useCapex();

  const summary = useMemo(() => {
    if (!selectedNode) return null;
    const node = findNode(tree, selectedNode.id);
    if (!node) return null;
    return { node, metrics: computeSummaryForNode(node, settings.features) };
  }, [tree, selectedNode, settings.features]);

  const featureDetails = useMemo(() => {
    if (!summary || summary.node.type !== "feature") return null;
    const node = summary.node;
    if (!node.featureId || !node.purchase) return null;
    const catalog = settings.features.find((f) => f.id === node.featureId);
    if (!catalog) return null;
    const computed = computePurchaseMetrics(node.purchase, catalog.unitPrice);
    return { catalog, purchase: node.purchase, computed };
  }, [summary, settings.features]);

  if (!isHydrated) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading summary...
      </div>
    );
  }

  if (!selectedNode || !summary) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <Layers className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium">Select a tree node</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Click any node in the CAPEX tree to view cost and utilization summaries
          for that level and everything beneath it.
        </p>
      </div>
    );
  }

  const { node, metrics } = summary;

  const kpiCards = [
    {
      title: "Total Cost",
      value: formatCurrency(metrics.totalCost),
      icon: DollarSign,
    },
    {
      title: "Buying Quantity",
      value: formatNumber(metrics.buyingQuantity),
      icon: ShoppingCart,
    },
    {
      title: "Avg Current Used %",
      value: formatPercent(metrics.avgCurrentUtilization),
      icon: Activity,
    },
    {
      title: "Avg After Expansion Used %",
      value: formatPercent(metrics.avgPostExpansionUtilization),
      icon: TrendingUp,
    },
    {
      title: "Feature Count",
      value: String(metrics.featureCount),
      icon: Layers,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="border-b px-6 py-4">
        <Badge variant="outline" className="mb-2">
          {nodeTypeLabel(node.type)}
        </Badge>
        <h2 className="text-lg font-semibold">{node.name}</h2>
        <p className="text-xs text-muted-foreground">
          Summary for this {nodeTypeLabel(node.type).toLowerCase()} and all nested entries
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {featureDetails && (
        <div className="px-4 pb-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Feature Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Unit</TableCell>
                    <TableCell className="font-medium">
                      {featureDetails.catalog.unit}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Unit Price</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(featureDetails.catalog.unitPrice)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Vendor</TableCell>
                    <TableCell className="font-medium">
                      {featureDetails.purchase.vendor}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Current License</TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(featureDetails.purchase.currentLicenseQty)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">New License</TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(featureDetails.purchase.newLicenseQty)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Traffic Qty</TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(featureDetails.purchase.trafficQty)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Buying Qty</TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(featureDetails.computed.buyingQuantity)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Total Price (new qty)</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(featureDetails.computed.totalPrice)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="mt-4">
                <PurchaseMetricsDisplay metrics={featureDetails.computed} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {metrics.featureCount > 0 && node.type !== "feature" && (
        <div className="px-4 pb-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Features in scope</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FeatureTable treeNodeId={node.id} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function FeatureTable({ treeNodeId }: { treeNodeId: string }) {
  const { tree, settings } = useCapex();
  const node = findNode(tree, treeNodeId);
  if (!node) return null;

  const collectFeatures = (
    n: typeof node,
  ): Array<{ name: string; vendor: string; total: number; buying: number }> => {
    const results: Array<{
      name: string;
      vendor: string;
      total: number;
      buying: number;
    }> = [];
    if (n.type === "feature" && n.featureId && n.purchase) {
      const cat = settings.features.find((f) => f.id === n.featureId);
      if (cat) {
        const m = computePurchaseMetrics(n.purchase, cat.unitPrice);
        results.push({
          name: cat.name,
          vendor: n.purchase.vendor,
          total: m.totalPrice,
          buying: m.buyingQuantity,
        });
      }
    }
    for (const child of n.children) {
      results.push(...collectFeatures(child));
    }
    return results;
  };

  const rows = collectFeatures(node);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Feature</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead className="text-right">Buying Qty</TableHead>
          <TableHead className="text-right">Total Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-right">{formatNumber(row.buying)}</TableCell>
            <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
