"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  FoldVertical,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Wand2,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCapex } from "@/context/CapexContext";
import type { CapexTreeNode } from "@/types/capex";
import {
  collapseToChildTypeLabel,
  displayVendorNodeName,
  getChildTypeForParent,
  nodeTypeLabel,
  toSelectedNode,
} from "@/lib/tree-utils";
import {
  findFirstWarningVendorNode,
  nodeHasTrafficWarning,
} from "@/lib/traffic-warnings";
import {
  findFirstRedundancyNode,
  nodeHasSiteRedundancyWarning,
} from "@/lib/site-redundancy";
import { AddChildDialog } from "@/components/capex/AddChildDialog";
import { CapexEntryWizard } from "@/components/capex/CapexEntryWizard";
import { RenameDialog } from "@/components/capex/RenameDialog";
import { useTreeExpansion } from "@/components/capex/TreeExpansionContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const typeIcons: Record<CapexTreeNode["type"], string> = {
  country: "🌍",
  projectName: "🏢",
  delivery: "📦",
  domain: "🔗",
  node: "🖥️",
  vendor: "🏭",
  vendorNodeName: "🗄️",
  package: "📋",
};

interface TreeNodeProps {
  node: CapexTreeNode;
  depth?: number;
}

export function TreeNodeItem({ node, depth = 0 }: TreeNodeProps) {
  const {
    selectedNode,
    setSelectedNode,
    addChild,
    renameNode,
    deleteNode,
  } = useCapex();
  const { isExpanded, setExpanded, collapseNodeToDirectChildren } =
    useTreeExpansion();
  const [addOpen, setAddOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const expanded = isExpanded(node.id);
  const collapseLabel = collapseToChildTypeLabel(node.type);

  const isSelected = selectedNode?.id === node.id;
  const childType = getChildTypeForParent(node.type);
  const canAddChild = childType !== null;
  const canRename = node.type !== "package";
  const canDelete = !["country", "projectName"].includes(node.type);
  const hasChildren = node.children.length > 0;
  const packageCount =
    node.type === "vendorNodeName"
      ? (node.licenseYears ?? []).reduce(
          (sum, year) => sum + year.packages.length,
          0,
        )
      : 0;

  const displayName =
    node.type === "vendor" ? displayVendorNodeName(node) : node.name;
  const hasTrafficWarning = nodeHasTrafficWarning(node);
  const hasRedundancyWarning = nodeHasSiteRedundancyWarning(node);
  const hasAnyWarning = hasTrafficWarning || hasRedundancyWarning;

  const handleSelect = () => {
    setSelectedNode(toSelectedNode(node));
  };

  const handleWarningClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (hasTrafficWarning) {
      const target = findFirstWarningVendorNode(node);
      if (target) {
        setSelectedNode(toSelectedNode(target));
        setExpanded(target.id, true);
        return;
      }
    }
    const redundancyTarget = findFirstRedundancyNode(node);
    if (redundancyTarget) {
      setSelectedNode(toSelectedNode(redundancyTarget));
      setExpanded(redundancyTarget.id, true);
    }
  };

  const handleRowClick = () => {
    handleSelect();
    if (hasChildren) {
      setExpanded(node.id, !expanded);
    }
  };

  const handleAddChild = (child: CapexTreeNode) => {
    addChild(node.id, child);
    setExpanded(node.id, true);
    setSelectedNode(toSelectedNode(child));
  };

  const handleWizardComplete = (rootNode: CapexTreeNode) => {
    addChild(node.id, rootNode);
    setExpanded(node.id, true);
    setSelectedNode(toSelectedNode(rootNode));
  };

  return (
    <>
      <Collapsible
        open={expanded}
        onOpenChange={(open) => setExpanded(node.id, open)}
      >
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md py-1 pr-1 hover:bg-muted/60",
            isSelected && "bg-primary/10 ring-1 ring-primary/20",
          )}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 rounded-md text-left text-sm"
            onClick={handleRowClick}
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
              {hasChildren ? (
                expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )
              ) : (
                <span className="w-3.5" />
              )}
            </span>
            <span className="text-base leading-none">{typeIcons[node.type]}</span>
            <span className="truncate font-medium">{displayName}</span>
            {hasAnyWarning ? (
              <Tooltip>
                <TooltipTrigger
                  className="inline-flex shrink-0 rounded-sm bg-amber-100 p-0.5 ring-1 ring-amber-400 dark:bg-amber-950"
                  onClick={handleWarningClick}
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {hasTrafficWarning && hasRedundancyWarning
                    ? "Capacity and site redundancy warnings — click to open"
                    : hasRedundancyWarning
                      ? "Site redundancy at risk (N+1) — click to open"
                      : "Traffic exceeds Ex License Quantity — click to open"}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {node.type === "vendorNodeName" && packageCount > 0 ? (
              <Badge
                variant="secondary"
                className="ml-1 hidden h-5 px-1.5 text-[10px] sm:inline-flex"
              >
                {packageCount} pkg
              </Badge>
            ) : null}
            <span className="hidden text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">
              {nodeTypeLabel(node.type)}
            </span>
          </button>

          {hasChildren && collapseLabel && (
            <Tooltip>
              <TooltipTrigger
                className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  collapseNodeToDirectChildren(node);
                }}
              >
                <FoldVertical className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">{collapseLabel}</TooltipContent>
            </Tooltip>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 data-[popup-open]:opacity-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {node.type === "delivery" && (
                <DropdownMenuItem onClick={() => setWizardOpen(true)}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Guided CAPEX entry
                </DropdownMenuItem>
              )}
              {canAddChild && (
                <DropdownMenuItem onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add {nodeTypeLabel(childType!)}
                </DropdownMenuItem>
              )}
              {canRename && (
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteNode(node.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {node.children
              .filter((child) => child.type !== "package")
              .map((child) => (
                <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
              ))}
          </CollapsibleContent>
        )}
      </Collapsible>

      {canAddChild && (
        <AddChildDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          parentNode={node}
          onAdded={handleAddChild}
        />
      )}

      {node.type === "delivery" && (
        <CapexEntryWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          deliveryNode={node}
          onComplete={handleWizardComplete}
        />
      )}

      {canRename && (
        <RenameDialog
          open={renameOpen}
          onOpenChange={setRenameOpen}
          currentName={
            node.type === "vendor" ? (node.siteName ?? node.name) : node.name
          }
          nodeType={nodeTypeLabel(node.type)}
          onRename={(name) => renameNode(node.id, name)}
        />
      )}
    </>
  );
}
