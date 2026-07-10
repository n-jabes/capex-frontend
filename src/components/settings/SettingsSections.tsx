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
          <Label htmlFor="string-item-value" required>
            {fieldLabel}
          </Label>
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

export function CountriesSection({
  countries,
  onAddCountry,
}: {
  countries: Array<{
    id: string;
    name: string;
    projectNames: Array<{ id: string; name: string }>;
  }>;
  onAddCountry: (countryName: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [countryName, setCountryName] = useState("");

  useEffect(() => {
    if (!dialogOpen) return;
    setCountryName("");
  }, [dialogOpen]);

  const handleAdd = () => {
    const trimmedCountry = countryName.trim();
    if (!trimmedCountry) return;
    onAddCountry(trimmedCountry);
    setDialogOpen(false);
  };

  const canSubmit = !!countryName.trim();

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Countries</CardTitle>
          <CardDescription>
            Manage telecom markets in the CAPEX tree. Add project names under each
            country from the CAPEX Tree page using preset or custom names.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {countries.map((country) => (
              <li
                key={country.id}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <p className="font-medium">{country.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {country.projectNames.length > 0
                    ? country.projectNames.map((p) => p.name).join(", ")
                    : "No project names"}
                </p>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Country
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Country</DialogTitle>
            <DialogDescription>
              Create a new country in the CAPEX tree. Project names can be added
              afterward from the CAPEX Tree page.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="country-name" required>
                Country name
              </Label>
              <Input
                id="country-name"
                value={countryName}
                onChange={(e) => setCountryName(e.target.value)}
                placeholder="e.g. Kenya"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!canSubmit}>
              Add Country
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
