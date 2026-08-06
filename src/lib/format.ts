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

/** Red text when same-package C. util sum across sibling VNNs exceeds N+1 threshold. */
export function currentUtilHotClass(isHot: boolean): string {
  return isHot ? "font-medium text-red-600 dark:text-red-400" : "";
}
