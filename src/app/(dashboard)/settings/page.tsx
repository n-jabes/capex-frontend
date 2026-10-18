"use client";

import { useState } from "react";
import {
  Boxes,
  Globe2,
  Link2,
  Network,
  Package,
  Server,
  Settings2,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCapex } from "@/context/CapexContext";
import { CountriesSection } from "@/components/settings/SettingsSections";
import {
  PackageCatalogSection,
  SimpleCatalogSection,
  VendorNodeNameCatalogSection,
} from "@/components/settings/CatalogSections";
import {
  DomainCatalogSection,
  NodeCatalogSection,
} from "@/components/settings/MappedCatalogSections";
import { RelationshipMappingsPanel } from "@/components/settings/RelationshipSections";
import { removeIdFromRelationshipMaps, setRelationshipTargets } from "@/lib/relationship-utils";
import type { AppCatalogs, CatalogItem, VendorNodeNameCatalogItem } from "@/types/capex";

type SettingsSectionId =
  | "countries"
  | "projectNames"
  | "deliveries"
  | "domains"
  | "nodes"
  | "vendors"
  | "vendorNodeNames"
  | "packages"
  | "relationships";

const NAV_ITEMS: Array<{
  id: SettingsSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "tree" | "catalogs" | "mappings";
}> = [
  { id: "countries", label: "Countries", icon: Globe2, group: "tree" },
  {
    id: "projectNames",
    label: "Project Names",
    icon: Settings2,
    group: "catalogs",
  },
  { id: "deliveries", label: "Deliveries", icon: Truck, group: "catalogs" },
  { id: "domains", label: "Domains", icon: Network, group: "catalogs" },
  { id: "nodes", label: "Nodes", icon: Server, group: "catalogs" },
  { id: "vendors", label: "Vendors", icon: Users, group: "catalogs" },
  {
    id: "vendorNodeNames",
    label: "Vendor Node Names",
    icon: Boxes,
    group: "catalogs",
  },
  { id: "packages", label: "Packages", icon: Package, group: "catalogs" },
  {
    id: "relationships",
    label: "Mappings",
    icon: Link2,
    group: "mappings",
  },
];

