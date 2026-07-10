"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { DEFAULT_APP_SETTINGS } from "@/data/seedCatalogs";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  normalizeAppSettings,
  settingsNeedCatalogMigration,
} from "@/lib/catalog-utils";
import {
  relationshipsAreEmpty,
  withDefaultRelationshipsIfEmpty,
} from "@/lib/relationship-utils";
import type { AppSettings, CapexTreeNode, PackagePurchaseData, SelectedNode } from "@/types/capex";
import {
  addChildToNode,
  createInitialTree,
  deleteNodeFromTree,
  generateId,
  migrateSelectedNodeType,
  migrateTreeHierarchy,
  treeNeedsHierarchyMigration,
  updateNodeInTree,
} from "@/lib/tree-utils";

const TREE_KEY = "capex-tree-data";
const SETTINGS_KEY = "capex-app-settings";

interface CapexContextValue {
  tree: CapexTreeNode[];
  settings: AppSettings;
  selectedNode: SelectedNode | null;
  isHydrated: boolean;
  setSelectedNode: (node: SelectedNode | null) => void;
  addChild: (parentId: string, child: CapexTreeNode) => void;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  addCountry: (countryName: string) => void;
  updatePackageData: (nodeId: string, data: PackagePurchaseData) => void;
  addChildren: (parentId: string, children: CapexTreeNode[]) => void;
}

const CapexContext = createContext<CapexContextValue | null>(null);

export function CapexProvider({ children }: { children: ReactNode }) {
  const [tree, setTree, treeHydrated] = useLocalStorage<CapexTreeNode[]>(
    TREE_KEY,
    createInitialTree(),
  );
  const [settings, setSettings, settingsHydrated] = useLocalStorage<AppSettings>(
    SETTINGS_KEY,
    DEFAULT_APP_SETTINGS,
  );
  const [selectedNode, setSelectedNode] = useLocalStorage<SelectedNode | null>(
    "capex-selected-node",
    null,
  );

  const isHydrated = treeHydrated && settingsHydrated;

  useEffect(() => {
    if (!settingsHydrated) return;
    if (!settingsNeedCatalogMigration(settings)) return;
    setSettings(normalizeAppSettings(settings));
  }, [settingsHydrated, settings, setSettings]);

  useEffect(() => {
    if (!settingsHydrated) return;
    if (!relationshipsAreEmpty(settings.relationships)) return;
    setSettings((prev) => ({
      ...prev,
      relationships: withDefaultRelationshipsIfEmpty(prev.relationships),
    }));
  }, [settingsHydrated, settings.relationships, setSettings]);

  useEffect(() => {
    if (!treeHydrated) return;
    if (!treeNeedsHierarchyMigration(tree)) return;
    setTree(migrateTreeHierarchy(tree));
    setSelectedNode((prev) => {
      if (!prev) return prev;
      const migratedType = migrateSelectedNodeType(prev.type as string);
      return migratedType ? { ...prev, type: migratedType } : null;
    });
  }, [treeHydrated, tree, setTree, setSelectedNode]);

  const addChild = useCallback(
    (parentId: string, child: CapexTreeNode) => {
      setTree((prev) => addChildToNode(prev, parentId, child));
    },
    [setTree],
  );

  const renameNode = useCallback(
    (id: string, name: string) => {
      setTree((prev) =>
        updateNodeInTree(prev, id, (node) => ({ ...node, name })),
      );
      setSelectedNode((prev) => (prev?.id === id ? { ...prev, name } : prev));
    },
    [setTree, setSelectedNode],
  );

  const deleteNode = useCallback(
    (id: string) => {
      setTree((prev) => deleteNodeFromTree(prev, id));
      setSelectedNode((prev) => (prev?.id === id ? null : prev));
    },
    [setTree, setSelectedNode],
  );

  const updateSettings = useCallback(
    (updater: (prev: AppSettings) => AppSettings) => {
      setSettings(updater);
    },
    [setSettings],
  );

  const addCountry = useCallback(
    (countryName: string) => {
      const country: CapexTreeNode = {
        id: generateId(),
        type: "country",
        name: countryName,
        children: [],
      };
      setTree((prev) => [...prev, country]);
    },
    [setTree],
  );

  const updatePackageData = useCallback(
    (nodeId: string, data: PackagePurchaseData) => {
      setTree((prev) =>
        updateNodeInTree(prev, nodeId, (node) => ({ ...node, packageData: data })),
      );
    },
    [setTree],
  );

  const addChildren = useCallback(
    (parentId: string, children: CapexTreeNode[]) => {
      if (children.length === 0) return;
      setTree((prev) => {
        let next = prev;
        for (const child of children) {
          next = addChildToNode(next, parentId, child);
        }
        return next;
      });
    },
    [setTree],
  );

  const value = useMemo(
    () => ({
      tree,
      settings,
      selectedNode,
      isHydrated,
      setSelectedNode,
      addChild,
      renameNode,
      deleteNode,
      updateSettings,
      addCountry,
      updatePackageData,
      addChildren,
    }),
    [
      tree,
      settings,
      selectedNode,
      isHydrated,
      setSelectedNode,
      addChild,
      renameNode,
      deleteNode,
      updateSettings,
      addCountry,
      updatePackageData,
      addChildren,
    ],
  );

  return (
    <CapexContext.Provider value={value}>{children}</CapexContext.Provider>
  );
}

export function useCapex() {
  const ctx = useContext(CapexContext);
  if (!ctx) throw new Error("useCapex must be used within CapexProvider");
  return ctx;
}

export { generateId };
