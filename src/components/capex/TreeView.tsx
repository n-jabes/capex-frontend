"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardPaste, FoldVertical, Plus } from "lucide-react";
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
import { CapexEntryWizard } from "@/components/capex/CapexEntryWizard";
import {
  TreeExpansionProvider,
  useTreeExpansion,
} from "@/components/capex/TreeExpansionContext";
import type { CapexTreeNode } from "@/types/capex";
import { nodeTypeLabel } from "@/lib/tree-utils";

function TreeViewContent() {
  const {
    tree,
    addChild,
    setSelectedNode,
    selectedNode,
    isHydrated,
    copyNode,
    canPasteInto,
    pasteInto,
    clipboard,
  } = useCapex();
  const { collapseAllToCountries, setExpanded } = useTreeExpansion();
  const [addDeliveryOpen, setAddDeliveryOpen] = useState(false);
  const [wizardDelivery, setWizardDelivery] = useState<CapexTreeNode | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canPasteCountryAtRoot = canPasteInto(null);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      if (event.key.toLowerCase() === "c" && selectedNode) {
        event.preventDefault();
        if (copyNode(selectedNode.id)) {
          setStatusMessage(`Copied ${nodeTypeLabel(selectedNode.type)}`);
        }
        return;
      }

      if (event.key.toLowerCase() === "v") {
        event.preventDefault();
        const parentId =
          selectedNode && canPasteInto(selectedNode.id)
            ? selectedNode.id
            : canPasteInto(null)
              ? null
              : selectedNode?.id ?? null;
        const result = pasteInto(parentId);
        if (!result.ok) {
          setStatusMessage(result.reason);
          return;
        }
        if (parentId) setExpanded(parentId, true);
        setStatusMessage(`Pasted ${nodeTypeLabel(result.node.type)}`);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedNode,
    copyNode,
    canPasteInto,
    pasteInto,
    setExpanded,
  ]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const projectNames = useMemo(
    () =>
      tree.flatMap((country) =>
        country.children.map((projectName) => ({
          countryName: country.name,
          projectName,
        })),
      ),
    [tree],
  );

  const [activeProjectNameId, setActiveProjectNameId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (projectNames.length === 0) {
      setActiveProjectNameId(null);
      return;
    }
    if (
      !activeProjectNameId ||
      !projectNames.some(
        (entry) => entry.projectName.id === activeProjectNameId,
      )
    ) {
      setActiveProjectNameId(projectNames[0].projectName.id);
    }
  }, [projectNames, activeProjectNameId]);

  const activeProjectNameEntry = projectNames.find(
    (entry) => entry.projectName.id === activeProjectNameId,
  );

  const activeProjectName = activeProjectNameEntry?.projectName;

  if (!isHydrated) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading tree...
      </div>
    );
  }

  const handleAddDelivery = (child: CapexTreeNode) => {
    if (!activeProjectName) return;
    addChild(activeProjectName.id, child);
    setSelectedNode({ id: child.id, type: child.type, name: child.name });
    setWizardDelivery(child);
  };

  const hasDeliveries = projectNames.some(
    (entry) => entry.projectName.children.length > 0,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Network Forecast</h2>
          <p className="text-xs text-muted-foreground">
            {tree.length} {tree.length === 1 ? "country" : "countries"}
            {projectNames.length > 0 &&
              ` · ${projectNames.length} ${projectNames.length === 1 ? "project name" : "project names"}`}
            {clipboard
              ? ` · clipboard: ${nodeTypeLabel(clipboard.node.type)}`
              : ""}
          </p>
          {statusMessage ? (
            <p className="text-xs text-foreground">{statusMessage}</p>
          ) : null}
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
          {canPasteCountryAtRoot && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const result = pasteInto(null);
                if (!result.ok) {
                  setStatusMessage(result.reason);
                  return;
                }
                setStatusMessage(`Pasted ${nodeTypeLabel(result.node.type)}`);
              }}
            >
              <ClipboardPaste className="mr-1 h-4 w-4" />
              Paste country
            </Button>
          )}
          {projectNames.length > 1 && (
            <Select
              value={activeProjectNameId ?? undefined}
              onValueChange={(value) => setActiveProjectNameId(value ?? null)}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Select project name...">
                  {activeProjectNameEntry
                    ? `${activeProjectNameEntry.countryName} · ${activeProjectNameEntry.projectName.name}`
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projectNames.map((entry) => (
                  <SelectItem
                    key={entry.projectName.id}
                    value={entry.projectName.id}
                  >
                    {entry.countryName} · {entry.projectName.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddDeliveryOpen(true)}
            disabled={!activeProjectName}
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
                {projectNames.length === 0
                  ? "No project names yet. Use the menu on a country in the tree to add a project name, then add deliveries."
                  : "No deliveries yet. Add your first delivery to start building the CAPEX tree."}
              </p>
              {activeProjectName && (
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

      {activeProjectName && (
        <AddChildDialog
          open={addDeliveryOpen}
          onOpenChange={setAddDeliveryOpen}
          parentNode={activeProjectName}
          onAdded={handleAddDelivery}
        />
      )}

      {wizardDelivery && (
        <CapexEntryWizard
          open={!!wizardDelivery}
          onOpenChange={(open) => {
            if (!open) setWizardDelivery(null);
          }}
          deliveryNode={wizardDelivery}
          onComplete={(rootNode) => {
            addChild(wizardDelivery.id, rootNode);
            setSelectedNode({
              id: rootNode.id,
              type: rootNode.type,
              name: rootNode.name,
            });
            setWizardDelivery(null);
          }}
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
