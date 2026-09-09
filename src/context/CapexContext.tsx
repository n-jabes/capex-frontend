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
import type {
  AppSettings,
  CapexTreeNode,
  LicenseYear,
  PackagePurchaseData,
  SelectedNode,
} from "@/types/capex";
import {
  addChildToNode,
  canPasteSubtree,
  CAPEX_CLIPBOARD_MIME,
  cloneSubtreeWithNewIds,
  createClipboardPayload,
  createInitialTree,
  deleteNodeFromTree,
  findNode,
  generateId,
  getPasteBlockReason,
  isCapexClipboardPayload,
  migrateLicenseYearsTree,
  migrateSelectedNodeType,
  migrateTreeHierarchy,
  summarizeSubtreeForClipboard,
  toSelectedNode,
  treeNeedsHierarchyMigration,
  treeNeedsLicenseYearsMigration,
  updateNodeInTree,
  type CapexClipboardPayload,
} from "@/lib/tree-utils";

const TREE_KEY = "capex-tree-data";
const SETTINGS_KEY = "capex-app-settings";
const CLIPBOARD_KEY = "capex-tree-clipboard";

export type PasteResult =
  | { ok: true; node: CapexTreeNode }
  | { ok: false; reason: string };

interface CapexContextValue {
  tree: CapexTreeNode[];
  settings: AppSettings;
  selectedNode: SelectedNode | null;
  isHydrated: boolean;
  clipboard: CapexClipboardPayload | null;
  setSelectedNode: (node: SelectedNode | null) => void;
  addChild: (parentId: string, child: CapexTreeNode) => void;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  addCountry: (countryName: string) => void;
  updatePackageData: (nodeId: string, data: PackagePurchaseData) => void;
  addChildren: (parentId: string, children: CapexTreeNode[]) => void;
  updateVendorNodeLicenseYears: (
    vendorNodeNameId: string,
    licenseYears: LicenseYear[],
  ) => void;
  updateLicensePackageData: (
    vendorNodeNameId: string,
    packageInstanceId: string,
    data: PackagePurchaseData,
  ) => void;
  removeLicensePackage: (
    vendorNodeNameId: string,
    packageInstanceId: string,
  ) => void;
  updateVendorNodeDiscount: (
    vendorNodeNameId: string,
    discountPercent: number,
  ) => void;
  updateNodeDiscount: (nodeId: string, discountPercent: number) => void;
  copyNode: (id: string) => boolean;
  canPasteInto: (parentId: string | null) => boolean;
  pasteBlockReason: (parentId: string | null) => string | null;
  pasteInto: (parentId: string | null) => PasteResult;
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
  const [clipboard, setClipboard] = useState<CapexClipboardPayload | null>(
    null,
  );

