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
import { useCapex, generateId } from "@/context/CapexContext";
import { getFilteredPresetsForChild } from "@/lib/relationship-utils";
import type { CapexTreeNode } from "@/types/capex";
import { findNodePath, getChildTypeForParent, nodeTypeLabel } from "@/lib/tree-utils";

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
  const { settings, tree } = useCapex();
  const childType = getChildTypeForParent(parentNode.type);
  const [customName, setCustomName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const parentPath = findNodePath(tree, parentNode.id) ?? [parentNode];
  const presets =
    childType
      ? getFilteredPresetsForChild(settings, parentNode, parentPath, childType)
      : [];
  const selectedPreset = presets.find((item) => item.id === selectedPresetId);

  const reset = () => {
    setCustomName("");
    setSelectedPresetId("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleAdd = () => {
    if (!childType) return;

    const name = customName.trim() || selectedPreset?.name;
    if (!name) return;

    const child: CapexTreeNode = {
      id: generateId(),
      type: childType,
      name,
      children: [],
      ...(selectedPresetId && !customName.trim()
        ? { catalogId: selectedPresetId }
        : {}),
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

        <Tabs defaultValue="preset" className="py-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">Select preset</TabsTrigger>
            <TabsTrigger value="custom">Custom name</TabsTrigger>
          </TabsList>
          <TabsContent value="preset" className="space-y-2 pt-2">
            <Label required>Preset {label}</Label>
            <Select
              value={selectedPresetId}
              onValueChange={(value) => setSelectedPresetId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Choose ${label.toLowerCase()}...`}>
                  {selectedPreset?.name ?? ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {presets.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No mapped presets — configure in Settings → Mappings
                  </SelectItem>
                ) : (
                  presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </TabsContent>
          <TabsContent value="custom" className="space-y-2 pt-2">
            <Label required>Custom {label} name</Label>
            <Input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder={`Enter ${label.toLowerCase()} name`}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!customName.trim() && !selectedPresetId}
          >
            Add {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
