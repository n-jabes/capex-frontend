"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FoldVertical,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Wand2,
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
  findNode,
  getChildTypeForParent,
  nodeTypeLabel,
  toSelectedNode,
} from "@/lib/tree-utils";
import { AddChildDialog } from "@/components/capex/AddChildDialog";
import { AddPackagesDialog } from "@/components/capex/AddPackagesDialog";
import { CapexEntryWizard } from "@/components/capex/CapexEntryWizard";
import { PackageEntrySheet } from "@/components/capex/PackageEntrySheet";
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
    tree,
    selectedNode,
    setSelectedNode,
    addChild,
    addChildren,
    renameNode,
    deleteNode,
  } = useCapex();
  const { isExpanded, setExpanded, collapseNodeToDirectChildren } =
    useTreeExpansion();
  const [addOpen, setAddOpen] = useState(false);
  const [addPackagesOpen, setAddPackagesOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [entryNodeId, setEntryNodeId] = useState<string | null>(null);

  const expanded = isExpanded(node.id);
  const collapseLabel = collapseToChildTypeLabel(node.type);
  const entryNode = entryNodeId ? findNode(tree, entryNodeId) : null;

  const isSelected = selectedNode?.id === node.id;
  const childType = getChildTypeForParent(node.type);
  const canAddChild = childType !== null;
  const usesPackagePicker = childType === "package";
  const canRename = node.type !== "package";
  const canDelete = !["country", "projectName"].includes(node.type);
  const hasChildren = node.children.length > 0;
  const hasCapexData = node.type === "package" && !!node.packageData;

  const handleSelect = () => {
    setSelectedNode(toSelectedNode(node));
  };

  const handleRowClick = () => {
    handleSelect();
    if (node.type === "package" && !node.packageData) {
      setEntryNodeId(node.id);
      return;
    }
    if (hasChildren) {
      setExpanded(node.id, !expanded);
    }
  };

  const handleAddChild = (child: CapexTreeNode) => {
    addChild(node.id, child);
    setExpanded(node.id, true);
    setSelectedNode(toSelectedNode(child));
  };

  const handleAddPackages = (children: CapexTreeNode[]) => {
    addChildren(node.id, children);
    setExpanded(node.id, true);
    if (children[0]) {
      setSelectedNode(toSelectedNode(children[0]));
      setEntryNodeId(children[0].id);
    }
  };

  const handleWizardComplete = (
    rootNode: CapexTreeNode,
    packageNodes: CapexTreeNode[],
  ) => {
    addChild(node.id, rootNode);
    setExpanded(node.id, true);
    setSelectedNode(toSelectedNode(rootNode));
    if (packageNodes[0]) {
      setEntryNodeId(packageNodes[0].id);
    }
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
            <span className="truncate font-medium">{node.name}</span>
            {hasCapexData ? (
              <Badge variant="secondary" className="ml-1 hidden h-5 px-1.5 text-[10px] sm:inline-flex">
                CAPEX
              </Badge>
            ) : node.type === "package" ? (
              <Badge variant="outline" className="ml-1 hidden h-5 px-1.5 text-[10px] text-amber-700 sm:inline-flex">
                No data
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
              {canAddChild && !usesPackagePicker && (
                <DropdownMenuItem onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add {nodeTypeLabel(childType!)}
                </DropdownMenuItem>
              )}
              {usesPackagePicker && (
                <DropdownMenuItem onClick={() => setAddPackagesOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Select packages
                </DropdownMenuItem>
              )}
              {node.type === "package" && (
                <DropdownMenuItem onClick={() => setEntryNodeId(node.id)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {hasCapexData ? "Edit CAPEX entry" : "Enter CAPEX data"}
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
            {node.children.map((child) => (
              <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>

      {canAddChild && !usesPackagePicker && (
        <AddChildDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          parentNode={node}
          onAdded={handleAddChild}
        />
      )}

      {usesPackagePicker && (
        <AddPackagesDialog
          open={addPackagesOpen}
          onOpenChange={setAddPackagesOpen}
          parentNode={node}
          onAdded={handleAddPackages}
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

      {entryNode?.type === "package" && (
        <PackageEntrySheet
          open={!!entryNodeId}
          onOpenChange={(open) => {
            if (!open) setEntryNodeId(null);
          }}
          packageNode={entryNode}
        />
      )}

      {canRename && (
        <RenameDialog
          open={renameOpen}
          onOpenChange={setRenameOpen}
          currentName={node.name}
          nodeType={nodeTypeLabel(node.type)}
          onRename={(name) => renameNode(node.id, name)}
        />
      )}
    </>
  );
}
