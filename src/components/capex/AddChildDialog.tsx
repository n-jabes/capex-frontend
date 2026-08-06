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
import {
  findNodePath,
  getChildTypeForParent,
  nodeTypeLabel,
} from "@/lib/tree-utils";

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
  const [siteName, setSiteName] = useState("");

  const isSiteVendor = childType === "vendor";

  const parentPath = findNodePath(tree, parentNode.id) ?? [parentNode];
  const presets =
    childType
      ? getFilteredPresetsForChild(settings, parentNode, parentPath, childType)
      : [];
  const selectedPreset = presets.find((item) => item.id === selectedPresetId);

  const reset = () => {
    setCustomName("");
    setSelectedPresetId("");
    setSiteName("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleAdd = () => {
    if (!childType) return;

    if (isSiteVendor) {
      const vendorName = selectedPreset?.name ?? customName.trim();
      const site = siteName.trim();
      if (!vendorName || !site) return;

      const child: CapexTreeNode = {
        id: generateId(),
        type: "vendor",
        name: vendorName,
        siteName: site,
        children: [],
        ...(selectedPresetId ? { catalogId: selectedPresetId } : {}),
      };
      onAdded(child);
      handleClose(false);
      return;
    }

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
  const canSubmit = isSiteVendor
    ? !!siteName.trim() && (!!selectedPresetId || !!customName.trim())
    : !!customName.trim() || !!selectedPresetId;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSiteVendor ? "Add Site Name" : `Add ${label}`}
          </DialogTitle>
        </DialogHeader>

        {isSiteVendor ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label required>Site name</Label>
              <Input
                value={siteName}
                onChange={(event) => setSiteName(event.target.value)}
                placeholder="e.g. Kigali Hub"
              />
            </div>
            <div className="space-y-2">
              <Label required>Vendor</Label>
              <Select
                value={selectedPresetId}
                onValueChange={(value) => setSelectedPresetId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose vendor...">
                    {selectedPreset?.name ?? ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {presets.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No vendors — configure in Settings
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
            </div>
            <div className="space-y-2">
              <Label>Or custom vendor name</Label>
              <Input
                value={customName}
                onChange={(event) => {
                  setCustomName(event.target.value);
                  if (event.target.value.trim()) setSelectedPresetId("");
                }}
                placeholder="Optional if selecting from list"
              />
            </div>
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
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!canSubmit}>
            Add {isSiteVendor ? "Site Name" : label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
