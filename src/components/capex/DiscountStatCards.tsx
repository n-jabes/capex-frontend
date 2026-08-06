"use client";

import { BadgePercent, DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";

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
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-0 pt-2">
          <CardTitle className="text-[11px] font-medium text-muted-foreground">
            Total Price
          </CardTitle>
          <DollarSign className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-2 pt-0.5">
          <p className="text-base font-bold leading-tight">
            {formatCurrency(subtotal)}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-0 pt-2">
          <CardTitle className="text-[11px] font-medium text-muted-foreground">
            Discount %
          </CardTitle>
          <Percent className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-2 pt-0.5">
          <Label htmlFor={inputId} className="sr-only">
            Discount percent
          </Label>
          <Input
            id={inputId}
            type="number"
            min={0}
            max={100}
            step="0.1"
            className="h-8"
            value={discountPercent}
            onChange={(event) => {
              const value = parseFloat(event.target.value);
              onDiscountChange(Number.isNaN(value) ? 0 : value);
            }}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-0 pt-2">
          <CardTitle className="text-[11px] font-medium text-muted-foreground">
            Discount Amount
          </CardTitle>
          <BadgePercent className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-2 pt-0.5">
          <p className="text-base font-bold leading-tight">
            {formatCurrency(discountAmount)}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-0 pt-2">
          <CardTitle className="text-[11px] font-medium text-muted-foreground">
            After Discount
          </CardTitle>
          <DollarSign className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-2 pt-0.5">
          <p className="text-base font-bold leading-tight">
            {formatCurrency(netTotal)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
