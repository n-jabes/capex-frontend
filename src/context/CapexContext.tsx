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
import {
  DEFAULT_APP_SETTINGS,
  EMPTY_APP_SETTINGS,
} from "@/data/seedCatalogs";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  CapexApiError,
} from "@/lib/api/client";
import { getMe } from "@/lib/api/auth-api";
import {
  getMyCatalogs,
  getPortfolio,
  importCatalogTemplate,
  listPortfolios,
  putMyCatalogs,
  updatePortfolioTree,
} from "@/lib/api/capex-api";
import { isCapexApiConfigured } from "@/lib/api/config";
import {
  canMutateWorkspace,
  isOwnerOrAdmin,
  type MembershipRole,
} from "@/lib/roles";
import { toast } from "sonner";
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
const CATALOG_SAVE_DEBOUNCE_MS = 900;

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
  catalogVersion: number | null;
  /** Null in local demo mode. */
  membershipRole: MembershipRole | string | null;
  currentUserEmail: string | null;
  /** False for viewer (API mode). Always true in local demo mode. */
  canMutate: boolean;
  /** Owner/admin only (template import, future org admin). */
  canManageOrg: boolean;
  reloadFromServer: () => Promise<void>;
  flushPendingSaves: () => Promise<void>;
  importCapex1Template: (replaceTree?: boolean) => Promise<void>;
  clearSessionState: () => void;
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

