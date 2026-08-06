export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Green when post-purchase util improves (drops); red when it worsens. */
export function expansionUtilToneClass(
  expansionUtil: number,
  currentUtil: number,
): string {
  if (expansionUtil < currentUtil) {
    return "font-medium text-emerald-600 dark:text-emerald-400";
  }
  if (expansionUtil > currentUtil) {
    return "font-medium text-red-600 dark:text-red-400";
  }
  return "";
}
