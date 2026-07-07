"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CapexTreeNode } from "@/types/capex";
import {
  buildDefaultExpansionState,
  collapseExpansionToCountries,
  collapseExpansionToDirectChildren,
  type TreeExpansionState,
} from "@/lib/tree-utils";

interface TreeExpansionContextValue {
  isExpanded: (nodeId: string) => boolean;
  setExpanded: (nodeId: string, expanded: boolean) => void;
  collapseAllToCountries: () => void;
  collapseNodeToDirectChildren: (node: CapexTreeNode) => void;
}

const TreeExpansionContext = createContext<TreeExpansionContextValue | null>(
  null,
);

export function TreeExpansionProvider({
  tree,
  children,
}: {
  tree: CapexTreeNode[];
  children: ReactNode;
}) {
  const [expandedMap, setExpandedMap] = useState<TreeExpansionState>(() =>
    buildDefaultExpansionState(tree),
  );

  useEffect(() => {
    setExpandedMap((prev) => {
      const next = { ...prev };
      let changed = false;

      const visit = (nodes: CapexTreeNode[], depth: number) => {
        for (const node of nodes) {
          if (!(node.id in next)) {
            next[node.id] = depth < 3;
            changed = true;
          }
          visit(node.children, depth + 1);
        }
      };

      visit(tree, 0);
      return changed ? next : prev;
    });
  }, [tree]);

  const isExpanded = useCallback(
    (nodeId: string) => expandedMap[nodeId] ?? false,
    [expandedMap],
  );

  const setExpanded = useCallback((nodeId: string, expanded: boolean) => {
    setExpandedMap((prev) => {
      if (prev[nodeId] === expanded) return prev;
      return { ...prev, [nodeId]: expanded };
    });
  }, []);

  const collapseAllToCountries = useCallback(() => {
    setExpandedMap(collapseExpansionToCountries(tree));
  }, [tree]);

  const collapseNodeToDirectChildren = useCallback((node: CapexTreeNode) => {
    setExpandedMap((prev) => ({
      ...prev,
      ...collapseExpansionToDirectChildren(node),
    }));
  }, []);

  const value = useMemo(
    () => ({
      isExpanded,
      setExpanded,
      collapseAllToCountries,
      collapseNodeToDirectChildren,
    }),
    [
      isExpanded,
      setExpanded,
      collapseAllToCountries,
      collapseNodeToDirectChildren,
    ],
  );

  return (
    <TreeExpansionContext.Provider value={value}>
      {children}
    </TreeExpansionContext.Provider>
  );
}

export function useTreeExpansion() {
  const ctx = useContext(TreeExpansionContext);
  if (!ctx) {
    throw new Error("useTreeExpansion must be used within TreeExpansionProvider");
  }
  return ctx;
}
