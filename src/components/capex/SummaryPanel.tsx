"use client";

import { useEffect, useMemo, useState } from "react";
import { DollarSign, Layers, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
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
  nodeTypeLabel,
  supportsNodeDiscount,
  toSelectedNode,
} from "@/lib/tree-utils";
import { computePackageMetrics } from "@/lib/calculations";
import { formatCurrency, formatPercent, currentUtilHotClass } from "@/lib/format";
import { collectTrafficWarnings } from "@/lib/traffic-warnings";
import {
  collectSiteRedundancyWarnings,
  collectPackageUtilHotInstanceIds,
} from "@/lib/site-redundancy";
import { SummaryBreadcrumb } from "@/components/capex/SummaryBreadcrumb";
import { VendorNodeLicenseTable } from "@/components/capex/VendorNodeLicenseTable";
import { DiscountStatCards } from "@/components/capex/DiscountStatCards";
import {
  TrafficCapacityWarning,
  SiteRedundancyWarning,
} from "@/components/capex/TrafficCapacityWarning";
import { ResizableTableHead } from "@/components/capex/ResizableTableHead";
import { useColumnWidths } from "@/hooks/useColumnWidths";

const ROLLUP_WIDTHS = {
  name: 220,
  totalPrice: 140,
  packages: 110,
};

const PACKAGE_WIDTHS = {
  vendorNodeName: 160,
  licensePackage: 200,
  unit: 100,
  currentUtil: 100,
  expansionUtil: 100,
  totalPrice: 130,
};

