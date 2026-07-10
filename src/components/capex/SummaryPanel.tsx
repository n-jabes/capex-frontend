"use client";

import { useMemo } from "react";
import {
  DollarSign,
  ShoppingCart,
  Activity,
  TrendingUp,
  Layers,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  collectPackageNodes,
  computeChildRollups,
  findNode,
  findNodePath,
  computeSummaryForNode,
  getChildTypeForParent,
  nodeTypeLabel,
} from "@/lib/tree-utils";
import { computePackageMetrics } from "@/lib/calculations";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { PurchaseMetricsDisplay } from "@/components/capex/PurchaseMetricsDisplay";
import { SummaryBreadcrumb } from "@/components/capex/SummaryBreadcrumb";

export function SummaryPanel() {
  const { tree, selectedNode, isHydrated } = useCapex();

  const summary = useMemo(() => {
    if (!selectedNode) return null;
    const node = findNode(tree, selectedNode.id);
    if (!node) return null;
    const path = findNodePath(tree, selectedNode.id) ?? [node];
    return {
      node,
      path,
      metrics: computeSummaryForNode(node),
      childRollups: computeChildRollups(node),
    };
  }, [tree, selectedNode]);

  const packageDetails = useMemo(() => {
    if (!summary || summary.node.type !== "package") return null;
    const node = summary.node;
    if (!node.packageData) return null;
    return {
      data: node.packageData,
      computed: computePackageMetrics(node.packageData),
    };
  }, [summary]);

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
          Click any node in the CAPEX tree to view rolled-up cost, utilization,
          and package details for that branch.
        </p>
      </div>
    );
  }

  const { node, path, metrics, childRollups } = summary;
  const pendingPackages = metrics.packageCount - metrics.packagesWithData;
  const hasPendingPackages = pendingPackages > 0;

  const childTypeLabel = getChildTypeForParent(node.type);

  const kpiCards = [
    {
      title: "Total Price",
      value: formatCurrency(metrics.totalCost),
      icon: DollarSign,
    },
    {
      title: "Exp. Quantity",
      value: formatNumber(metrics.expansionQuantity),
      icon: ShoppingCart,
    },
    {
      title: "Avg C. Utilization",
      value: formatPercent(metrics.avgCurrentUtilization),
      icon: Activity,
    },
    {
      title: "Avg Exp. Utilization",
      value: formatPercent(metrics.avgPostExpansionUtilization),
      icon: TrendingUp,
    },
    {
      title: "Packages",
      value: `${metrics.packagesWithData}/${metrics.packageCount}`,
      icon: Layers,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="space-y-3 border-b px-6 py-4">
        <SummaryBreadcrumb path={path} />
        <div>
          <Badge variant="outline" className="mb-2">
            {nodeTypeLabel(node.type)}
          </Badge>
          <h2 className="text-lg font-semibold">{node.name}</h2>
          <p className="text-xs text-muted-foreground">
            Roll-up for this {nodeTypeLabel(node.type).toLowerCase()} and all
            nested packages
          </p>
        </div>
      </div>

      {metrics.packageCount === 0 ? (
        <div className="p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No packages in scope</AlertTitle>
            <AlertDescription>
              Expand the tree beneath this node and add packages to see CAPEX
              roll-ups here.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {hasPendingPackages && node.type !== "package" ? (
        <div className="px-4 pt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>CAPEX data incomplete</AlertTitle>
            <AlertDescription>
              {pendingPackages} of {metrics.packageCount} package
              {metrics.packageCount === 1 ? "" : "s"} still need CAPEX entry.
              Click a package leaf in the tree to enter quantities.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {node.type === "package" && !node.packageData ? (
        <div className="p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No CAPEX data yet</AlertTitle>
            <AlertDescription>
              Click this package in the tree or use &quot;Enter CAPEX data&quot;
              from the row menu to add quantities and pricing.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
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

      {packageDetails ? (
        <div className="px-4 pb-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Package detail</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      License package
                    </TableCell>
                    <TableCell className="font-medium">
                      {packageDetails.data.licensePackage}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Unit</TableCell>
                    <TableCell className="font-medium">
                      {packageDetails.data.unit || "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Exp. quantity
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(packageDetails.data.expansionQty)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Et. quantity
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(packageDetails.data.existingQty)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      C. traffic
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(packageDetails.data.currentTraffic)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Unit price
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(packageDetails.data.unitPrice)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Total price
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(packageDetails.computed.totalPrice)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="mt-4">
                <PurchaseMetricsDisplay metrics={packageDetails.computed} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {childRollups.length > 0 && node.type !== "package" ? (
        <div className="px-4 pb-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">
                Roll-up by{" "}
                {childTypeLabel
                  ? nodeTypeLabel(childTypeLabel).toLowerCase()
                  : "child"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ChildRollupTable rows={childRollups} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {metrics.packageCount > 0 && node.type !== "package" ? (
        <div className="px-4 pb-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">All packages in scope</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PackageTable treeNodeId={node.id} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function ChildRollupTable({
  rows,
}: {
  rows: ReturnType<typeof computeChildRollups>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Exp. qty</TableHead>
          <TableHead className="text-right">Total price</TableHead>
          <TableHead className="text-right">Packages</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {nodeTypeLabel(row.type)}
            </TableCell>
            <TableCell className="text-right">
              {row.metrics.packagesWithData > 0
                ? formatNumber(row.metrics.expansionQuantity)
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              {row.metrics.packagesWithData > 0
                ? formatCurrency(row.metrics.totalCost)
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              {row.metrics.packagesWithData}/{row.metrics.packageCount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PackageTable({ treeNodeId }: { treeNodeId: string }) {
  const { tree } = useCapex();
  const node = findNode(tree, treeNodeId);
  if (!node) return null;

  const packages = collectPackageNodes(node).map((pkg) => {
    if (!pkg.packageData) {
      return {
        id: pkg.id,
        name: pkg.name,
        expansion: 0,
        total: 0,
        currentUtil: 0,
        expansionUtil: 0,
        hasData: false,
      };
    }
    const metrics = computePackageMetrics(pkg.packageData);
    return {
      id: pkg.id,
      name: pkg.name,
      expansion: metrics.expansionQty,
      total: metrics.totalPrice,
      currentUtil: metrics.currentUtilization,
      expansionUtil: metrics.expansionUtilization,
      hasData: true,
    };
  });

  if (packages.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        No packages in this branch.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Package</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Exp. qty</TableHead>
          <TableHead className="text-right">C. util</TableHead>
          <TableHead className="text-right">Exp. util</TableHead>
          <TableHead className="text-right">Total price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>
              <Badge variant={row.hasData ? "secondary" : "outline"}>
                {row.hasData ? "Complete" : "Pending"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {row.hasData ? formatNumber(row.expansion) : "—"}
            </TableCell>
            <TableCell className="text-right">
              {row.hasData ? formatPercent(row.currentUtil) : "—"}
            </TableCell>
            <TableCell className="text-right">
              {row.hasData ? formatPercent(row.expansionUtil) : "—"}
            </TableCell>
            <TableCell className="text-right">
              {row.hasData ? formatCurrency(row.total) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
