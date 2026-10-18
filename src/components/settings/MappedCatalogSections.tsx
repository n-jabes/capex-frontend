"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCatalogItem } from "@/lib/catalog-utils";
import { getRelationshipTargets } from "@/lib/relationship-utils";
import type { CatalogItem, CatalogRelationships } from "@/types/capex";
import { cn } from "@/lib/utils";

interface MappedCatalogSectionProps {
  title: string;
  description: string;
  catalogLabel: string;
  catalogPlaceholder: string;
  catalogIdPrefix: string;
  filterLabel: string;
  filterItems: CatalogItem[];
  catalogItems: CatalogItem[];
  mapping: Record<string, string[]>;
  mappingKey: keyof Pick<
    CatalogRelationships,
    "deliveryDomains" | "domainNodes"
  >;
  onAddCatalog: (item: CatalogItem) => void;
  onUpdateCatalog: (id: string, name: string) => void;
  onDeleteCatalog: (id: string) => void;
  onUpdateMapping: (
    sourceId: string,
    targetIds: string[],
    mappingKey: keyof Pick<CatalogRelationships, "deliveryDomains" | "domainNodes">,
  ) => void;
  readOnly?: boolean;
}

export function MappedCatalogSection({
  title,
  description,
  catalogLabel,
  catalogPlaceholder,
  catalogIdPrefix,
  filterLabel,
  filterItems,
  catalogItems,
  mapping,
  mappingKey,
  onAddCatalog,
  onUpdateCatalog,
  onDeleteCatalog,
  onUpdateMapping,
  readOnly = false,
}: MappedCatalogSectionProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [activeFilterId, setActiveFilterId] = useState(filterItems[0]?.id ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const [addName, setAddName] = useState("");
  const [mapToActive, setMapToActive] = useState(true);
  const [mapToAll, setMapToAll] = useState(false);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);

  const filteredSources = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return filterItems;
    return filterItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [filterItems, filterQuery]);

  useEffect(() => {
    if (!activeFilterId && filterItems[0]) setActiveFilterId(filterItems[0].id);
    if (activeFilterId && !filterItems.some((item) => item.id === activeFilterId)) {
      setActiveFilterId(filterItems[0]?.id ?? "");
    }
  }, [filterItems, activeFilterId]);

  const mappedIds = activeFilterId
    ? getRelationshipTargets(mapping, activeFilterId)
    : [];

  const filteredCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return catalogItems;
    return catalogItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [catalogItems, catalogQuery]);

  const toggleMapping = (catalogId: string) => {
    if (readOnly || !activeFilterId) return;
    const next = mappedIds.includes(catalogId)
      ? mappedIds.filter((id) => id !== catalogId)
      : [...mappedIds, catalogId];
    onUpdateMapping(activeFilterId, next, mappingKey);
  };

  const openAddDialog = () => {
    setAddName("");
    setMapToActive(true);
    setMapToAll(false);
    setSelectedDeliveryIds(activeFilterId ? [activeFilterId] : []);
    setAddOpen(true);
  };

  const handleAdd = () => {
    const trimmed = addName.trim();
    if (!trimmed) return;
    const item = createCatalogItem(trimmed, catalogIdPrefix);
    onAddCatalog(item);

    const targets = mapToAll
      ? filterItems.map((entry) => entry.id)
      : mapToActive && activeFilterId
        ? [activeFilterId]
        : selectedDeliveryIds;

    for (const sourceId of targets) {
      const existing = getRelationshipTargets(mapping, sourceId);
      if (!existing.includes(item.id)) {
        onUpdateMapping(sourceId, [...existing, item.id], mappingKey);
      }
    }

    setAddOpen(false);
  };

  const toggleDeliverySelection = (id: string) => {
    setSelectedDeliveryIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {readOnly ? (
          <span className="text-xs text-muted-foreground">View only</span>
        ) : (
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="mr-1 h-4 w-4" />
            Add {catalogLabel}
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label>{filterLabel}</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
              placeholder={`Search ${filterLabel.toLowerCase()}...`}
              className="pl-9"
            />
          </div>
          <div className="max-h-[360px] space-y-1 overflow-y-auto rounded-md border p-1">
            {filteredSources.map((item) => {
              const count = getRelationshipTargets(mapping, item.id).length;
              const active = item.id === activeFilterId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveFilterId(item.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    active && "bg-primary/10 ring-1 ring-primary/30",
                  )}
                >
                  <span className="truncate font-medium">{item.name}</span>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>
              {catalogLabel}s
              {activeFilterId
                ? ` for ${filterItems.find((item) => item.id === activeFilterId)?.name ?? ""}`
                : ""}
            </Label>
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder={`Search ${catalogLabel.toLowerCase()}s...`}
                className="pl-9"
              />
            </div>
          </div>

          <div className="max-h-[360px] space-y-1 overflow-y-auto rounded-md border p-1">
            {filteredCatalog.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No {catalogLabel.toLowerCase()}s yet.
              </p>
            ) : (
              filteredCatalog.map((item) => {
                const mapped = mappedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMapping(item.id)}
                      disabled={readOnly || !activeFilterId}
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                        mapped
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30",
                        readOnly && "cursor-default opacity-80",
                      )}
                      aria-label={mapped ? "Unmap" : "Map"}
                    >
                      {mapped && <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!readOnly) setEditItem(item);
                      }}
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                    >
                      {item.name}
                    </button>
                    {readOnly ? null : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs text-muted-foreground"
                        onClick={() => onDeleteCatalog(item.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Click the checkbox to map or unmap a {catalogLabel.toLowerCase()} to
            the selected {filterLabel.toLowerCase()}. Advanced bulk editing remains
            in Settings → Mappings.
          </p>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {catalogLabel}</DialogTitle>
            <DialogDescription>
              Create a new {catalogLabel.toLowerCase()} and optionally map it to
              one or more {filterLabel.toLowerCase()}s.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapped-catalog-name" required>
                {catalogLabel} name
              </Label>
              <Input
                id="mapped-catalog-name"
                value={addName}
                onChange={(event) => setAddName(event.target.value)}
                placeholder={catalogPlaceholder}
              />
            </div>
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Map to {filterLabel.toLowerCase()}s</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border"
                  checked={mapToAll}
                  onChange={(event) => {
                    setMapToAll(event.target.checked);
                    if (event.target.checked) setMapToActive(false);
                  }}
                />
                All {filterLabel.toLowerCase()}s
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border"
                  checked={mapToActive}
                  disabled={mapToAll || !activeFilterId}
                  onChange={(event) => {
                    setMapToActive(event.target.checked);
                    if (event.target.checked) setMapToAll(false);
                  }}
                />
                Current {filterLabel.toLowerCase()} only
              </label>
              {!mapToAll && !mapToActive && (
                <div className="max-h-32 space-y-1 overflow-y-auto pt-1">
                  {filterItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border"
                        checked={selectedDeliveryIds.includes(item.id)}
                        onChange={() => toggleDeliverySelection(item.id)}
                      />
                      {item.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!addName.trim()}>
              Add {catalogLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editItem ? (
        <EditMappedCatalogDialog
          item={editItem}
          nameLabel={`${catalogLabel} name`}
          onClose={() => setEditItem(null)}
          onSave={(name) => {
            onUpdateCatalog(editItem.id, name);
            setEditItem(null);
          }}
        />
      ) : null}
    </div>
  );
}

function EditMappedCatalogDialog({
  item,
  nameLabel,
  onClose,
  onSave,
}: {
  item: CatalogItem;
  nameLabel: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(item.name);

  useEffect(() => {
    setName(item.name);
  }, [item]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {nameLabel.toLowerCase()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="edit-mapped-name" required>
            {nameLabel}
          </Label>
          <Input
            id="edit-mapped-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(name.trim())} disabled={!name.trim()}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DomainCatalogSection({
  deliveries,
  domains,
  mapping,
  onAddDomain,
  onUpdateDomain,
  onDeleteDomain,
  onUpdateMapping,
  readOnly = false,
}: {
  deliveries: CatalogItem[];
  domains: CatalogItem[];
  mapping: CatalogRelationships["deliveryDomains"];
  onAddDomain: (item: CatalogItem) => void;
  onUpdateDomain: (id: string, name: string) => void;
  onDeleteDomain: (id: string) => void;
  onUpdateMapping: (
    deliveryId: string,
    domainIds: string[],
  ) => void;
  readOnly?: boolean;
}) {
  return (
    <MappedCatalogSection
      title="Domains"
      description="Filter domains by delivery and map them inline. New domains can be linked to one, several, or all deliveries."
      catalogLabel="Domain"
      catalogPlaceholder="e.g. Packet Core"
      catalogIdPrefix="dom"
      filterLabel="Delivery"
      filterItems={deliveries}
      catalogItems={domains}
      mapping={mapping}
      mappingKey="deliveryDomains"
      readOnly={readOnly}
      onAddCatalog={onAddDomain}
      onUpdateCatalog={onUpdateDomain}
      onDeleteCatalog={onDeleteDomain}
      onUpdateMapping={(sourceId, targetIds) =>
        onUpdateMapping(sourceId, targetIds)
      }
    />
  );
}

export function NodeCatalogSection({
  domains,
  nodes,
  mapping,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onUpdateMapping,
  readOnly = false,
}: {
  domains: CatalogItem[];
  nodes: CatalogItem[];
  mapping: CatalogRelationships["domainNodes"];
  onAddNode: (item: CatalogItem) => void;
  onUpdateNode: (id: string, name: string) => void;
  onDeleteNode: (id: string) => void;
  onUpdateMapping: (domainId: string, nodeIds: string[]) => void;
  readOnly?: boolean;
}) {
  return (
    <MappedCatalogSection
      title="Nodes"
      description="Filter nodes by domain and map them inline. New nodes can be linked to one, several, or all domains."
      catalogLabel="Node"
      catalogPlaceholder="e.g. SGSN-MME"
      catalogIdPrefix="node"
      filterLabel="Domain"
      filterItems={domains}
      catalogItems={nodes}
      mapping={mapping}
      mappingKey="domainNodes"
      readOnly={readOnly}
      onAddCatalog={onAddNode}
      onUpdateCatalog={onUpdateNode}
      onDeleteCatalog={onDeleteNode}
      onUpdateMapping={(sourceId, targetIds) =>
        onUpdateMapping(sourceId, targetIds)
      }
    />
  );
}
