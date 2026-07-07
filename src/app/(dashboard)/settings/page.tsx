"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useCapex } from "@/context/CapexContext";
import { NODE_NAME_DBS } from "@/data/nodeNameDBs";
import {
  StringListSection,
  FeatureCatalogSection,
  NodeNameDBMappingSection,
  CountriesSection,
} from "@/components/settings/SettingsSections";

export default function SettingsPage() {
  const { tree, settings, updateSettings, addCountry, isHydrated } = useCapex();

  if (!isHydrated) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure reusable telecom structures for the CAPEX platform.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Administrator Configuration</AlertTitle>
        <AlertDescription>
          This page allows administrators to define reusable telecom structures.
          These defaults help users quickly create CAPEX entries without manually
          entering common telecom data. In the future this page will be restricted
          to administrators only.
        </AlertDescription>
      </Alert>

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
      />

      <StringListSection
        title="Default Project Names"
        description="Configure reusable project names shared across countries. Users can select these when adding a project name under a country in the CAPEX tree."
        items={settings.defaultProjectNames ?? []}
        onAdd={(value) =>
          updateSettings((s) => ({
            ...s,
            defaultProjectNames: [...(s.defaultProjectNames ?? []), value],
          }))
        }
        onRemove={(index) =>
          updateSettings((s) => ({
            ...s,
            defaultProjectNames: (s.defaultProjectNames ?? []).filter(
              (_, i) => i !== index,
            ),
          }))
        }
        addLabel="Add Default Project Name"
        placeholder="e.g. YAS CAPEX"
      />

      <StringListSection
        title="Default Deliveries"
        description="Configure commonly used telecom delivery categories. Users can select these when creating deliveries."
        items={settings.defaultDeliveries}
        onAdd={(value) =>
          updateSettings((s) => ({
            ...s,
            defaultDeliveries: [...s.defaultDeliveries, value],
          }))
        }
        onRemove={(index) =>
          updateSettings((s) => ({
            ...s,
            defaultDeliveries: s.defaultDeliveries.filter((_, i) => i !== index),
          }))
        }
        addLabel="Add Default Delivery"
        placeholder="e.g. Software"
      />

      <StringListSection
        title="Default Network Domains"
        description="Configure reusable telecom network domains. These appear when users create a network domain under a delivery."
        items={settings.defaultNetworkDomains}
        onAdd={(value) =>
          updateSettings((s) => ({
            ...s,
            defaultNetworkDomains: [...s.defaultNetworkDomains, value],
          }))
        }
        onRemove={(index) =>
          updateSettings((s) => ({
            ...s,
            defaultNetworkDomains: s.defaultNetworkDomains.filter(
              (_, i) => i !== index,
            ),
          }))
        }
        addLabel="Add Default Network Domain"
        placeholder="e.g. Packet Core"
      />

      <StringListSection
        title="Default Node Names"
        description="Configure reusable telecom node names. These appear when users create nodes under network domains."
        items={settings.defaultNodeNames}
        onAdd={(value) =>
          updateSettings((s) => ({
            ...s,
            defaultNodeNames: [...s.defaultNodeNames, value],
          }))
        }
        onRemove={(index) =>
          updateSettings((s) => ({
            ...s,
            defaultNodeNames: s.defaultNodeNames.filter((_, i) => i !== index),
          }))
        }
        addLabel="Add Default Node Name"
        placeholder="e.g. MME"
      />

      <NodeNameDBMappingSection
        mapping={settings.nodeNameDBMapping}
        nodeNames={settings.defaultNodeNames}
        nodeNameDBs={NODE_NAME_DBS}
        onUpdate={(mapping) =>
          updateSettings((s) => ({ ...s, nodeNameDBMapping: mapping }))
        }
      />

      <FeatureCatalogSection
        features={settings.features}
        nodeNameDBs={NODE_NAME_DBS}
        onUpdate={(features) => updateSettings((s) => ({ ...s, features }))}
      />
    </div>
  );
}
