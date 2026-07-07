"use client";

import { useEffect, useMemo, useState } from "react";
import { FoldVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCapex } from "@/context/CapexContext";
import { TreeNodeItem } from "@/components/capex/TreeNodeItem";
import { AddChildDialog } from "@/components/capex/AddChildDialog";
import {
  TreeExpansionProvider,
  useTreeExpansion,
} from "@/components/capex/TreeExpansionContext";
import type { CapexTreeNode } from "@/types/capex";

function TreeViewContent() {
  const { tree, addChild, setSelectedNode, isHydrated } = useCapex();
  const { collapseAllToCountries } = useTreeExpansion();
  const [addDeliveryOpen, setAddDeliveryOpen] = useState(false);

  const companies = useMemo(
    () =>
      tree.flatMap((country) =>
        country.children.map((company) => ({
          countryName: country.name,
          company,
        })),
      ),
    [tree],
  );

  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (companies.length === 0) {
      setActiveCompanyId(null);
      return;
    }
    if (
      !activeCompanyId ||
      !companies.some((entry) => entry.company.id === activeCompanyId)
    ) {
      setActiveCompanyId(companies[0].company.id);
    }
  }, [companies, activeCompanyId]);

  const activeCompanyEntry = companies.find(
    (entry) => entry.company.id === activeCompanyId,
  );

  const activeCompany = activeCompanyEntry?.company;

  if (!isHydrated) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading tree...
      </div>
    );
  }

  const handleAddDelivery = (child: CapexTreeNode) => {
    if (!activeCompany) return;
    addChild(activeCompany.id, child);
    setSelectedNode({ id: child.id, type: child.type, name: child.name });
  };

  const hasDeliveries = companies.some(
    (entry) => entry.company.children.length > 0,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">CAPEX Hierarchy</h2>
          <p className="text-xs text-muted-foreground">
            {tree.length} {tree.length === 1 ? "country" : "countries"}
            {companies.length > 0 &&
              ` · ${companies.length} ${companies.length === 1 ? "company" : "companies"}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tree.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={collapseAllToCountries}
            >
              <FoldVertical className="mr-1 h-4 w-4" />
              Collapse to countries
            </Button>
          )}
          {companies.length > 1 && (
            <Select
              value={activeCompanyId ?? undefined}
              onValueChange={(value) => setActiveCompanyId(value ?? null)}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Select company...">
                  {activeCompanyEntry
                    ? `${activeCompanyEntry.countryName} · ${activeCompanyEntry.company.name}`
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {companies.map((entry) => (
                  <SelectItem key={entry.company.id} value={entry.company.id}>
                    {entry.countryName} · {entry.company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddDeliveryOpen(true)}
            disabled={!activeCompany}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Delivery
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No countries yet. Add a country in Settings to start building the
              CAPEX tree.
            </p>
          </div>
        ) : !hasDeliveries ? (
          <div className="space-y-4">
            {tree.map((country) => (
              <TreeNodeItem key={country.id} node={country} depth={0} />
            ))}
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {companies.length === 0
                  ? "No companies yet. Use the menu on a country in the tree to add a company, then add deliveries."
                  : "No deliveries yet. Add your first delivery to start building the CAPEX tree."}
              </p>
              {activeCompany && (
                <Button size="sm" onClick={() => setAddDeliveryOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Delivery
                </Button>
              )}
            </div>
          </div>
        ) : (
          tree.map((country) => (
            <TreeNodeItem key={country.id} node={country} depth={0} />
          ))
        )}
      </ScrollArea>

      {activeCompany && (
        <AddChildDialog
          open={addDeliveryOpen}
          onOpenChange={setAddDeliveryOpen}
          parentNode={activeCompany}
          onAdded={handleAddDelivery}
        />
      )}
    </div>
  );
}

export function TreeView() {
  const { tree } = useCapex();

  return (
    <TreeExpansionProvider tree={tree}>
      <TreeViewContent />
    </TreeExpansionProvider>
  );
}
