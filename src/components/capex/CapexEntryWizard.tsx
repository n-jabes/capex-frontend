"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCapex, generateId } from "@/context/CapexContext";
import { getPackageVendorNodeNameIds } from "@/lib/catalog-utils";
import { getFilteredPresetsForChild } from "@/lib/relationship-utils";
import type { CapexTreeNode, CatalogItem } from "@/types/capex";
import { findNodePath, nodeTypeLabel } from "@/lib/tree-utils";
import {
  PackageSelectionTable,
  type PackageSelectionRow,
} from "@/components/capex/PackageSelectionTable";

const STEPS = [
  "domain",
  "node",
  "vendor",
  "vendorNodeName",
  "packages",
] as const;

type WizardStep = (typeof STEPS)[number];

interface CapexEntryWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNode: CapexTreeNode;
  onComplete: (rootNode: CapexTreeNode) => void;
}

export function CapexEntryWizard({
  open,
  onOpenChange,
  deliveryNode,
  onComplete,
}: CapexEntryWizardProps) {
  const { settings, tree } = useCapex();
  const [stepIndex, setStepIndex] = useState(0);
  const [domainId, setDomainId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [siteName, setSiteName] = useState("");
  const [vendorNodeNameId, setVendorNodeNameId] = useState("");
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);

  const deliveryPath = findNodePath(tree, deliveryNode.id) ?? [deliveryNode];
  const step = STEPS[stepIndex];

  const domainOptions = getFilteredPresetsForChild(
    settings,
    deliveryNode,
    deliveryPath,
    "domain",
  );

  const domainStub: CapexTreeNode = useMemo(
    () => ({
      id: "wizard-domain",
      type: "domain",
      name:
        domainOptions.find((item) => item.id === domainId)?.name ?? "",
      catalogId: domainId,
      children: [],
    }),
    [domainId, domainOptions],
  );

  const nodeOptions = domainId
    ? getFilteredPresetsForChild(
        settings,
        domainStub,
        [...deliveryPath, domainStub],
        "node",
      )
    : [];

  const nodeStub: CapexTreeNode = useMemo(
    () => ({
      id: "wizard-node",
      type: "node",
      name: nodeOptions.find((item) => item.id === nodeId)?.name ?? "",
      catalogId: nodeId,
      children: [],
    }),
    [nodeId, nodeOptions],
  );

  const vendorOptions = nodeId
    ? getFilteredPresetsForChild(
        settings,
        nodeStub,
        [...deliveryPath, domainStub, nodeStub],
        "vendor",
      )
    : [];

  const vendorStub: CapexTreeNode = useMemo(
    () => ({
      id: "wizard-vendor",
      type: "vendor",
      name: vendorOptions.find((item) => item.id === vendorId)?.name ?? "",
      catalogId: vendorId,
      children: [],
    }),
    [vendorId, vendorOptions],
  );

  const vnnOptions = vendorId
    ? getFilteredPresetsForChild(
        settings,
        vendorStub,
        [...deliveryPath, domainStub, nodeStub, vendorStub],
        "vendorNodeName",
      )
    : [];

  const vnnStub: CapexTreeNode = useMemo(
    () => ({
      id: "wizard-vnn",
      type: "vendorNodeName",
      name: vnnOptions.find((item) => item.id === vendorNodeNameId)?.name ?? "",
      catalogId: vendorNodeNameId,
      children: [],
    }),
    [vendorNodeNameId, vnnOptions],
  );

  const packageRows: PackageSelectionRow[] = useMemo(() => {
    if (!vendorNodeNameId) return [];
    const presets = getFilteredPresetsForChild(
      settings,
      vnnStub,
      [...deliveryPath, domainStub, nodeStub, vendorStub, vnnStub],
      "package",
    );
    const presetIds = new Set(presets.map((item) => item.id));
    return settings.catalogs.packages
      .filter(
        (item) =>
          getPackageVendorNodeNameIds(item).includes(vendorNodeNameId) &&
          (presets.length === 0 || presetIds.has(item.id)),
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        licensePackage: item.licensePackage,
        unit: item.unit,
        unitPrice: item.unitPrice,
      }));
  }, [
    settings,
    vendorNodeNameId,
    vnnStub,
    deliveryPath,
    domainStub,
    nodeStub,
    vendorStub,
  ]);

  const reset = () => {
    setStepIndex(0);
    setDomainId("");
    setNodeId("");
    setVendorId("");
    setSiteName("");
    setVendorNodeNameId("");
    setSelectedPackageIds([]);
  };

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, deliveryNode.id]);

  useEffect(() => {
    if (domainOptions.length === 1 && !domainId) {
      setDomainId(domainOptions[0].id);
    }
  }, [domainOptions, domainId]);

  useEffect(() => {
    if (nodeOptions.length === 1 && !nodeId) {
      setNodeId(nodeOptions[0].id);
    }
  }, [nodeOptions, nodeId]);

  useEffect(() => {
    if (vendorOptions.length === 1 && !vendorId) {
      setVendorId(vendorOptions[0].id);
    }
  }, [vendorOptions, vendorId]);

  useEffect(() => {
    if (vnnOptions.length === 1 && !vendorNodeNameId) {
      setVendorNodeNameId(vnnOptions[0].id);
    }
  }, [vnnOptions, vendorNodeNameId]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const canProceed = () => {
    switch (step) {
      case "domain":
        return !!domainId;
      case "node":
        return !!nodeId;
      case "vendor":
        return !!vendorId && !!siteName.trim();
      case "vendorNodeName":
        return !!vendorNodeNameId;
      case "packages":
        return selectedPackageIds.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step === "packages") {
      handleFinish();
      return;
    }
    setStepIndex((value) => value + 1);
  };

  const handleBack = () => {
    setStepIndex((value) => Math.max(0, value - 1));
  };

  const handleFinish = () => {
    const domain = domainOptions.find((item) => item.id === domainId);
    const node = nodeOptions.find((item) => item.id === nodeId);
    const vendor = vendorOptions.find((item) => item.id === vendorId);
    const vnn = vnnOptions.find((item) => item.id === vendorNodeNameId);
    if (!domain || !node || !vendor || !vnn) return;

    const yearPackages = selectedPackageIds.flatMap((id) => {
      const catalogPkg = settings.catalogs.packages.find(
        (item) => item.id === id,
      );
      if (!catalogPkg) return [];
      return [
        {
          id: generateId(),
          catalogId: catalogPkg.id,
          name: catalogPkg.name,
        },
      ];
    });

    const vendorNodeNameTreeNode: CapexTreeNode = {
      id: generateId(),
      type: "vendorNodeName",
      name: vnn.name,
      catalogId: vnn.id,
      discountPercent: 0,
      licenseYears: [
        {
          id: `year-${generateId()}`,
          name: "Year One",
          packages: yearPackages,
        },
      ],
      children: [],
    };

    const vendorTreeNode: CapexTreeNode = {
      id: generateId(),
      type: "vendor",
      name: vendor.name,
      siteName: siteName.trim() || vendor.name,
      catalogId: vendor.id,
      children: [vendorNodeNameTreeNode],
    };

    const nodeTreeNode: CapexTreeNode = {
      id: generateId(),
      type: "node",
      name: node.name,
      catalogId: node.id,
      children: [vendorTreeNode],
    };

    const domainTreeNode: CapexTreeNode = {
      id: generateId(),
      type: "domain",
      name: domain.name,
      catalogId: domain.id,
      children: [nodeTreeNode],
    };

    onComplete(domainTreeNode);
    handleClose(false);
  };

  const stepTitle =
    step === "packages" ? "Packages" : nodeTypeLabel(step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Guided CAPEX Entry</DialogTitle>
          <DialogDescription>
            Build a full path under delivery <strong>{deliveryNode.name}</strong>
            . Step {stepIndex + 1} of {STEPS.length}: {stepTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 py-2">
          {STEPS.map((wizardStep, index) => (
            <div
              key={wizardStep}
              className={`h-1.5 flex-1 rounded-full ${
                index <= stepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="space-y-4 py-2">
          {step !== "packages" ? (
            <>
              <PresetStepSelect
                label={step === "vendor" ? "Vendor" : stepTitle}
                options={optionsForStep(step, {
                  domainOptions,
                  nodeOptions,
                  vendorOptions,
                  vnnOptions,
                })}
                value={valueForStep(step, {
                  domainId,
                  nodeId,
                  vendorId,
                  vendorNodeNameId,
                })}
                onChange={(value) => {
                  if (step === "domain") {
                    setDomainId(value);
                    setNodeId("");
                    setVendorId("");
                    setSiteName("");
                    setVendorNodeNameId("");
                  } else if (step === "node") {
                    setNodeId(value);
                    setVendorId("");
                    setSiteName("");
                    setVendorNodeNameId("");
                  } else if (step === "vendor") {
                    setVendorId(value);
                    setVendorNodeNameId("");
                    const vendor = vendorOptions.find((item) => item.id === value);
                    if (vendor && !siteName.trim()) {
                      setSiteName(vendor.name);
                    }
                  } else if (step === "vendorNodeName") {
                    setVendorNodeNameId(value);
                  }
                }}
              />
              {step === "vendor" ? (
                <div className="space-y-2">
                  <Label htmlFor="wizard-site-name" required>
                    Site name
                  </Label>
                  <Input
                    id="wizard-site-name"
                    value={siteName}
                    onChange={(event) => setSiteName(event.target.value)}
                    placeholder="e.g. Kigali Hub"
                  />
                </div>
              ) : null}
            </>
          ) : (
            <PackageSelectionTable
              rows={packageRows}
              selectedIds={selectedPackageIds}
              onSelectionChange={setSelectedPackageIds}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={stepIndex === 0}
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleNext} disabled={!canProceed()}>
              {step === "packages" ? "Create CAPEX path" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function optionsForStep(
  step: WizardStep,
  options: {
    domainOptions: CatalogItem[];
    nodeOptions: CatalogItem[];
    vendorOptions: CatalogItem[];
    vnnOptions: CatalogItem[];
  },
): CatalogItem[] {
  switch (step) {
    case "domain":
      return options.domainOptions;
    case "node":
      return options.nodeOptions;
    case "vendor":
      return options.vendorOptions;
    case "vendorNodeName":
      return options.vnnOptions;
    default:
      return [];
  }
}

function valueForStep(
  step: WizardStep,
  values: {
    domainId: string;
    nodeId: string;
    vendorId: string;
    vendorNodeNameId: string;
  },
): string {
  switch (step) {
    case "domain":
      return values.domainId;
    case "node":
      return values.nodeId;
    case "vendor":
      return values.vendorId;
    case "vendorNodeName":
      return values.vendorNodeNameId;
    default:
      return "";
  }
}

function PresetStepSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: CatalogItem[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.id === value);

  return (
    <div className="space-y-2">
      <Label required>Select {label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next ?? "")}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Choose ${label.toLowerCase()}...`}>
            {selected?.name ?? ""}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <SelectItem value="__none" disabled>
              No mapped options — configure in Settings → Mappings
            </SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
