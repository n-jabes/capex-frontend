"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { NODE_NAME_DBS } from "@/data/nodeNameDBs";
import { SearchablePicker } from "@/components/capex/SearchablePicker";
import { useCapex, generateId } from "@/context/CapexContext";
import type { CapexTreeNode } from "@/types/capex";
import { getChildTypeForParent, nodeTypeLabel } from "@/lib/tree-utils";

interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentNode: CapexTreeNode;
  onAdded: (child: CapexTreeNode) => void;
}

export function AddChildDialog({
  open,
  onOpenChange,
  parentNode,
  onAdded,
}: AddChildDialogProps) {
  const { settings } = useCapex();
  const childType = getChildTypeForParent(parentNode.type);
  const [customName, setCustomName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [selectedNodeNameDB, setSelectedNodeNameDB] = useState("");

  const presets = (() => {
    switch (childType) {
      case "company":
        return settings.defaultCompanies ?? [];
      case "delivery":
        return settings.defaultDeliveries;
      case "networkDomain":
        return settings.defaultNetworkDomains;
      case "nodeName":
        return settings.defaultNodeNames;
      default:
        return [];
    }
  })();

  const reset = () => {
    setCustomName("");
    setSelectedPreset("");
    setSelectedNodeNameDB("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleAdd = () => {
    if (!childType) return;

    if (childType === "nodeNameDB") {
      const db = NODE_NAME_DBS.find((d) => d.id === selectedNodeNameDB);
      if (!db) return;
      const child: CapexTreeNode = {
        id: generateId(),
        type: "nodeNameDB",
        name: db.name,
        nodeNameDBId: db.id,
        children: [],
      };
      onAdded(child);
      handleClose(false);
      return;
    }

    const name = customName.trim() || selectedPreset;
    if (!name) return;

    const child: CapexTreeNode = {
      id: generateId(),
      type: childType,
      name,
      children: [],
    };
    onAdded(child);
    handleClose(false);
  };

  const label = childType ? nodeTypeLabel(childType) : "Child";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {label}</DialogTitle>
        </DialogHeader>

        {childType === "nodeNameDB" ? (
          <div className="space-y-2 py-2">
            <Label required>Select Node Name DB</Label>
            <p className="text-xs text-muted-foreground">
              Node Name DBs are predefined catalog entries shared across all countries.
              Type to filter the list.
            </p>
            <SearchablePicker
              items={NODE_NAME_DBS.map((db) => ({
                id: db.id,
                label: db.name,
                description: db.description,
              }))}
              selectedId={selectedNodeNameDB}
              onSelect={setSelectedNodeNameDB}
              placeholder="Search node name DBs..."
              emptyMessage="No node name DBs match your search."
            />
          </div>
        ) : (
          <Tabs defaultValue="preset" className="py-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">Select preset</TabsTrigger>
              <TabsTrigger value="custom">Custom name</TabsTrigger>
            </TabsList>
            <TabsContent value="preset" className="space-y-2 pt-2">
              <Label required>Preset {label}</Label>
              <Select
                value={selectedPreset}
                onValueChange={(v) => setSelectedPreset(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Choose ${label.toLowerCase()}...`} />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            <TabsContent value="custom" className="space-y-2 pt-2">
              <Label required>Custom {label} name</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`Enter ${label.toLowerCase()} name`}
              />
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={
              childType === "nodeNameDB"
                ? !selectedNodeNameDB
                : !customName.trim() && !selectedPreset
            }
          >
            Add {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