function normalizeSettings(
  value: AppSettings,
  options?: { fillDefaultRelationships?: boolean },
): AppSettings {
  let next = value;
  if (settingsNeedCatalogMigration(next)) next = normalizeAppSettings(next);
  if (
    options?.fillDefaultRelationships !== false &&
    relationshipsAreEmpty(next.relationships)
  ) {
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
  >(TREE_KEY, createInitialTree(), { persist: !apiEnabled });
  const [settingsLocal, setSettingsLocal, settingsHydratedLocal] =
    useLocalStorage<AppSettings>(SETTINGS_KEY, DEFAULT_APP_SETTINGS, {
      persist: !apiEnabled,
    });

  const [treeApi, setTreeApi] = useState<CapexTreeNode[]>([]);
  const [settingsApi, setSettingsApi] =
    useState<AppSettings>(EMPTY_APP_SETTINGS);
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
  const [catalogVersion, setCatalogVersion] = useState<number | null>(null);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const skipPersistRef = useRef(false);
  const skipCatalogPersistRef = useRef(false);
  const versionRef = useRef<number | null>(null);
  const catalogVersionRef = useRef<number | null>(null);
  const portfolioIdRef = useRef<string | null>(null);
  const membershipRoleRef = useRef<string | null>(null);
  const settingsApiRef = useRef(settingsApi);
  const treeApiRef = useRef(treeApi);
  const saveTimerRef = useRef<number | null>(null);
  const catalogSaveTimerRef = useRef<number | null>(null);
  const treeSaveInFlightRef = useRef<Promise<void> | null>(null);
  const catalogSaveInFlightRef = useRef<Promise<void> | null>(null);

  const tree = apiEnabled ? treeApi : treeLocal;
  const settings = apiEnabled ? settingsApi : settingsLocal;
  const setTree = apiEnabled ? setTreeApi : setTreeLocal;
  const setSettings = apiEnabled ? setSettingsApi : setSettingsLocal;
  const isHydrated = apiEnabled
    ? apiHydrated
    : treeHydratedLocal && settingsHydratedLocal;

  settingsApiRef.current = settingsApi;
  treeApiRef.current = treeApi;
  membershipRoleRef.current = membershipRole;

  const canMutate = !apiEnabled || canMutateWorkspace(membershipRole);
  const canManageOrg = !apiEnabled || isOwnerOrAdmin(membershipRole);

  const assertCanMutate = useCallback((): boolean => {
    if (!apiEnabled) return true;
    if (canMutateWorkspace(membershipRoleRef.current)) return true;
    toast.error("Read-only workspace", {
      description: "Your role cannot edit catalogs or the CAPEX tree.",
    });
    return false;
  }, [apiEnabled]);

  const loadFromApi = useCallback(async () => {
    setSyncStatus("loading");
    setSyncError(null);
    try {
      const [me, summaries, catalogBundle] = await Promise.all([
        getMe(),
        listPortfolios(),
        getMyCatalogs(),
      ]);
      setMembershipRole(me.role);
      setCurrentUserEmail(me.email);
      membershipRoleRef.current = me.role;
      if (summaries.length === 0) {
        throw new Error(
          "No portfolio found for this account. Try signing out and registering again.",
        );
      }
      const detail = await getPortfolio(summaries[0].id);
      const rawTree = Array.isArray(detail.tree) ? detail.tree : [];
      skipPersistRef.current = true;
      skipCatalogPersistRef.current = true;
      setTreeApi(normalizeTree(rawTree));
      setSettingsApi(
        normalizeSettings(
          {
            catalogs: catalogBundle.catalogs,
            relationships: catalogBundle.relationships,
          },
          { fillDefaultRelationships: false },
        ),
      );
      setPortfolioId(detail.id);
      setPortfolioVersion(detail.version);
      setCatalogVersion(catalogBundle.version);
      portfolioIdRef.current = detail.id;
      versionRef.current = detail.version;
      catalogVersionRef.current = catalogBundle.version;
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

  const persistTreeNow = useCallback(async () => {
    const id = portfolioIdRef.current;
    const version = versionRef.current;
    if (!id || version == null) return;
    const updated = await updatePortfolioTree(id, {
      tree: treeApiRef.current,
      version,
    });
    versionRef.current = updated.version;
    setPortfolioVersion(updated.version);
  }, []);

  const persistCatalogsNow = useCallback(async () => {
    const version = catalogVersionRef.current;
    if (version == null) return;
    const settingsSnapshot = settingsApiRef.current;
    const updated = await putMyCatalogs({
      catalogs: settingsSnapshot.catalogs,
      relationships: settingsSnapshot.relationships,
      version,
    });
    catalogVersionRef.current = updated.version;
    setCatalogVersion(updated.version);
    skipCatalogPersistRef.current = true;
    setSettingsApi(
      normalizeSettings(
        {
          catalogs: updated.catalogs,
          relationships: updated.relationships,
        },
        { fillDefaultRelationships: false },
      ),
    );
  }, []);

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
      const run = (async () => {
        try {
          await persistTreeNow();
          setSyncStatus("synced");
          setSyncError(null);
        } catch (error) {
          if (error instanceof CapexApiError && error.status === 409) {
            setSyncStatus("conflict");
            setSyncError(
              "This portfolio changed elsewhere. Reloading the latest version.",
            );
            toast.warning("Version conflict", {
              description: "Reloaded the latest portfolio from the server.",
            });
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
          toast.error("Portfolio save failed", {
            description:
              error instanceof Error ? error.message : "Unable to sync tree",
          });
        }
      })();
      treeSaveInFlightRef.current = run.finally(() => {
        treeSaveInFlightRef.current = null;
      });
    }, TREE_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [apiEnabled, apiHydrated, treeApi, persistTreeNow]);

  // Debounced catalog persistence to API.
  useEffect(() => {
    if (!apiEnabled || !apiHydrated) return;
    if (skipCatalogPersistRef.current) {
      skipCatalogPersistRef.current = false;
      return;
    }
    if (catalogVersionRef.current == null) return;

    if (catalogSaveTimerRef.current) {
      window.clearTimeout(catalogSaveTimerRef.current);
    }
    setSyncStatus((prev) => (prev === "conflict" ? prev : "saving"));

    catalogSaveTimerRef.current = window.setTimeout(() => {
      const run = (async () => {
        try {
          await persistCatalogsNow();
          setSyncStatus("synced");
          setSyncError(null);
        } catch (error) {
          if (error instanceof CapexApiError && error.status === 409) {
            setSyncStatus("conflict");
            setSyncError(
              "Catalogs changed elsewhere. Reloading the latest version.",
            );
            toast.warning("Catalog conflict", {
              description: "Reloaded catalogs from the server.",
            });
            try {
              const latest = await getMyCatalogs();
              skipCatalogPersistRef.current = true;
              setSettingsApi(
                normalizeSettings(
                  {
                    catalogs: latest.catalogs,
                    relationships: latest.relationships,
                  },
                  { fillDefaultRelationships: false },
                ),
              );
              catalogVersionRef.current = latest.version;
              setCatalogVersion(latest.version);
            } catch (reloadError) {
              setSyncStatus("error");
              setSyncError(
                reloadError instanceof Error
                  ? reloadError.message
                  : "Catalog conflict and reload failed",
              );
            }
            return;
          }
          setSyncStatus("error");
          setSyncError(
            error instanceof Error ? error.message : "Failed to save catalogs",
          );
          toast.error("Settings save failed", {
            description:
              error instanceof Error
                ? error.message
                : "Unable to sync catalogs",
          });
        }
      })();
      catalogSaveInFlightRef.current = run.finally(() => {
        catalogSaveInFlightRef.current = null;
      });
    }, CATALOG_SAVE_DEBOUNCE_MS);

    return () => {
      if (catalogSaveTimerRef.current) {
        window.clearTimeout(catalogSaveTimerRef.current);
      }
    };
  }, [apiEnabled, apiHydrated, settingsApi, persistCatalogsNow]);

  useEffect(() => {
    if (!apiEnabled) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (syncStatus === "saving" || syncStatus === "error") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [apiEnabled, syncStatus]);

  const reloadFromServer = useCallback(async () => {
    if (!apiEnabled) return;
    await loadFromApi();
  }, [apiEnabled, loadFromApi]);

  const flushPendingSaves = useCallback(async () => {
    if (!apiEnabled || !apiHydrated) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (catalogSaveTimerRef.current) {
      window.clearTimeout(catalogSaveTimerRef.current);
      catalogSaveTimerRef.current = null;
    }
    const pending: Promise<void>[] = [];
    if (treeSaveInFlightRef.current) pending.push(treeSaveInFlightRef.current);
    if (catalogSaveInFlightRef.current) {
      pending.push(catalogSaveInFlightRef.current);
    }
    // Flush latest snapshots even if debounce hadn't fired.
    if (portfolioIdRef.current && versionRef.current != null) {
      pending.push(persistTreeNow().catch(() => undefined));
    }
    if (catalogVersionRef.current != null) {
      pending.push(persistCatalogsNow().catch(() => undefined));
    }
    await Promise.all(pending);
  }, [apiEnabled, apiHydrated, persistTreeNow, persistCatalogsNow]);

  const importCapex1Template = useCallback(
    async (replaceTree = false) => {
      if (!apiEnabled) return;
      if (!isOwnerOrAdmin(membershipRoleRef.current)) {
        toast.error("Permission denied", {
          description: "Only owners or admins can import Capex_1.",
        });
        return;
      }
      setSyncStatus("saving");
      try {
        const updated = await importCatalogTemplate({
          key: "capex_1",
          replaceTree,
        });
        skipCatalogPersistRef.current = true;
        setSettingsApi(
          normalizeSettings(
            {
              catalogs: updated.catalogs,
              relationships: updated.relationships,
            },
            { fillDefaultRelationships: false },
          ),
        );
        catalogVersionRef.current = updated.version;
        setCatalogVersion(updated.version);
        if (replaceTree) {
          await loadFromApi();
        } else {
          setSyncStatus("synced");
        }
        toast.success("Capex_1 template imported");
      } catch (error) {
        setSyncStatus("error");
        const message =
          error instanceof Error ? error.message : "Import failed";
        setSyncError(message);
        toast.error("Import failed", { description: message });
        throw error;
      }
    },
    [apiEnabled, loadFromApi],
  );

  const clearSessionState = useCallback(() => {
    skipPersistRef.current = true;
    skipCatalogPersistRef.current = true;
    setTreeApi([]);
    setSettingsApi(EMPTY_APP_SETTINGS);
    setPortfolioId(null);
    setPortfolioVersion(null);
    setCatalogVersion(null);
    setMembershipRole(null);
    setCurrentUserEmail(null);
    membershipRoleRef.current = null;
    portfolioIdRef.current = null;
    versionRef.current = null;
    catalogVersionRef.current = null;
    setSelectedNode(null);
    setClipboard(null);
    setSyncStatus(apiEnabled ? "loading" : "local");
    setSyncError(null);
    setApiHydrated(false);
    try {
      sessionStorage.removeItem(CLIPBOARD_KEY);
    } catch {
      // ignore
    }
  }, [apiEnabled, setSelectedNode]);

  const addChild = useCallback(
    (parentId: string, child: CapexTreeNode) => {
      if (!assertCanMutate()) return;
      setTree((prev) => addChildToNode(prev, parentId, child));
    },
    [assertCanMutate, setTree],
  );

  const renameNode = useCallback(
    (id: string, name: string) => {
      if (!assertCanMutate()) return;
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
    [assertCanMutate, setTree, setSelectedNode],
  );

  const deleteNode = useCallback(
    (id: string) => {
      if (!assertCanMutate()) return;
      setTree((prev) => deleteNodeFromTree(prev, id));
      setSelectedNode((prev) => (prev?.id === id ? null : prev));
    },
    [assertCanMutate, setTree, setSelectedNode],
  );

  const updateSettings = useCallback(
    (updater: (prev: AppSettings) => AppSettings) => {
      if (!assertCanMutate()) return;
      setSettings(updater);
    },
    [assertCanMutate, setSettings],
  );

  const addCountry = useCallback(
    (countryName: string) => {
      if (!assertCanMutate()) return;
      const country: CapexTreeNode = {
        id: generateId(),
        type: "country",
        name: countryName,
        children: [],
      };
      setTree((prev) => [...prev, country]);
    },
    [assertCanMutate, setTree],
  );

  const updatePackageData = useCallback(
    (nodeId: string, data: PackagePurchaseData) => {
      if (!assertCanMutate()) return;
      setTree((prev) =>
        updateNodeInTree(prev, nodeId, (node) => ({
          ...node,
          packageData: data,
        })),
      );
    },
    [assertCanMutate, setTree],
  );

  const addChildren = useCallback(
    (parentId: string, children: CapexTreeNode[]) => {
      if (children.length === 0) return;
      if (!assertCanMutate()) return;
      setTree((prev) => {
        let next = prev;
        for (const child of children) {
          next = addChildToNode(next, parentId, child);
        }
        return next;
      });
    },
    [assertCanMutate, setTree],
  );

  const updateVendorNodeLicenseYears = useCallback(
    (vendorNodeNameId: string, licenseYears: LicenseYear[]) => {
      if (!assertCanMutate()) return;
      setTree((prev) =>
        updateNodeInTree(prev, vendorNodeNameId, (node) => ({
          ...node,
          licenseYears,
          children: node.children.filter((child) => child.type !== "package"),
        })),
      );
    },
    [assertCanMutate, setTree],
  );

  const updateLicensePackageData = useCallback(
    (
      vendorNodeNameId: string,
      packageInstanceId: string,
      data: PackagePurchaseData,
    ) => {
      if (!assertCanMutate()) return;
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
    [assertCanMutate, setTree],
  );

  const removeLicensePackage = useCallback(
    (vendorNodeNameId: string, packageInstanceId: string) => {
      if (!assertCanMutate()) return;
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
    [assertCanMutate, setTree],
  );

  const updateNodeDiscount = useCallback(
    (nodeId: string, discountPercent: number) => {
      if (!assertCanMutate()) return;
      const clamped = Math.min(100, Math.max(0, discountPercent));
      setTree((prev) =>
        updateNodeInTree(prev, nodeId, (node) => ({
          ...node,
          discountPercent: clamped,
        })),
      );
    },
    [assertCanMutate, setTree],
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
      if (!assertCanMutate()) {
        return { ok: false, reason: "Your role cannot edit this workspace." };
      }
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
    [assertCanMutate, clipboard, tree, setTree, setSelectedNode],
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
      catalogVersion,
      apiEnabled,
      membershipRole,
      currentUserEmail,
      canMutate,
      canManageOrg,
      reloadFromServer,
      flushPendingSaves,
      importCapex1Template,
      clearSessionState,
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
      catalogVersion,
      apiEnabled,
      membershipRole,
      currentUserEmail,
      canMutate,
      canManageOrg,
      reloadFromServer,
      flushPendingSaves,
      importCapex1Template,
      clearSessionState,
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
