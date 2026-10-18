"use client";

import { cn } from "@/lib/utils";
import type { BenchmarkDimension } from "@/lib/benchmarking";

const DIMENSIONS: Array<{ id: BenchmarkDimension; label: string }> = [
  { id: "countries", label: "Countries" },
  { id: "deliveries", label: "Deliveries" },
  { id: "domains", label: "Domains" },
  { id: "vendorNodeNames", label: "Vendor Node Names" },
  { id: "packages", label: "Packages" },
  { id: "licensePackages", label: "License Packages" },
];

export function DimensionPicker({
  value,
  onChange,
}: {
  value: BenchmarkDimension;
  onChange: (next: BenchmarkDimension) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DIMENSIONS.map((dim) => (
        <button
          key={dim.id}
          type="button"
          onClick={() => onChange(dim.id)}
          className={cn(
            "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
            value === dim.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {dim.label}
        </button>
      ))}
    </div>
  );
}
