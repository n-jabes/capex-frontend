import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type {
  BenchmarkColumn,
  BenchmarkComparison,
  BenchmarkMetricDefinition,
  BenchmarkMetricFormat,
  BenchmarkMetricKey,
} from "./types";
import { numericValue } from "./compare";

export function formatMetricValue(
  value: string | number | null | undefined,
  format: BenchmarkMetricFormat,
): string {
  if (value == null || value === "") return "—";
  if (format === "text") return String(value);
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (format === "currency") return formatCurrency(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
}

export function minMaxForMetric(
  columns: BenchmarkColumn[],
  key: BenchmarkMetricKey,
): { min: number | null; max: number | null } {
  const nums = columns
    .map((c) => numericValue(c, key))
    .filter((n): n is number => n != null);
  if (nums.length === 0) return { min: null, max: null };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

export function deltaVsBaseline(
  column: BenchmarkColumn,
  baseline: BenchmarkColumn | null,
  key: BenchmarkMetricKey,
): { absolute: number | null; percent: number | null } {
  if (!baseline) return { absolute: null, percent: null };
  const value = numericValue(column, key);
  const base = numericValue(baseline, key);
  if (value == null || base == null) return { absolute: null, percent: null };
  const absolute = value - base;
  const percent = base !== 0 ? (absolute / base) * 100 : null;
  return { absolute, percent };
}

export function comparisonToCsv(comparison: BenchmarkComparison): string {
  const header = [
    "Metric",
    ...comparison.columns.map((c) => csvEscape(c.label)),
  ].join(",");
  const rows = comparison.metrics.map((metric) => {
    const cells = comparison.columns.map((col) =>
      csvEscape(formatMetricValue(col.values[metric.key], metric.format)),
    );
    return [csvEscape(metric.label), ...cells].join(",");
  });
  return [header, ...rows].join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function primaryMetrics(
  metrics: BenchmarkMetricDefinition[],
): BenchmarkMetricDefinition[] {
  const primary = metrics.filter((m) => m.primary);
  return primary.length > 0 ? primary : metrics.slice(0, 1);
}
