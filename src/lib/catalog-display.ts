import type { CatalogItem } from "@/types/capex";

/** Strip catalog ID prefix and produce a readable label. */
export function humanizeCatalogId(id: string): string {
  const stripped = id.replace(/^(proj|del|dom|node|vendor|vnn|pkg)-/, "");
  return stripped
    .split("-")
    .map((part) => {
      if (!part) return part;
      if (part.length <= 4 || part === part.toUpperCase()) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("-")
    .replace(/-/g, (match, offset, str) => {
      const before = str.slice(0, offset);
      if (before.includes("&")) return " ";
      return match;
    });
}

export function looksLikeCatalogId(value: string): boolean {
  return /^(proj|del|dom|node|vendor|vnn|pkg)-[a-z0-9-]+$/.test(value);
}

/** Resolve a display label from a catalog list — never shows raw IDs when avoidable. */
export function resolveCatalogLabel(
  items: CatalogItem[],
  id: string | undefined,
): string {
  if (!id) return "";
  const item = items.find((entry) => entry.id === id);
  if (!item) return humanizeCatalogId(id);
  return displayCatalogName(item);
}

export function displayCatalogName(item: CatalogItem): string {
  if (
    item.name &&
    item.name !== item.id &&
    !looksLikeCatalogId(item.name)
  ) {
    return item.name;
  }
  return humanizeCatalogId(item.id);
}

export function fixCatalogItemName(item: CatalogItem): CatalogItem {
  const name = displayCatalogName(item);
  return name === item.name ? item : { ...item, name };
}