  const isHydrated = treeHydrated && settingsHydrated;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CLIPBOARD_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (isCapexClipboardPayload(parsed)) setClipboard(parsed);
    } catch {
      // ignore corrupt clipboard
    }
  }, []);

  const persistClipboard = useCallback((payload: CapexClipboardPayload | null) => {
    setClipboard(payload);
    try {
      if (payload) {
        sessionStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload));
      } else {
        sessionStorage.removeItem(CLIPBOARD_KEY);
      }
    } catch {
      // ignore quota / private mode
    }
  }, []);

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

  useEffect(() => {
    if (!treeHydrated) return;
    if (!treeNeedsLicenseYearsMigration(tree)) return;
    setTree(migrateLicenseYearsTree(tree));
    setSelectedNode((prev) => {
      if (!prev) return prev;
      if (prev.type === "package") return null;
      return prev;
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
        updateNodeInTree(prev, id, (node) => {
          if (node.type === "vendor") {
            return { ...node, siteName: name };
          }
          return { ...node, name };
        }),
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

  const updateVendorNodeLicenseYears = useCallback(
    (vendorNodeNameId: string, licenseYears: LicenseYear[]) => {
      setTree((prev) =>
        updateNodeInTree(prev, vendorNodeNameId, (node) => ({
          ...node,
          licenseYears,
          children: node.children.filter((child) => child.type !== "package"),
        })),
      );
    },
    [setTree],
  );

  const updateLicensePackageData = useCallback(
    (
      vendorNodeNameId: string,
      packageInstanceId: string,
      data: PackagePurchaseData,
    ) => {
      setTree((prev) =>
        updateNodeInTree(prev, vendorNodeNameId, (node) => ({
          ...node,
          licenseYears: (node.licenseYears ?? []).map((year) => ({
            ...year,
            packages: year.packages.map((pkg) =>
              pkg.id === packageInstanceId
                ? { ...pkg, packageData: data }
                : pkg,
            ),
          })),
        })),
      );
    },
    [setTree],
  );

  const removeLicensePackage = useCallback(
    (vendorNodeNameId: string, packageInstanceId: string) => {
      setTree((prev) =>
        updateNodeInTree(prev, vendorNodeNameId, (node) => ({
          ...node,
          licenseYears: (node.licenseYears ?? []).map((year) => ({
            ...year,
            packages: year.packages.filter(
              (pkg) => pkg.id !== packageInstanceId,
            ),
          })),
        })),
      );
    },
    [setTree],
  );

  const updateNodeDiscount = useCallback(
    (nodeId: string, discountPercent: number) => {
      const clamped = Math.min(100, Math.max(0, discountPercent));
      setTree((prev) =>
        updateNodeInTree(prev, nodeId, (node) => ({
          ...node,
          discountPercent: clamped,
        })),
      );
    },
    [setTree],
  );

  /** @deprecated Prefer updateNodeDiscount */
  const updateVendorNodeDiscount = updateNodeDiscount;

  const copyNode = useCallback(
    (id: string) => {
      const source = findNode(tree, id);
      if (!source || source.type === "package") return false;
      const payload = createClipboardPayload(source);
      persistClipboard(payload);

      const text = summarizeSubtreeForClipboard(source);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        void (async () => {
          try {
            if (navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
              const item = new ClipboardItem({
                "text/plain": new Blob([text], { type: "text/plain" }),
                [CAPEX_CLIPBOARD_MIME]: new Blob([JSON.stringify(payload)], {
                  type: CAPEX_CLIPBOARD_MIME,
                }),
              });
              await navigator.clipboard.write([item]);
              return;
            }
          } catch {
            // Custom MIME unsupported — fall through to plain text
          }
          try {
            await navigator.clipboard.writeText(text);
          } catch {
            // sessionStorage buffer still holds the payload
          }
        })();
      }
      return true;
    },
    [tree, persistClipboard],
  );

  const canPasteInto = useCallback(
    (parentId: string | null) => {
      if (!clipboard) return false;
      if (parentId === null) {
        return canPasteSubtree(null, clipboard.node.type);
      }
      const parent = findNode(tree, parentId);
      if (!parent) return false;
      return canPasteSubtree(parent.type, clipboard.node.type);
    },
    [clipboard, tree],
  );

  const pasteBlockReason = useCallback(
    (parentId: string | null) => {
      if (!clipboard) return "Nothing copied yet.";
      if (parentId === null) {
        return getPasteBlockReason(null, clipboard.node.type);
      }
      const parent = findNode(tree, parentId);
      if (!parent) return "Parent node not found.";
      return getPasteBlockReason(parent.type, clipboard.node.type);
    },
    [clipboard, tree],
  );

  const pasteInto = useCallback(
    (parentId: string | null): PasteResult => {
      if (!clipboard) return { ok: false, reason: "Nothing copied yet." };

      const cloned = cloneSubtreeWithNewIds(clipboard.node);

      if (parentId === null) {
        const reason = getPasteBlockReason(null, clipboard.node.type);
        if (reason) return { ok: false, reason };
        setTree((prev) => [...prev, cloned]);
        setSelectedNode(toSelectedNode(cloned));
        return { ok: true, node: cloned };
      }

      const parent = findNode(tree, parentId);
      if (!parent) return { ok: false, reason: "Parent node not found." };
      const reason = getPasteBlockReason(parent.type, clipboard.node.type);
      if (reason) return { ok: false, reason };

      setTree((prev) => addChildToNode(prev, parentId, cloned));
      setSelectedNode(toSelectedNode(cloned));
      return { ok: true, node: cloned };
    },
    [clipboard, tree, setTree, setSelectedNode],
  );

  const value = useMemo(
    () => ({
      tree,
      settings,
      selectedNode,
      isHydrated,
      clipboard,
      setSelectedNode,
      addChild,
      renameNode,
      deleteNode,
      updateSettings,
      addCountry,
      updatePackageData,
      addChildren,
      updateVendorNodeLicenseYears,
      updateLicensePackageData,
      removeLicensePackage,
      updateVendorNodeDiscount,
      updateNodeDiscount,
      copyNode,
      canPasteInto,
      pasteBlockReason,
      pasteInto,
    }),
    [
      tree,
      settings,
      selectedNode,
      isHydrated,
      clipboard,
      setSelectedNode,
      addChild,
      renameNode,
      deleteNode,
      updateSettings,
      addCountry,
      updatePackageData,
      addChildren,
      updateVendorNodeLicenseYears,
      updateLicensePackageData,
      removeLicensePackage,
      updateVendorNodeDiscount,
      updateNodeDiscount,
      copyNode,
      canPasteInto,
      pasteBlockReason,
      pasteInto,
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
