"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_APP_SETTINGS } from "@/data/seedCatalogs";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  CapexApiError,
} from "@/lib/api/client";
import {
  getMyCatalogs,
  getPortfolio,
  listPortfolios,
  updatePortfolioTree,
} from "@/lib/api/capex-api";
import { isCapexApiConfigured } from "@/lib/api/config";
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
const TREE_SAVE_DEBOUNCE_MS = 800;

export type PasteResult =
  | { ok: true; node: CapexTreeNode }
  | { ok: false; reason: string };

export type CapexSyncStatus =
  | "local"
  | "loading"
  | "synced"
  | "saving"
  | "error"
  | "conflict";

interface CapexContextValue {
  tree: CapexTreeNode[];
  settings: AppSettings;
  selectedNode: SelectedNode | null;
  isHydrated: boolean;
  clipboard: CapexClipboardPayload | null;
  syncStatus: CapexSyncStatus;
  syncError: string | null;
  portfolioId: string | null;
  portfolioVersion: number | null;
  apiEnabled: boolean;
  reloadFromServer: () => Promise<void>;
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

function normalizeTree(nodes: CapexTreeNode[]): CapexTreeNode[] {
  let next = nodes;
  if (treeNeedsHierarchyMigration(next)) next = migrateTreeHierarchy(next);
  if (treeNeedsLicenseYearsMigration(next)) next = migrateLicenseYearsTree(next);
  return next;
}

function normalizeSettings(value: AppSettings): AppSettings {
  let next = value;
  if (settingsNeedCatalogMigration(next)) next = normalizeAppSettings(next);
  if (relationshipsAreEmpty(next.relationships)) {
    next = {
      ...next,
      relationships: withDefaultRelationshipsIfEmpty(next.relationships),
    };
  }
  return next;
}

export function CapexProvider({ children }: { children: ReactNode }) {
  const apiEnabled = isCapexApiConfigured();

  const [treeLocal, setTreeLocal, treeHydratedLocal] = useLocalStorage<
    CapexTreeNode[]
  >(TREE_KEY, createInitialTree());
  const [settingsLocal, setSettingsLocal, settingsHydratedLocal] =
    useLocalStorage<AppSettings>(SETTINGS_KEY, DEFAULT_APP_SETTINGS);

  const [treeApi, setTreeApi] = useState<CapexTreeNode[]>(createInitialTree());
  const [settingsApi, setSettingsApi] =
    useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [apiHydrated, setApiHydrated] = useState(false);

  const [selectedNode, setSelectedNode] = useLocalStorage<SelectedNode | null>(
    "capex-selected-node",
    null,
  );
  const [clipboard, setClipboard] = useState<CapexClipboardPayload | null>(
    null,
  );

  const [syncStatus, setSyncStatus] = useState<CapexSyncStatus>(
    apiEnabled ? "loading" : "local",
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [portfolioVersion, setPortfolioVersion] = useState<number | null>(null);

  const skipPersistRef = useRef(false);
  const versionRef = useRef<number | null>(null);
  const portfolioIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const tree = apiEnabled ? treeApi : treeLocal;
  const settings = apiEnabled ? settingsApi : settingsLocal;
  const setTree = apiEnabled ? setTreeApi : setTreeLocal;
  const setSettings = apiEnabled ? setSettingsApi : setSettingsLocal;
  const isHydrated = apiEnabled
    ? apiHydrated
    : treeHydratedLocal && settingsHydratedLocal;

  const loadFromApi = useCallback(async () => {
    setSyncStatus("loading");
    setSyncError(null);
    try {
      const [summaries, catalogBundle] = await Promise.all([
        listPortfolios(),
        getMyCatalogs(),
      ]);
      if (summaries.length === 0) {
        throw new Error(
          "No portfolio found. Run backend seed:assign for this user email.",
        );
      }
      const detail = await getPortfolio(summaries[0].id);
      const rawTree = Array.isArray(detail.tree) ? detail.tree : [];
      skipPersistRef.current = true;
      setTreeApi(normalizeTree(rawTree));
      setSettingsApi(
        normalizeSettings({
          catalogs: catalogBundle.catalogs,
          relationships: catalogBundle.relationships,
        }),
      );
      setPortfolioId(detail.id);
      setPortfolioVersion(detail.version);
      portfolioIdRef.current = detail.id;
      versionRef.current = detail.version;
      setApiHydrated(true);
      setSyncStatus("synced");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load Capex API data";
      setSyncError(message);
      setSyncStatus("error");
      setApiHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!apiEnabled) return;
    void loadFromApi();
  }, [apiEnabled, loadFromApi]);

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

  // Local-mode migrations (API trees/settings are normalized on load).
  useEffect(() => {
    if (apiEnabled || !settingsHydratedLocal) return;
    if (!settingsNeedCatalogMigration(settingsLocal)) return;
    setSettingsLocal(normalizeAppSettings(settingsLocal));
  }, [apiEnabled, settingsHydratedLocal, settingsLocal, setSettingsLocal]);

  useEffect(() => {
    if (apiEnabled || !settingsHydratedLocal) return;
    if (!relationshipsAreEmpty(settingsLocal.relationships)) return;
    setSettingsLocal((prev) => ({
      ...prev,
      relationships: withDefaultRelationshipsIfEmpty(prev.relationships),
    }));
  }, [
    apiEnabled,
    settingsHydratedLocal,
    settingsLocal.relationships,
    setSettingsLocal,
  ]);

  useEffect(() => {
    if (apiEnabled || !treeHydratedLocal) return;
    if (!treeNeedsHierarchyMigration(treeLocal)) return;
    setTreeLocal(migrateTreeHierarchy(treeLocal));
    setSelectedNode((prev) => {
      if (!prev) return prev;
      const migratedType = migrateSelectedNodeType(prev.type as string);
      return migratedType ? { ...prev, type: migratedType } : null;
    });
  }, [
    apiEnabled,
    treeHydratedLocal,
    treeLocal,
    setTreeLocal,
    setSelectedNode,
  ]);

  useEffect(() => {
    if (apiEnabled || !treeHydratedLocal) return;
    if (!treeNeedsLicenseYearsMigration(treeLocal)) return;
    setTreeLocal(migrateLicenseYearsTree(treeLocal));
    setSelectedNode((prev) => {
      if (!prev) return prev;
      if (prev.type === "package") return null;
      return prev;
    });
  }, [
    apiEnabled,
    treeHydratedLocal,
    treeLocal,
    setTreeLocal,
    setSelectedNode,
  ]);

  // Debounced tree persistence to API.
  useEffect(() => {
    if (!apiEnabled || !apiHydrated) return;
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    const id = portfolioIdRef.current;
    const version = versionRef.current;
    if (!id || version == null) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    setSyncStatus((prev) => (prev === "conflict" ? prev : "saving"));

    saveTimerRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const updated = await updatePortfolioTree(id, {
            tree: treeApi,
            version,
          });
          versionRef.current = updated.version;
          setPortfolioVersion(updated.version);
          setSyncStatus("synced");
          setSyncError(null);
        } catch (error) {
          if (error instanceof CapexApiError && error.status === 409) {
            setSyncStatus("conflict");
            setSyncError(
              "This portfolio changed elsewhere. Reloading the latest version.",
            );
            try {
              const latest = await getPortfolio(id);
              skipPersistRef.current = true;
              setTreeApi(
                normalizeTree(Array.isArray(latest.tree) ? latest.tree : []),
              );
              versionRef.current = latest.version;
              setPortfolioVersion(latest.version);
              setSyncStatus("conflict");
            } catch (reloadError) {
              setSyncStatus("error");
              setSyncError(
                reloadError instanceof Error
                  ? reloadError.message
                  : "Version conflict and reload failed",
              );
            }
            return;
          }
          setSyncStatus("error");
          setSyncError(
            error instanceof Error ? error.message : "Failed to save portfolio",
          );
        }
      })();
    }, TREE_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [apiEnabled, apiHydrated, treeApi]);

  const reloadFromServer = useCallback(async () => {
    if (!apiEnabled) return;
    await loadFromApi();
  }, [apiEnabled, loadFromApi]);

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
        updateNodeInTree(prev, nodeId, (node) => ({
          ...node,
          packageData: data,
        })),
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
            if (
              navigator.clipboard.write &&
              typeof ClipboardItem !== "undefined"
            ) {
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
      syncStatus,
      syncError,
      portfolioId,
      portfolioVersion,
      apiEnabled,
      reloadFromServer,
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
      syncStatus,
      syncError,
      portfolioId,
      portfolioVersion,
      apiEnabled,
      reloadFromServer,
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