export function SummaryPanel() {
  const { tree, selectedNode, isHydrated, updateNodeDiscount, setSelectedNode } =
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
      trafficWarnings: collectTrafficWarnings(node),
      siteRedundancyWarnings:
        node.type === "vendor" || node.type === "vendorNodeName"
          ? []
          : collectSiteRedundancyWarnings(node),
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

  const { node, path, metrics, childRollups, trafficWarnings, siteRedundancyWarnings } =
    summary;
  const isVnn = node.type === "vendorNodeName";
  const displayName =
    node.type === "vendor" ? displayVendorNodeName(node) : node.name;
  const showDiscount = supportsNodeDiscount(node.type);

  const goToWarningNode = (id: string) => {
    const target = findNode(tree, id);
    if (target) setSelectedNode(toSelectedNode(target));
  };

  if (isVnn) {
    const yearMetrics = computeVendorNodeMetricsForYear(node, vnnYearFilter);
    const subtotal = yearMetrics.subtotal ?? yearMetrics.totalCost;
    const discountPercent =
      yearMetrics.discountPercent ?? node.discountPercent ?? 0;
    const discountAmount = yearMetrics.discountAmount ?? 0;
    const netTotal = yearMetrics.netTotal ?? yearMetrics.totalCost;

    return (
      <div className="flex h-full flex-col overflow-auto">
        <div className="space-y-2 border-b px-4 py-3">
          <SummaryBreadcrumb path={path} />
          <div>
            <Badge variant="outline" className="mb-1">
              {nodeTypeLabel(node.type)}
            </Badge>
            <h2 className="text-lg font-semibold leading-tight">{displayName}</h2>
            <p className="text-xs text-muted-foreground">
              Select packages for a year and enter CAPEX quantities. Stats follow
              the year filter (default: all years).
            </p>
          </div>
        </div>

        {trafficWarnings.length > 0 ? (
          <div className="px-4 pt-2">
            <TrafficCapacityWarning warnings={trafficWarnings} />
          </div>
        ) : null}

        <div className="px-4 py-2">
          <DiscountStatCards
            subtotal={subtotal}
            discountPercent={discountPercent}
            discountAmount={discountAmount}
            netTotal={netTotal}
            onDiscountChange={(value) => updateNodeDiscount(node.id, value)}
          />
        </div>

        <div className="px-4 pb-4">
          <Card className="shadow-sm">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-sm">License packages</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
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
  const subtotal = metrics.subtotal ?? metrics.totalCost;
  const discountPercent = metrics.discountPercent ?? node.discountPercent ?? 0;
  const discountAmount = metrics.discountAmount ?? 0;
  const netTotal = metrics.netTotal ?? metrics.totalCost;

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="space-y-2 border-b px-4 py-3">
        <SummaryBreadcrumb path={path} />
        <div>
          <Badge variant="outline" className="mb-1">
            {nodeTypeLabel(node.type)}
          </Badge>
          <h2 className="text-lg font-semibold leading-tight">{displayName}</h2>
          <p className="text-xs text-muted-foreground">
            Summary for this {nodeTypeLabel(node.type).toLowerCase()} and all
            nested packages
          </p>
        </div>
      </div>

      {metrics.packageCount === 0 ? (
        <div className="px-4 pt-2">
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
        <div className="px-4 pt-2">
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

      {trafficWarnings.length > 0 ? (
        <div className="px-4 pt-2">
          <TrafficCapacityWarning
            warnings={trafficWarnings}
            onGoTo={goToWarningNode}
          />
        </div>
      ) : null}

      {siteRedundancyWarnings.length > 0 ? (
        <div className="px-4 pt-2">
          <SiteRedundancyWarning
            warnings={siteRedundancyWarnings}
            onGoTo={goToWarningNode}
          />
        </div>
      ) : null}

      <div className="px-4 py-2">
        {showDiscount ? (
          <DiscountStatCards
            subtotal={subtotal}
            discountPercent={discountPercent}
            discountAmount={discountAmount}
            netTotal={netTotal}
            onDiscountChange={(value) => updateNodeDiscount(node.id, value)}
            inputId={`discount-pct-${node.id}`}
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-sm sm:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-0 pt-2">
                <CardTitle className="text-[11px] font-medium text-muted-foreground">
                  Total Price
                </CardTitle>
                <DollarSign className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 pb-2 pt-0.5">
                <p className="text-base font-bold leading-tight">
                  {formatCurrency(metrics.totalCost)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {childRollups.length > 0 ? (
        <div className="px-4 pb-2">
          <Card className="shadow-sm">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ChildRollupTable rows={childRollups} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {metrics.packageCount > 0 ? (
        <div className="px-4 pb-4">
          <Card className="shadow-sm">
            <CardHeader className="px-4 py-2">
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
  const { widths, setWidth, totalWidth } = useColumnWidths(
    "capex-width-rollup",
    ROLLUP_WIDTHS,
  );

  return (
    <Table className="table-fixed" style={{ width: totalWidth, minWidth: "100%" }}>
      <TableHeader>
        <TableRow>
          <ResizableTableHead
            columnId="name"
            width={widths.name}
            onWidthChange={setWidth}
            minWidth={120}
          >
            Name
          </ResizableTableHead>
          <ResizableTableHead
            columnId="totalPrice"
            width={widths.totalPrice}
            onWidthChange={setWidth}
            align="right"
            minWidth={90}
          >
            Total price
          </ResizableTableHead>
          <ResizableTableHead
            columnId="packages"
            width={widths.packages}
            onWidthChange={setWidth}
            align="right"
            minWidth={80}
          >
            Packages
          </ResizableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
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
  const { widths, setWidth, totalWidth } = useColumnWidths(
    "capex-width-packages-scope",
    PACKAGE_WIDTHS,
  );
  const node = findNode(tree, treeNodeId);
  const hotInstanceIds = useMemo(
    () => (node ? collectPackageUtilHotInstanceIds(node) : new Set<string>()),
    [node],
  );
  if (!node) return null;

  const packages = collectLicensePackages(node).map((pkg) => {
    if (!pkg.packageData) {
      return {
        id: pkg.id,
        vendorNodeName: pkg.vnnName,
        licensePackage: pkg.name,
        unit: "—",
        total: 0,
        currentUtil: 0,
        expansionUtil: 0,
        hasData: false,
      };
    }
    const metrics = computePackageMetrics(pkg.packageData);
    return {
      id: pkg.id,
      vendorNodeName: pkg.vnnName,
      licensePackage: pkg.packageData.licensePackage || pkg.name,
      unit: pkg.packageData.unit || "—",
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
    <Table
      className="table-fixed"
      style={{ width: totalWidth, minWidth: "100%" }}
    >
      <TableHeader>
        <TableRow>
          <ResizableTableHead
            columnId="vendorNodeName"
            width={widths.vendorNodeName}
            onWidthChange={setWidth}
            minWidth={120}
          >
            Vendor Node Name
          </ResizableTableHead>
          <ResizableTableHead
            columnId="licensePackage"
            width={widths.licensePackage}
            onWidthChange={setWidth}
            minWidth={140}
          >
            License Package
          </ResizableTableHead>
          <ResizableTableHead
            columnId="unit"
            width={widths.unit}
            onWidthChange={setWidth}
            minWidth={70}
          >
            Unit
          </ResizableTableHead>
          <ResizableTableHead
            columnId="currentUtil"
            width={widths.currentUtil}
            onWidthChange={setWidth}
            align="right"
            minWidth={70}
          >
            C. util
          </ResizableTableHead>
          <ResizableTableHead
            columnId="expansionUtil"
            width={widths.expansionUtil}
            onWidthChange={setWidth}
            align="right"
            minWidth={70}
          >
            Exp. util
          </ResizableTableHead>
          <ResizableTableHead
            columnId="totalPrice"
            width={widths.totalPrice}
            onWidthChange={setWidth}
            align="right"
            minWidth={90}
          >
            Total price
          </ResizableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.vendorNodeName}</TableCell>
            <TableCell>{row.licensePackage}</TableCell>
            <TableCell>{row.unit}</TableCell>
            <TableCell
              className={`text-right ${currentUtilHotClass(hotInstanceIds.has(row.id))}`}
            >
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
