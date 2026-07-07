import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderChartProps {
  title: string;
  description?: string;
}

export function PlaceholderChart({ title, description }: PlaceholderChartProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-end justify-around gap-2 rounded-md border border-dashed bg-muted/20 p-4">
          {[65, 45, 80, 55, 70, 40, 90].map((h, i) => (
            <div
              key={i}
              className="w-full max-w-8 rounded-t bg-primary/20"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
