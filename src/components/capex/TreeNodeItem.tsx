"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FoldVertical,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet,
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
import { cn } from "@/lib/utils";
import { useCapex } from "@/context/CapexContext";
import type { CapexTreeNode } from "@/types/capex";
import {
  collapseToChildTypeLabel,
  getChildTypeForParent,
  nodeTypeLabel,
  toSelectedNode,
} from "@/lib/tree-utils";
import { AddChildDialog } from "@/components/capex/AddChildDialog";
import { RenameDialog } from "@/components/capex/RenameDialog";
import { FeatureEntrySheet } from "@/components/capex/FeatureEntrySheet";
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
  networkDomain: "🔗",
  nodeName: "🖥️",
  nodeNameDB: "🗄️",
  feature: "⚡",
};

interface TreeNodeProps {
  node: CapexTreeNode;
  depth?: number;
}

export function TreeNodeItem({ node, depth = 0 }: TreeNodeProps) {
  const { selectedNode, setSelectedNode, addChild, renameNode, deleteNode } =
    useCapex();
  const { isExpanded, setExpanded, collapseNodeToDirectChildren } =
    useTreeExpansion();
  const [addOpen, setAddOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [featureSheetOpen, setFeatureSheetOpen] = useState(false);

  const expanded = isExpanded(node.id);
  const collapseLabel = collapseToChildTypeLabel(node.type);

  const isSelected = selectedNode?.id === node.id;
  const canAddChild = getChildTypeForParent(node.type) !== null;
  const canRename = !["nodeNameDB", "feature"].includes(node.type);
  const canDelete = !["country", "projectName"].includes(node.type);
  const hasChildren = node.children.length > 0;

  const handleSelect = () => {
    setSelectedNode(toSelectedNode(node));
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
            <DropdownMenuContent align="end" className="w-48">
              {canAddChild && node.type !== "nodeNameDB" && (
                <DropdownMenuItem onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add {nodeTypeLabel(getChildTypeForParent(node.type)!)}
                </DropdownMenuItem>
              )}
              {node.type === "nodeNameDB" && (
                <DropdownMenuItem onClick={() => setFeatureSheetOpen(true)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Enter Features
                </DropdownMenuItem>
              )}
              {node.type === "nodeNameDB" && canAddChild && (
                <DropdownMenuItem onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Node Name DB
                </DropdownMenuItem>
              )}
              {canRename && (
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              )}
              {!canRename && node.type !== "feature" && (
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  View Details
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

      {canAddChild && (
        <AddChildDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          parentNode={node}
          onAdded={handleAddChild}
        />
      )}

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentName={node.name}
        nodeType={nodeTypeLabel(node.type)}
        onRename={(name) => renameNode(node.id, name)}
        readOnly={!canRename}
      />

      {node.type === "nodeNameDB" && node.nodeNameDBId && (
        <FeatureEntrySheet
          open={featureSheetOpen}
          onOpenChange={setFeatureSheetOpen}
          nodeNameDBTreeNodeId={node.id}
          nodeNameDBId={node.nodeNameDBId}
          nodeNameDBName={node.name}
        />
      )}
    </>
  );
}
