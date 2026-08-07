"use client";

import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          CV
        </div>
        <h1 className="text-base font-semibold tracking-tight">
        Axian Telecom Capacity and Pricing
        </h1>
      </div>
      <Badge variant="secondary" className="font-normal">
        Demo Version
      </Badge>
    </header>
  );
}
