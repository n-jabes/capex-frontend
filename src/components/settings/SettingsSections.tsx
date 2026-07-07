"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function AddStringItemDialog({
  open,
  onOpenChange,
  title,
  description,
  fieldLabel,
  placeholder,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  onAdd: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="string-item-value">{fieldLabel}</Label>
          <Input
            id="string-item-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!value.trim()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StringListSectionProps {
  title: string;
  description: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  addLabel: string;
  placeholder: string;
}

export function StringListSection({
  title,
  description,
  items,
  onAdd,
  onRemove,
  addLabel,
  placeholder,
}: StringListSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{item}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove(index)}
                  aria-label={`Remove ${item}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            {addLabel}
          </Button>
        </CardContent>
      </Card>

      <AddStringItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={addLabel}
        description={`Add a new entry to ${title.toLowerCase()}.`}
        fieldLabel={title.replace(/^Default /, "")}
        placeholder={placeholder}
        onAdd={onAdd}
      />
    </>
  );
}

interface FeatureCatalogSectionProps {
  features: Array<{
    id: string;
    name: string;
    unit: string;
    unitPrice: number;
    nodeNameDBId: string;
  }>;
  nodeNameDBs: Array<{ id: string; name: string }>;
  onUpdate: (
    features: Array<{
      id: string;
      name: string;
      unit: string;
      unitPrice: number;
      nodeNameDBId: string;
    }>,
  ) => void;
}

export function FeatureCatalogSection({
  features,
  nodeNameDBs,
  onUpdate,
}: FeatureCatalogSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("Subscribers");
  const [unitPrice, setUnitPrice] = useState("");
  const [nodeNameDBId, setNodeNameDBId] = useState(nodeNameDBs[0]?.id ?? "");

  const getDbName = (id: string) =>
    nodeNameDBs.find((d) => d.id === id)?.name ?? id;

  useEffect(() => {
    if (!dialogOpen) return;
    setName("");
    setUnit("Subscribers");
    setUnitPrice("");
    setNodeNameDBId(nodeNameDBs[0]?.id ?? "");
  }, [dialogOpen, nodeNameDBs]);

  const handleAdd = () => {
    const trimmedName = name.trim();
    const parsedPrice = parseFloat(unitPrice);
    if (!trimmedName || !unit.trim() || Number.isNaN(parsedPrice) || !nodeNameDBId) {
      return;
    }

    onUpdate([
      ...features,
      {
        id: `feature-${Date.now()}`,
        name: trimmedName,
        unit: unit.trim(),
        unitPrice: parsedPrice,
        nodeNameDBId,
      },
    ]);
    setDialogOpen(false);
  };

  const canSubmit =
    !!name.trim() &&
    !!unit.trim() &&
    unitPrice !== "" &&
    !Number.isNaN(parseFloat(unitPrice)) &&
    !!nodeNameDBId;

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Feature Catalog</CardTitle>
          <CardDescription>
            Configure telecom features and their fixed unit prices. Each feature is
            associated with a Node Name DB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Feature Name</th>
                  <th className="px-3 py-2 text-left font-medium">Unit</th>
                  <th className="px-3 py-2 text-right font-medium">Unit Price</th>
                  <th className="px-3 py-2 text-left font-medium">Node Name DB</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {features.map((f, index) => (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{f.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{f.unit}</td>
                    <td className="px-3 py-2 text-right">${f.unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {getDbName(f.nodeNameDBId)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          onUpdate(features.filter((_, i) => i !== index))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Feature
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Feature</DialogTitle>
            <DialogDescription>
              Define a telecom feature, its unit of measure, fixed unit price, and
              associated Node Name DB.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="feature-name">Feature name</Label>
              <Input
                id="feature-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CSF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-unit">Unit</Label>
              <Input
                id="feature-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Subscribers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-price">Unit price ($)</Label>
              <Input
                id="feature-price"
                type="number"
                min={0}
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="e.g. 2.50"
              />
            </div>
            <div className="space-y-2">
              <Label>Node Name DB</Label>
              <Select
                value={nodeNameDBId}
                onValueChange={(v) => setNodeNameDBId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Node Name DB" />
                </SelectTrigger>
                <SelectContent>
                  {nodeNameDBs.map((db) => (
                    <SelectItem key={db.id} value={db.id}>
                      {db.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!canSubmit}>
              Add Feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NodeNameDBMappingSection({
  mapping,
  nodeNames,
  nodeNameDBs,
  onUpdate,
}: {
  mapping: Record<string, string[]>;
  nodeNames: string[];
  nodeNameDBs: Array<{ id: string; name: string }>;
  onUpdate: (mapping: Record<string, string[]>) => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Node Name DB Mapping</CardTitle>
        <CardDescription>
          Configure which Node Name DBs belong to each telecom node. In future
          versions this will be stored in the database and managed by administrators.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {nodeNames.map((nodeName) => (
          <div key={nodeName} className="space-y-2">
            <p className="text-sm font-medium">{nodeName}</p>
            <div className="flex flex-wrap gap-2">
              {nodeNameDBs.map((db) => {
                const selected = mapping[nodeName]?.includes(db.id) ?? false;
                return (
                  <Button
                    key={db.id}
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const current = mapping[nodeName] ?? [];
                      const next = selected
                        ? current.filter((id) => id !== db.id)
                        : [...current, db.id];
                      onUpdate({ ...mapping, [nodeName]: next });
                    }}
                  >
                    {db.name}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
