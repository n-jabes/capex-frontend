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
  nodeTypeLabel,
  supportsNodeDiscount,
  toSelectedNode,
} from "@/lib/tree-utils";
import { computePackageMetrics } from "@/lib/calculations";
import { formatCurrency, formatPercent, expansionUtilToneClass } from "@/lib/format";
import { collectTrafficWarnings } from "@/lib/traffic-warnings";
import { SummaryBreadcrumb } from "@/components/capex/SummaryBreadcrumb";
import { VendorNodeLicenseTable } from "@/components/capex/VendorNodeLicenseTable";
import { DiscountStatCards } from "@/components/capex/DiscountStatCards";
import { TrafficCapacityWarning } from "@/components/capex/TrafficCapacityWarning";
import {
  ColumnVisibilityMenu,
  useColumnVisibility,
  type TableColumnDef,
} from "@/components/capex/ColumnVisibilityMenu";

const ROLLUP_COLUMNS: TableColumnDef[] = [
  { id: "name", label: "Name", locked: true },
  { id: "totalPrice", label: "Total price" },
  { id: "packages", label: "Packages" },
];

const PACKAGE_COLUMNS: TableColumnDef[] = [
  { id: "licensePackage", label: "License Package", locked: true },
  { id: "unit", label: "Unit" },
  { id: "currentUtil", label: "C. util" },
  { id: "expansionUtil", label: "Exp. util" },
  { id: "totalPrice", label: "Total price" },
];

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

  const { node, path, metrics, childRollups, trafficWarnings } = summary;
  const isVnn = node.type === "vendorNodeName";
  const displayName =
    node.type === "vendor" ? displayVendorNodeName(node) : node.name;
  const showDiscount = supportsNodeDiscount(node.type);

  const goToWarningNode = (vendorNodeId: string) => {
    const target = findNode(tree, vendorNodeId);
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

        {trafficWarnings.length > 0 ? (
          <div className="px-4 pt-4">
            <TrafficCapacityWarning warnings={trafficWarnings} />
          </div>
        ) : null}

        <div className="p-4">
          <DiscountStatCards
            subtotal={subtotal}
            discountPercent={discountPercent}
            discountAmount={discountAmount}
            netTotal={netTotal}
            onDiscountChange={(value) => updateNodeDiscount(node.id, value)}
          />
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
  const subtotal = metrics.subtotal ?? metrics.totalCost;
  const discountPercent = metrics.discountPercent ?? node.discountPercent ?? 0;
  const discountAmount = metrics.discountAmount ?? 0;
  const netTotal = metrics.netTotal ?? metrics.totalCost;

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
            Summary for this {nodeTypeLabel(node.type).toLowerCase()} and all
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

      {trafficWarnings.length > 0 ? (
        <div className="px-4 pt-4">
          <TrafficCapacityWarning
            warnings={trafficWarnings}
            onGoTo={goToWarningNode}
          />
        </div>
      ) : null}

      <div className="p-4">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        )}
      </div>

      {childRollups.length > 0 ? (
        <div className="px-4 pb-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm">Summary</CardTitle>
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
  const { isVisible, toggle, columns } = useColumnVisibility(
    "capex-cols-rollup",
    ROLLUP_COLUMNS,
  );

  return (
    <div>
      <div className="flex justify-end border-b px-4 py-2">
        <ColumnVisibilityMenu
          columns={columns}
          isVisible={isVisible}
          onToggle={toggle}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {isVisible("name") ? <TableHead>Name</TableHead> : null}
            {isVisible("totalPrice") ? (
              <TableHead className="text-right">Total price</TableHead>
            ) : null}
            {isVisible("packages") ? (
              <TableHead className="text-right">Packages</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {isVisible("name") ? (
                <TableCell className="font-medium">{row.name}</TableCell>
              ) : null}
              {isVisible("totalPrice") ? (
                <TableCell className="text-right">
                  {row.metrics.packagesWithData > 0
                    ? formatCurrency(row.metrics.totalCost)
                    : "—"}
                </TableCell>
              ) : null}
              {isVisible("packages") ? (
                <TableCell className="text-right">
                  {row.metrics.packagesWithData}/{row.metrics.packageCount}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PackageTable({ treeNodeId }: { treeNodeId: string }) {
  const { tree } = useCapex();
  const { isVisible, toggle, columns } = useColumnVisibility(
    "capex-cols-packages-scope",
    PACKAGE_COLUMNS,
  );
  const node = findNode(tree, treeNodeId);
  if (!node) return null;

  const packages = collectLicensePackages(node).map((pkg) => {
    if (!pkg.packageData) {
      return {
        id: pkg.id,
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
    <div>
      <div className="flex justify-end border-b px-4 py-2">
        <ColumnVisibilityMenu
          columns={columns}
          isVisible={isVisible}
          onToggle={toggle}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {isVisible("licensePackage") ? (
              <TableHead>License Package</TableHead>
            ) : null}
            {isVisible("unit") ? <TableHead>Unit</TableHead> : null}
            {isVisible("currentUtil") ? (
              <TableHead className="text-right">C. util</TableHead>
            ) : null}
            {isVisible("expansionUtil") ? (
              <TableHead className="text-right">Exp. util</TableHead>
            ) : null}
            {isVisible("totalPrice") ? (
              <TableHead className="text-right">Total price</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((row) => (
            <TableRow key={row.id}>
              {isVisible("licensePackage") ? (
                <TableCell className="font-medium">{row.licensePackage}</TableCell>
              ) : null}
              {isVisible("unit") ? <TableCell>{row.unit}</TableCell> : null}
              {isVisible("currentUtil") ? (
                <TableCell className="text-right">
                  {row.hasData ? formatPercent(row.currentUtil) : "—"}
                </TableCell>
              ) : null}
              {isVisible("expansionUtil") ? (
                <TableCell
                  className={`text-right ${
                    row.hasData
                      ? expansionUtilToneClass(
                          row.expansionUtil,
                          row.currentUtil,
                        )
                      : ""
                  }`}
                >
                  {row.hasData ? formatPercent(row.expansionUtil) : "—"}
                </TableCell>
              ) : null}
              {isVisible("totalPrice") ? (
                <TableCell className="text-right">
                  {row.hasData ? formatCurrency(row.total) : "—"}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