export default function SettingsPage() {
  const {
    tree,
    settings,
    updateSettings,
    addCountry,
    isHydrated,
    apiEnabled,
    importCapex1Template,
    canMutate,
    canManageOrg,
    membershipRole,
  } = useCapex();
  const readOnly = !canMutate;
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("countries");
  const [importing, setImporting] = useState(false);

  if (!isHydrated) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  const { catalogs } = settings;
  const catalogsEmpty =
    catalogs.projectNames.length === 0 &&
    catalogs.deliveries.length === 0 &&
    catalogs.packages.length === 0;

  const onImportTemplate = async (replaceTree: boolean) => {
    if (
      !window.confirm(
        replaceTree
          ? "Import Capex_1 catalogs and replace your CAPEX tree with the sample tree? This cannot be undone."
          : "Import Capex_1 catalogs into this organization? Existing catalog rows will be replaced.",
      )
    ) {
      return;
    }
    setImporting(true);
    try {
      await importCapex1Template(replaceTree);
    } catch {
      toast.error("Could not import Capex_1 template");
    } finally {
      setImporting(false);
    }
  };

  const patchCatalog = <K extends keyof AppCatalogs>(
    key: K,
    updater: (items: AppCatalogs[K]) => AppCatalogs[K],
  ) => {
    updateSettings((prev) => ({
      ...prev,
      catalogs: {
        ...prev.catalogs,
        [key]: updater(prev.catalogs[key]),
      },
    }));
  };

  const upsertSimpleCatalog = (
    key: keyof Pick<
      AppCatalogs,
      "projectNames" | "deliveries" | "domains" | "nodes" | "vendors"
    >,
    id: string,
    name: string,
  ) => {
    patchCatalog(key, (items) =>
      (items as CatalogItem[]).map((item) =>
        item.id === id ? { ...item, name } : item,
      ),
    );
  };

  const patchRelationships = (
    updater: (
      relationships: import("@/types/capex").AppSettings["relationships"],
    ) => import("@/types/capex").AppSettings["relationships"],
  ) => {
    updateSettings((prev) => ({
      ...prev,
      relationships: updater(prev.relationships),
    }));
  };

  const handleCatalogDelete = (
    catalogId: string,
    key: keyof AppCatalogs,
    filter: (items: AppCatalogs[typeof key]) => AppCatalogs[typeof key],
  ) => {
    patchCatalog(key, filter);
    patchRelationships((prev) => removeIdFromRelationshipMaps(prev, catalogId));
  };

  const upsertVendorNodeName = (item: VendorNodeNameCatalogItem) => {
    patchCatalog("vendorNodeNames", (items) => {
      const exists = items.some((entry) => entry.id === item.id);
      return exists
        ? items.map((entry) => (entry.id === item.id ? item : entry))
        : [...items, item];
    });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "countries":
        return (
          <CountriesSection
            countries={tree.map((country) => ({
              id: country.id,
              name: country.name,
              projectNames: country.children.map((projectName) => ({
                id: projectName.id,
                name: projectName.name,
              })),
            }))}
            onAddCountry={addCountry}
            readOnly={readOnly}
          />
        );
      case "projectNames":
        return (
          <SimpleCatalogSection
            title="Project Names"
            description="Reusable project names shared across countries in the CAPEX tree."
            items={catalogs.projectNames}
            addLabel="Add Project Name"
            nameLabel="Project name"
            placeholder="e.g. YAS CAPEX"
            idPrefix="proj"
            readOnly={readOnly}
            onAdd={(item) =>
              patchCatalog("projectNames", (items) => [...items, item])
            }
            onUpdate={(id, name) => upsertSimpleCatalog("projectNames", id, name)}
            onDelete={(id) =>
              handleCatalogDelete(id, "projectNames", (items) =>
                items.filter((item) => item.id !== id),
              )
            }
          />
        );
      case "deliveries":
        return (
          <SimpleCatalogSection
            title="Deliveries"
            description="Delivery categories such as Software, Hardware, and Professional Services."
            items={catalogs.deliveries}
            addLabel="Add Delivery"
            nameLabel="Delivery name"
            placeholder="e.g. Software"
            idPrefix="del"
            readOnly={readOnly}
            onAdd={(item) =>
              patchCatalog("deliveries", (items) => [...items, item])
            }
            onUpdate={(id, name) => upsertSimpleCatalog("deliveries", id, name)}
            onDelete={(id) =>
              handleCatalogDelete(id, "deliveries", (items) =>
                items.filter((item) => item.id !== id),
              )
            }
          />
        );
      case "domains":
        return (
          <DomainCatalogSection
            deliveries={catalogs.deliveries}
            domains={catalogs.domains}
            mapping={settings.relationships.deliveryDomains}
            readOnly={readOnly}
            onAddDomain={(item) =>
              patchCatalog("domains", (items) => [...items, item])
            }
            onUpdateDomain={(id, name) => upsertSimpleCatalog("domains", id, name)}
            onDeleteDomain={(id) =>
              handleCatalogDelete(id, "domains", (items) =>
                items.filter((item) => item.id !== id),
              )
            }
            onUpdateMapping={(deliveryId, domainIds) =>
              patchRelationships((prev) => ({
                ...prev,
                deliveryDomains: setRelationshipTargets(
                  prev.deliveryDomains,
                  deliveryId,
                  domainIds,
                ),
              }))
            }
          />
        );
      case "nodes":
        return (
          <NodeCatalogSection
            domains={catalogs.domains}
            nodes={catalogs.nodes}
            mapping={settings.relationships.domainNodes}
            readOnly={readOnly}
            onAddNode={(item) =>
              patchCatalog("nodes", (items) => [...items, item])
            }
            onUpdateNode={(id, name) => upsertSimpleCatalog("nodes", id, name)}
            onDeleteNode={(id) =>
              handleCatalogDelete(id, "nodes", (items) =>
                items.filter((item) => item.id !== id),
              )
            }
            onUpdateMapping={(domainId, nodeIds) =>
              patchRelationships((prev) => ({
                ...prev,
                domainNodes: setRelationshipTargets(
                  prev.domainNodes,
                  domainId,
                  nodeIds,
                ),
              }))
            }
          />
        );
      case "vendors":
        return (
          <SimpleCatalogSection
            title="Vendors"
            description="Vendor names selectable when building CAPEX under nodes."
            items={catalogs.vendors}
            addLabel="Add Vendor"
            nameLabel="Vendor name"
            placeholder="e.g. Ericsson"
            idPrefix="vendor"
            readOnly={readOnly}
            onAdd={(item) =>
              patchCatalog("vendors", (items) => [...items, item])
            }
            onUpdate={(id, name) => upsertSimpleCatalog("vendors", id, name)}
            onDelete={(id) =>
              handleCatalogDelete(id, "vendors", (items) =>
                items.filter((item) => item.id !== id),
              )
            }
          />
        );
      case "vendorNodeNames":
        return (
          <VendorNodeNameCatalogSection
            items={catalogs.vendorNodeNames}
            nodes={catalogs.nodes}
            vendors={catalogs.vendors}
            readOnly={readOnly}
            onAdd={(item) =>
              patchCatalog("vendorNodeNames", (items) => [...items, item])
            }
            onUpdate={(id, patch) =>
              patchCatalog("vendorNodeNames", (items) =>
                items.map((item) =>
                  item.id === id ? { ...item, ...patch } : item,
                ),
              )
            }
            onDelete={(id) =>
              patchCatalog("vendorNodeNames", (items) =>
                items.filter((item) => item.id !== id),
              )
            }
          />
        );
      case "packages":
        return (
          <PackageCatalogSection
            items={catalogs.packages}
            vendorNodeNames={catalogs.vendorNodeNames}
            vendors={catalogs.vendors}
            readOnly={readOnly}
            onAdd={(item) =>
              patchCatalog("packages", (items) => [...items, item])
            }
            onUpdate={(id, patch) =>
              patchCatalog("packages", (items) =>
                items.map((item) =>
                  item.id === id ? { ...item, ...patch } : item,
                ),
              )
            }
            onDelete={(id) =>
              patchCatalog("packages", (items) =>
                items.filter((item) => item.id !== id),
              )
            }
          />
        );
      case "relationships":
        return (
          <RelationshipMappingsPanel
            settings={settings}
            countries={tree.map((country) => ({
              id: country.id,
              name: country.name,
            }))}
            readOnly={readOnly}
            onUpdateRelationships={(updater) =>
              patchRelationships(updater)
            }
            onUpsertVendorNodeName={upsertVendorNodeName}
            onDeleteVendorNodeName={(id) =>
              patchCatalog("vendorNodeNames", (items) =>
                items.filter((item) => item.id !== id),
              )
            }
          />
        );
      default:
        return null;
    }
  };

  const activeLabel =
    NAV_ITEMS.find((item) => item.id === activeSection)?.label ?? "Settings";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-60">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">
            ID-based catalogs for the CAPEX platform.
            {apiEnabled && membershipRole
              ? ` Role: ${membershipRole}.`
              : ""}
          </p>
          {readOnly ? (
            <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-900 dark:text-amber-100">
              View-only access — catalog edits are disabled for your role.
            </p>
          ) : null}
        </div>

        <nav className="space-y-4 rounded-lg border bg-card p-2 shadow-sm">
          {(["tree", "catalogs", "mappings"] as const).map((group) => (
            <div key={group} className="space-y-1">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group === "tree"
                  ? "Operational tree"
                  : group === "catalogs"
                    ? "Global catalogs"
                    : "Relationships"}
              </p>
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 space-y-4">
        {apiEnabled && canManageOrg ? (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Sample data (optional)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {catalogsEmpty
                ? "Your catalogs are empty. Import Capex_1 if you want a starter dataset, or build catalogs manually."
                : "Replace organization catalogs with the Capex_1 template. Owner/admin only."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={importing}
                onClick={() => void onImportTemplate(false)}
              >
                {importing ? "Importing…" : "Import Capex_1 catalogs"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={importing}
                onClick={() => void onImportTemplate(true)}
              >
                Import catalogs + sample tree
              </Button>
            </div>
          </div>
        ) : null}
        <div>
          <h3 className="text-lg font-semibold">{activeLabel}</h3>
          <p className="text-sm text-muted-foreground">
            {activeSection === "relationships"
              ? "Configure reusable many-to-many mappings between catalog entries."
              : "Manage catalog entries with search, sort, and pagination."}
          </p>
        </div>
        {renderSection()}
      </main>
    </div>
  );
}
