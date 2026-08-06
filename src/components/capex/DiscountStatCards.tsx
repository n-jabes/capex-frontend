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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Total Price
          </CardTitle>
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xl font-bold">{formatCurrency(subtotal)}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Discount %
          </CardTitle>
          <Percent className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-3">
          <Label htmlFor={inputId} className="sr-only">
            Discount percent
          </Label>
          <Input
            id={inputId}
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={discountPercent}
            onChange={(event) => {
              const value = parseFloat(event.target.value);
              onDiscountChange(Number.isNaN(value) ? 0 : value);
            }}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Discount Amount
          </CardTitle>
          <BadgePercent className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xl font-bold">{formatCurrency(discountAmount)}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-1 pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            After Discount
          </CardTitle>
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xl font-bold">{formatCurrency(netTotal)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
