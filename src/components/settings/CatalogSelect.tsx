"use client";

import { resolveCatalogLabel } from "@/lib/catalog-display";
import type { CatalogItem } from "@/types/capex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CatalogSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  items: CatalogItem[];
  placeholder?: string;
  disabled?: boolean;
}

export function CatalogSelect({
  label,
  required,
  value,
  onValueChange,
  items,
  placeholder = "Select...",
  disabled,
}: CatalogSelectProps) {
  const displayValue = resolveCatalogLabel(items, value);

  return (
    <div className="space-y-2">
      <Label required={required}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => onValueChange(next ?? "")}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {displayValue || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
