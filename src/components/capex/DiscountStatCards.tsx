"use client";

import { BadgePercent, DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const statCardClass =
  "gap-0 py-0 shadow-md ring-1 ring-border/50 border border-border/70";

interface DiscountStatCardsProps {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  netTotal: number;
  onDiscountChange: (value: number) => void;
  inputId?: string;
}

export function DiscountStatCards({
  subtotal,
  discountPercent,
  discountAmount,
  netTotal,
  onDiscountChange,
  inputId = "discount-pct",
}: DiscountStatCardsProps) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
      <Card className={statCardClass}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2.5 pb-0 pt-1.5">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Total Price
          </CardTitle>
          <DollarSign className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-2.5 pb-1.5 pt-0">
          <p className="text-sm font-bold leading-none tabular-nums">
            {formatCurrency(subtotal)}
          </p>
        </CardContent>
      </Card>

      <Card className={statCardClass}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2.5 pb-0 pt-1.5">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Discount %
          </CardTitle>
          <Percent className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-2.5 pb-1.5 pt-0">
          <Label htmlFor={inputId} className="sr-only">
            Discount percent
          </Label>
          <Input
            id={inputId}
            type="number"
            min={0}
            max={100}
            step="0.1"
            className="h-7 text-sm"
            value={discountPercent}
            onChange={(event) => {
              const value = parseFloat(event.target.value);
              onDiscountChange(Number.isNaN(value) ? 0 : value);
            }}
          />
        </CardContent>
      </Card>

      <Card className={statCardClass}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2.5 pb-0 pt-1.5">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Discount Amount
          </CardTitle>
          <BadgePercent className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-2.5 pb-1.5 pt-0">
          <p className="text-sm font-bold leading-none tabular-nums">
            {formatCurrency(discountAmount)}
          </p>
        </CardContent>
      </Card>

      <Card
        className={cn(
          statCardClass,
          "border-primary/30 bg-primary/5 ring-primary/20",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2.5 pb-0 pt-1.5">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            After Discount
          </CardTitle>
          <DollarSign className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-2.5 pb-1.5 pt-0">
          <p className="text-sm font-bold leading-none tabular-nums">
            {formatCurrency(netTotal)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
