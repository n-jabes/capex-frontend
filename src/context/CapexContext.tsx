"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { DEFAULT_PROJECT_NAMES } from "@/data/defaultProjectNames";
import { DEFAULT_DELIVERIES } from "@/data/defaultDeliveries";
import { DEFAULT_NETWORK_DOMAINS } from "@/data/defaultNetworkDomains";
import { DEFAULT_NODE_NAMES } from "@/data/defaultNodeNames";
import { FEATURES } from "@/data/features";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type {
  AppSettings,
  CapexTreeNode,
  FeaturePurchaseData,
  SelectedNode,
} from "@/types/capex";
import {
  addChildToNode,
  createInitialTree,
  deleteNodeFromTree,
  findNode,
  generateId,
  migrateAppSettings,
  migrateTreeNodeTypes,
  updateNodeInTree,
} from "@/lib/tree-utils";

const TREE_KEY = "capex-tree-data";
const SETTINGS_KEY = "capex-app-settings";

const defaultSettings: AppSettings = {
  defaultProjectNames: [...DEFAULT_PROJECT_NAMES],
  defaultDeliveries: [...DEFAULT_DELIVERIES],
  defaultNetworkDomains: [...DEFAULT_NETWORK_DOMAINS],
  defaultNodeNames: [...DEFAULT_NODE_NAMES],
  nodeNameDBMapping: {
    MME: ["sgsn-mme"],
    UDM: ["udm"],
    PCRF: ["pcrf"],
    PGW: ["pgw"],
    SGSN: ["sgsn-mme"],
  },
  features: FEATURES,
};

interface CapexContextValue {
  tree: CapexTreeNode[];
  settings: AppSettings;
  selectedNode: SelectedNode | null;
  isHydrated: boolean;
  setSelectedNode: (node: SelectedNode | null) => void;
  addChild: (parentId: string, child: CapexTreeNode) => void;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  addFeaturePurchases: (
    nodeNameDBId: string,
    parentTreeNodeId: string,
    purchases: Array<{ featureId: string; purchase: FeaturePurchaseData }>,
  ) => void;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  addCountry: (countryName: string) => void;
}

const CapexContext = createContext<CapexContextValue | null>(null);

export function CapexProvider({ children }: { children: ReactNode }) {
  const [tree, setTree, treeHydrated] = useLocalStorage<CapexTreeNode[]>(
    TREE_KEY,
    createInitialTree(),
  );
  const [settings, setSettings, settingsHydrated] = useLocalStorage<AppSettings>(
    SETTINGS_KEY,
    defaultSettings,
  );
  const [selectedNode, setSelectedNode] = useLocalStorage<SelectedNode | null>(
    "capex-selected-node",
    null,
  );

  const isHydrated = treeHydrated && settingsHydrated;

  useEffect(() => {
    if (!settingsHydrated) return;
    const legacy = settings as AppSettings & { defaultCompanies?: string[] };
    const needsMigration =
      !legacy.defaultProjectNames || legacy.defaultCompanies !== undefined;
    if (!needsMigration) return;
    setSettings(migrateAppSettings(legacy, [...DEFAULT_PROJECT_NAMES]));
  }, [settingsHydrated, settings, setSettings]);

  useEffect(() => {
    if (!treeHydrated) return;
    const migrated = migrateTreeNodeTypes(tree);
    const hasLegacyCompany = JSON.stringify(tree).includes('"type":"company"');
    if (!hasLegacyCompany) return;
    setTree(migrated);
    setSelectedNode((prev) =>
      prev && (prev.type as string) === "company"
        ? { ...prev, type: "projectName" }
        : prev,
    );
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

  const addFeaturePurchases = useCallback(
    (
      nodeNameDBTreeNodeId: string,
      _parentTreeNodeId: string,
      purchases: Array<{ featureId: string; purchase: FeaturePurchaseData }>,
    ) => {
      setTree((prev) => {
        const dbNode = findNode(prev, nodeNameDBTreeNodeId);
        if (!dbNode) return prev;

        const existingFeatureIds = new Set(
          dbNode.children.filter((c) => c.featureId).map((c) => c.featureId),
        );

        let updated = prev;
        for (const { featureId, purchase } of purchases) {
          const catalogFeature = settings.features.find((f) => f.id === featureId);
          if (!catalogFeature) continue;

          const existing = dbNode.children.find((c) => c.featureId === featureId);
          if (existing) {
            updated = updateNodeInTree(updated, existing.id, (node) => ({
              ...node,
              purchase,
            }));
          } else if (!existingFeatureIds.has(featureId)) {
            updated = addChildToNode(updated, nodeNameDBTreeNodeId, {
              id: generateId(),
              type: "feature",
              name: catalogFeature.name,
              featureId,
              purchase,
              children: [],
            });
            existingFeatureIds.add(featureId);
          }
        }
        return updated;
      });
    },
    [setTree, settings.features],
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
      addFeaturePurchases,
      updateSettings,
      addCountry,
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
      addFeaturePurchases,
      updateSettings,
      addCountry,
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
