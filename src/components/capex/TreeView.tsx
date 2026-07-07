"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCapex } from "@/context/CapexContext";
import { TreeNodeItem } from "@/components/capex/TreeNodeItem";
import { AddChildDialog } from "@/components/capex/AddChildDialog";
import { useState } from "react";
import type { CapexTreeNode } from "@/types/capex";

export function TreeView() {
  const { tree, addChild, setSelectedNode, isHydrated } = useCapex();
  const [addDeliveryOpen, setAddDeliveryOpen] = useState(false);

  const companyNode = tree[0]?.children[0];

  if (!isHydrated) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading tree...
      </div>
    );
  }

  const handleAddDelivery = (child: CapexTreeNode) => {
    if (!companyNode) return;
    addChild(companyNode.id, child);
    setSelectedNode({ id: child.id, type: child.type, name: child.name });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">CAPEX Hierarchy</h2>
          <p className="text-xs text-muted-foreground">
            {tree[0]?.name} · {companyNode?.name}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAddDeliveryOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Delivery
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {companyNode?.children.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No deliveries yet. Add your first delivery to start building the CAPEX tree.
            </p>
            <Button size="sm" onClick={() => setAddDeliveryOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Delivery
            </Button>
          </div>
        ) : (
          companyNode?.children.map((node) => (
            <TreeNodeItem key={node.id} node={node} depth={0} />
          ))
        )}

        {tree.map((country) =>
          country.children.slice(1).map((company) => (
            <div key={company.id} className="mt-4 border-t pt-2">
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                {country.name} · {company.name}
              </p>
              {company.children.map((node) => (
                <TreeNodeItem key={node.id} node={node} depth={0} />
              ))}
            </div>
          )),
        )}
      </ScrollArea>

      {companyNode && (
        <AddChildDialog
          open={addDeliveryOpen}
          onOpenChange={setAddDeliveryOpen}
          parentNode={companyNode}
          onAdded={handleAddDelivery}
        />
      )}
    </div>
  );
}
