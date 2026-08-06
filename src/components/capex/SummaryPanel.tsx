"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Percent,
  Layers,
  AlertCircle,
  BadgePercent,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  collectLicensePackages,
  computeChildRollups,
  computeVendorNodeMetricsForYear,
  displayVendorNodeName,
  findNode,
  findNodePath,
  computeSummaryForNode,
  getChildTypeForParent,
  nodeTypeLabel,
} from "@/lib/tree-utils";
import { computePackageMetrics } from "@/lib/calculations";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { SummaryBreadcrumb } from "@/components/capex/SummaryBreadcrumb";
import { VendorNodeLicenseTable } from "@/components/capex/VendorNodeLicenseTable";

export function SummaryPanel() {
  const { tree, selectedNode, isHydrated, updateVendorNodeDiscount } =
    useCapex();
  const [vnnYearFilter, setVnnYearFilter] = useState<string>("all");

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

  useEffect(() => {
    setVnnYearFilter("all");
  }, [selectedNode?.id]);

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
          Click any node in the CAPEX tree to view rolled-up cost and package
          details for that branch.
        </p>
      </div>
    );
  }

  const { node, path, metrics, childRollups } = summary;
  const isVnn = node.type === "vendorNodeName";
  const displayName =
    node.type === "vendor" ? displayVendorNodeName(node) : node.name;

  if (isVnn) {
    const yearMetrics = computeVendorNodeMetricsForYear(node, vnnYearFilter);
    const subtotal = yearMetrics.subtotal ?? yearMetrics.totalCost;
    const discountPercent =
      yearMetrics.discountPercent ?? node.discountPercent ?? 0;
    const discountAmount = yearMetrics.discountAmount ?? 0;
    const netTotal = yearMetrics.netTotal ?? yearMetrics.totalCost;

    return (
      <div className="flex h-full flex-col overflow-auto">
        <div className="space-y-3 border-b px-6 py-4">
          <SummaryBreadcrumb path={path} />
          <div>
            <Badge variant="outline" className="mb-2">
              {nodeTypeLabel(node.type)}
            </Badge>
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <p className="text-xs text-muted-foreground">
              Select packages for a year and enter CAPEX quantities. Stats follow
              the year filter (default: all years).
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Price
              </CardTitle>
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xl font-bold">{formatCurrency(subtotal)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Discount %
              </CardTitle>
              <Percent className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-3">
              <Label htmlFor="discount-pct" className="sr-only">
                Discount percent
              </Label>
              <Input
                id="discount-pct"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={discountPercent}
                onChange={(event) => {
                  const value = parseFloat(event.target.value);
                  updateVendorNodeDiscount(
                    node.id,
                    Number.isNaN(value) ? 0 : value,
                  );
                }}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Discount Amount
              </CardTitle>
              <BadgePercent className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xl font-bold">
                {formatCurrency(discountAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                After Discount
              </CardTitle>
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xl font-bold">{formatCurrency(netTotal)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="px-4 pb-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">License packages</CardTitle>
            </CardHeader>
            <CardContent>
              <VendorNodeLicenseTable
                vendorNodeName={node}
                yearFilter={vnnYearFilter}
                onYearFilterChange={setVnnYearFilter}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pendingPackages = metrics.packageCount - metrics.packagesWithData;
  const hasPendingPackages = pendingPackages > 0;
  const childTypeLabel = getChildTypeForParent(node.type);

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="space-y-3 border-b px-6 py-4">
        <SummaryBreadcrumb path={path} />
        <div>
          <Badge variant="outline" className="mb-2">
            {nodeTypeLabel(node.type)}
          </Badge>
          <h2 className="text-lg font-semibold">{displayName}</h2>
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
              Expand the tree and configure license packages on a vendor node
              name to see CAPEX roll-ups here.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {hasPendingPackages ? (
        <div className="px-4 pt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>CAPEX data incomplete</AlertTitle>
            <AlertDescription>
              {pendingPackages} of {metrics.packageCount} package
              {metrics.packageCount === 1 ? "" : "s"} still need CAPEX entry.
              Select a vendor node name and click a table row to enter
              quantities.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Price
            </CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-bold">
              {formatCurrency(metrics.totalCost)}
            </p>
          </CardContent>
        </Card>
      </div>

      {childRollups.length > 0 ? (
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

      {metrics.packageCount > 0 ? (
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
          <TableHead className="text-right">New License Qty</TableHead>
          <TableHead className="text-right">Total price</TableHead>
          <TableHead className="text-right">Packages</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
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

  const packages = collectLicensePackages(node).map((pkg) => {
    if (!pkg.packageData) {
      return {
        id: pkg.id,
        licensePackage: pkg.name,
        unit: "—",
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
      licensePackage: pkg.packageData.licensePackage || pkg.name,
      unit: pkg.packageData.unit || "—",
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
          <TableHead>License Package</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead className="text-right">New License Qty</TableHead>
          <TableHead className="text-right">C. util</TableHead>
          <TableHead className="text-right">Exp. util</TableHead>
          <TableHead className="text-right">Total price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.licensePackage}</TableCell>
            <TableCell>{row.unit}</TableCell>
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
