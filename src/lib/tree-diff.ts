import type { CapexTreeNode } from "@/types/capex";

export type TreeOp =
  | { op: "replaceTree"; tree: CapexTreeNode[] }
  | { op: "remove"; id: string }
  | { op: "upsertUnder"; parentId: string | null; node: CapexTreeNode }
  | {
      op: "patch";
      id: string;
      fields: Partial<
        Pick<
          CapexTreeNode,
          | "name"
          | "siteName"
          | "discountPercent"
          | "licenseYears"
          | "packageData"
          | "catalogId"
        >
      >;
    };

const MAX_OPS_BEFORE_FULL_REPLACE = 80;

type FlatEntry = {
  parentId: string | null;
  node: CapexTreeNode;
};

function flatten(
  nodes: CapexTreeNode[],
  parentId: string | null,
  out: Map<string, FlatEntry>,
) {
  for (const node of nodes) {
    out.set(node.id, { parentId, node });
    if (node.children?.length) {
      flatten(node.children, node.id, out);
    }
  }
}

function shallowEqual(a: CapexTreeNode, b: CapexTreeNode) {
  return (
    a.name === b.name &&
    a.type === b.type &&
    a.catalogId === b.catalogId &&
    a.siteName === b.siteName &&
    a.discountPercent === b.discountPercent &&
    JSON.stringify(a.licenseYears ?? null) ===
      JSON.stringify(b.licenseYears ?? null) &&
    JSON.stringify(a.packageData ?? null) ===
      JSON.stringify(b.packageData ?? null)
  );
}

function cloneNode(node: CapexTreeNode): CapexTreeNode {
  return structuredClone(node);
}

/** Diff previous synced tree → current tree into incremental ops. */
export function diffCapexTrees(
  prev: CapexTreeNode[],
  next: CapexTreeNode[],
): TreeOp[] {
  const prevMap = new Map<string, FlatEntry>();
  const nextMap = new Map<string, FlatEntry>();
  flatten(prev, null, prevMap);
  flatten(next, null, nextMap);

  const ops: TreeOp[] = [];

  // Removals (leaf-first by walking next-missing ids; server removes whole subtree).
  for (const id of prevMap.keys()) {
    if (!nextMap.has(id)) {
      ops.push({ op: "remove", id });
    }
  }

  // Additions: only top-most new subtrees (parent already existed or is root).
  for (const [id, entry] of nextMap) {
    if (prevMap.has(id)) continue;
    const parentId = entry.parentId;
    const parentExisted =
      parentId == null || (prevMap.has(parentId) && nextMap.has(parentId));
    const parentAlsoNew = parentId != null && !prevMap.has(parentId);
    if (parentAlsoNew) continue; // covered by parent upsert
    if (parentExisted || parentId == null) {
      ops.push({
        op: "upsertUnder",
        parentId,
        node: cloneNode(entry.node),
      });
    }
  }

  // Moves + patches for surviving ids.
  for (const [id, nextEntry] of nextMap) {
    const prevEntry = prevMap.get(id);
    if (!prevEntry) continue;

    if (prevEntry.parentId !== nextEntry.parentId) {
      ops.push({
        op: "upsertUnder",
        parentId: nextEntry.parentId,
        node: cloneNode(nextEntry.node),
      });
      continue;
    }

    if (!shallowEqual(prevEntry.node, nextEntry.node)) {
      ops.push({
        op: "patch",
        id,
        fields: {
          name: nextEntry.node.name,
          siteName: nextEntry.node.siteName,
          discountPercent: nextEntry.node.discountPercent,
          licenseYears: nextEntry.node.licenseYears,
          packageData: nextEntry.node.packageData,
          catalogId: nextEntry.node.catalogId,
        },
      });
    }
  }

  return ops;
}

export function shouldUseFullTreeReplace(ops: TreeOp[]) {
  if (ops.length > MAX_OPS_BEFORE_FULL_REPLACE) return true;
  // A single huge upsert (e.g. paste large country) is still better as ops;
  // only force full replace when volume of discrete edits is high.
  return false;
}

export function cloneTree(tree: CapexTreeNode[]): CapexTreeNode[] {
  return structuredClone(tree);
}
