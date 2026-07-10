"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { generateId } from "@/lib/tree-utils";
import {
  findVendorNodeNameMapping,
  getRelationshipTargets,
  setRelationshipTargets,
} from "@/lib/relationship-utils";
import type {
  AppSettings,
  CatalogItem,
  VendorNodeNameCatalogItem,
} from "@/types/capex";

interface SourceTargetMappingEditorProps {
  title: string;
  description: string;
  sourceLabel: string;
  targetLabel: string;
  sources: CatalogItem[];
  targets: CatalogItem[];
  mapping: Record<string, string[]>;
  onChange: (sourceId: string, targetIds: string[]) => void;
}

export function SourceTargetMappingEditor({
  title,
  description,
  sourceLabel,
  targetLabel,
  sources,
  targets,
  mapping,
  onChange,
}: SourceTargetMappingEditorProps) {
  const [sourceQuery, setSourceQuery] = useState("");
  const [targetQuery, setTargetQuery] = useState("");
  const [activeSourceId, setActiveSourceId] = useState(sources[0]?.id ?? "");
  const [copySourceId, setCopySourceId] = useState("");

  const filteredSources = useMemo(() => {
    const q = sourceQuery.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter((item) => item.name.toLowerCase().includes(q));
  }, [sources, sourceQuery]);

  useEffect(() => {
    if (!activeSourceId && sources[0]) setActiveSourceId(sources[0].id);
    if (activeSourceId && !sources.some((item) => item.id === activeSourceId)) {
      setActiveSourceId(sources[0]?.id ?? "");
    }
  }, [sources, activeSourceId]);

  const activeSource = sources.find((item) => item.id === activeSourceId);
  const selectedTargetIds = activeSourceId
    ? getRelationshipTargets(mapping, activeSourceId)
    : [];

  const filteredTargets = useMemo(() => {
    const q = targetQuery.trim().toLowerCase();
    if (!q) return targets;
    return targets.filter((item) => item.name.toLowerCase().includes(q));
  }, [targets, targetQuery]);

  const toggleTarget = (targetId: string) => {
    if (!activeSourceId) return;
    const next = selectedTargetIds.includes(targetId)
      ? selectedTargetIds.filter((id) => id !== targetId)
      : [...selectedTargetIds, targetId];
    onChange(activeSourceId, next);
  };

  const handleCopyFrom = () => {
    if (!activeSourceId || !copySourceId || copySourceId === activeSourceId) {
      return;
    }
    onChange(activeSourceId, getRelationshipTargets(mapping, copySourceId));
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label>{sourceLabel}</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={sourceQuery}
              onChange={(event) => setSourceQuery(event.target.value)}
              placeholder={`Search ${sourceLabel.toLowerCase()}...`}
              className="pl-9"
            />
          </div>
          <div className="max-h-[320px] space-y-1 overflow-y-auto rounded-md border p-1">
            {filteredSources.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No {sourceLabel.toLowerCase()} found.
              </p>
            ) : (
              filteredSources.map((source) => {
                const count = getRelationshipTargets(mapping, source.id).length;
                const active = source.id === activeSourceId;
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setActiveSourceId(source.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                      active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                    )}
                  >
                    <span className="truncate font-medium">{source.name}</span>
                    <Badge
                      variant={active ? "secondary" : "outline"}
                      className="ml-2 shrink-0"
                    >
                      {count}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {activeSource
                  ? `Linked ${targetLabel.toLowerCase()} for ${activeSource.name}`
                  : `Select a ${sourceLabel.toLowerCase()}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedTargetIds.length} selected
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={copySourceId}
                onValueChange={(value) => setCopySourceId(value ?? "")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Copy from..." />
                </SelectTrigger>
                <SelectContent>
                  {sources
                    .filter((item) => item.id !== activeSourceId)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                disabled={!copySourceId || !activeSourceId}
                onClick={handleCopyFrom}
              >
                <Copy className="mr-1 h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={targetQuery}
              onChange={(event) => setTargetQuery(event.target.value)}
              placeholder={`Search ${targetLabel.toLowerCase()}...`}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2 rounded-md border p-3 min-h-[120px]">
            {filteredTargets.length === 0 ? (
              <p className="w-full py-4 text-center text-sm text-muted-foreground">
                No {targetLabel.toLowerCase()} match your search.
              </p>
            ) : (
              filteredTargets.map((target) => {
                const selected = selectedTargetIds.includes(target.id);
                return (
                  <Button
                    key={target.id}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    disabled={!activeSourceId}
                    onClick={() => toggleTarget(target.id)}
                  >
                    {target.name}
                  </Button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NodeVendorMatrixSectionProps {
  nodes: CatalogItem[];
  vendors: CatalogItem[];
  vendorNodeNames: VendorNodeNameCatalogItem[];
  domainNodesMapping: Record<string, string[]>;
  domains: CatalogItem[];
  onUpsert: (item: VendorNodeNameCatalogItem) => void;
  onDelete: (id: string) => void;
}

export function NodeVendorMatrixSection({
  nodes,
  vendors,
  vendorNodeNames,
  domainNodesMapping,
  domains,
  onUpsert,
  onDelete,
}: NodeVendorMatrixSectionProps) {
  const [domainFilterId, setDomainFilterId] = useState("all");
  const [nodeQuery, setNodeQuery] = useState("");
  const [dialogState, setDialogState] = useState<{
    nodeId: string;
    vendorId: string;
    existing?: VendorNodeNameCatalogItem;
  } | null>(null);
  const [mappingName, setMappingName] = useState("");

  const visibleNodes = useMemo(() => {
    let list = nodes;
    if (domainFilterId !== "all") {
      const allowed = domainNodesMapping[domainFilterId] ?? [];
      list = allowed.length
        ? nodes.filter((node) => allowed.includes(node.id))
        : nodes;
    }
    const q = nodeQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((node) => node.name.toLowerCase().includes(q));
  }, [nodes, domainFilterId, domainNodesMapping, nodeQuery]);

  const openCell = (
    nodeId: string,
    vendorId: string,
    existing?: VendorNodeNameCatalogItem,
  ) => {
    setDialogState({ nodeId, vendorId, existing });
    setMappingName(existing?.name ?? "");
  };

  const nodeName = (id: string) =>
    nodes.find((item) => item.id === id)?.name ?? id;
  const vendorName = (id: string) =>
    vendors.find((item) => item.id === id)?.name ?? id;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <div>
        <h3 className="text-base font-semibold">Node + Vendor → Vendor Node Name</h3>
        <p className="text-sm text-muted-foreground">
          Matrix view of vendor-specific node names. Click a cell to assign or
          edit a mapping.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2 sm:w-56">
          <Label>Filter by domain</Label>
          <Select
            value={domainFilterId}
            onValueChange={(value) => setDomainFilterId(value ?? "all")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All nodes</SelectItem>
              {domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={nodeQuery}
            onChange={(event) => setNodeQuery(event.target.value)}
            placeholder="Search nodes..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Node</th>
              {vendors.map((vendor) => (
                <th key={vendor.id} className="px-3 py-2 text-center font-medium">
                  {vendor.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleNodes.length === 0 ? (
              <tr>
                <td
                  colSpan={vendors.length + 1}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No nodes match the current filters.
                </td>
              </tr>
            ) : (
              visibleNodes.map((node) => (
                <tr key={node.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{node.name}</td>
                  {vendors.map((vendor) => {
                    const mapping = findVendorNodeNameMapping(
                      vendorNodeNames,
                      node.id,
                      vendor.id,
                    );
                    return (
                      <td key={vendor.id} className="px-2 py-2 text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant={mapping ? "secondary" : "outline"}
                          className="min-w-[72px]"
                          onClick={() =>
                            openCell(node.id, vendor.id, mapping)
                          }
                        >
                          {mapping?.name ?? "—"}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!dialogState} onOpenChange={() => setDialogState(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogState?.existing ? "Edit mapping" : "Add mapping"}
            </DialogTitle>
            <DialogDescription>
              {dialogState
                ? `${nodeName(dialogState.nodeId)} + ${vendorName(dialogState.vendorId)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="matrix-vnn-name" required>
              Vendor node name
            </Label>
            <Input
              id="matrix-vnn-name"
              value={mappingName}
              onChange={(event) => setMappingName(event.target.value)}
              placeholder="e.g. PCC"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {dialogState?.existing ? (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(dialogState.existing!.id);
                  setDialogState(null);
                }}
              >
                Remove mapping
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogState(null)}>
                Cancel
              </Button>
              <Button
                disabled={!mappingName.trim() || !dialogState}
                onClick={() => {
                  if (!dialogState || !mappingName.trim()) return;
                  onUpsert({
                    id: dialogState.existing?.id ?? `vnn-${generateId()}`,
                    nodeId: dialogState.nodeId,
                    vendorId: dialogState.vendorId,
                    name: mappingName.trim(),
                  });
                  setDialogState(null);
                }}
              >
                Save mapping
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RelationshipMappingsPanelProps {
  settings: AppSettings;
  countries: CatalogItem[];
  onUpdateRelationships: (
    updater: (prev: AppSettings["relationships"]) => AppSettings["relationships"],
  ) => void;
  onUpsertVendorNodeName: (item: VendorNodeNameCatalogItem) => void;
  onDeleteVendorNodeName: (id: string) => void;
}

export function RelationshipMappingsPanel({
  settings,
  countries,
  onUpdateRelationships,
  onUpsertVendorNodeName,
  onDeleteVendorNodeName,
}: RelationshipMappingsPanelProps) {
  const { catalogs, relationships } = settings;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="delivery-domains">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="delivery-domains">Delivery → Domains</TabsTrigger>
          <TabsTrigger value="domain-nodes">Domain → Nodes</TabsTrigger>
          <TabsTrigger value="node-vendor">Node + Vendor</TabsTrigger>
          <TabsTrigger value="country-vendors">Country → Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="delivery-domains" className="mt-4">
          <SourceTargetMappingEditor
            title="Delivery → Domains"
            description="Choose which domains are available under each delivery when building the CAPEX tree."
            sourceLabel="Deliveries"
            targetLabel="Domains"
            sources={catalogs.deliveries}
            targets={catalogs.domains}
            mapping={relationships.deliveryDomains}
            onChange={(sourceId, targetIds) =>
              onUpdateRelationships((prev) => ({
                ...prev,
                deliveryDomains: setRelationshipTargets(
                  prev.deliveryDomains,
                  sourceId,
                  targetIds,
                ),
              }))
            }
          />
        </TabsContent>

        <TabsContent value="domain-nodes" className="mt-4">
          <SourceTargetMappingEditor
            title="Domain → Nodes"
            description="Choose which standard nodes belong to each domain. Nodes can be reused across multiple domains."
            sourceLabel="Domains"
            targetLabel="Nodes"
            sources={catalogs.domains}
            targets={catalogs.nodes}
            mapping={relationships.domainNodes}
            onChange={(sourceId, targetIds) =>
              onUpdateRelationships((prev) => ({
                ...prev,
                domainNodes: setRelationshipTargets(
                  prev.domainNodes,
                  sourceId,
                  targetIds,
                ),
              }))
            }
          />
        </TabsContent>

        <TabsContent value="node-vendor" className="mt-4">
          <NodeVendorMatrixSection
            nodes={catalogs.nodes}
            vendors={catalogs.vendors}
            vendorNodeNames={catalogs.vendorNodeNames}
            domainNodesMapping={relationships.domainNodes}
            domains={catalogs.domains}
            onUpsert={onUpsertVendorNodeName}
            onDelete={onDeleteVendorNodeName}
          />
        </TabsContent>

        <TabsContent value="country-vendors" className="mt-4">
          <SourceTargetMappingEditor
            title="Country → Vendors"
            description="Limit which vendors are available when building CAPEX in each country."
            sourceLabel="Countries"
            targetLabel="Vendors"
            sources={countries}
            targets={catalogs.vendors}
            mapping={relationships.countryVendors}
            onChange={(sourceId, targetIds) =>
              onUpdateRelationships((prev) => ({
                ...prev,
                countryVendors: setRelationshipTargets(
                  prev.countryVendors,
                  sourceId,
                  targetIds,
                ),
              }))
            }
          />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Package mappings are managed in the Packages catalog (each package links
        to a vendor node name). CAPEX tree presets use these relationships when
        adding children.
      </p>
    </div>
  );
}
