"use client";

import { useEffect, useState } from "react";
import type {
  CatalogItem,
  PackageCatalogItem,
  VendorNodeNameCatalogItem,
} from "@/types/capex";
import { createCatalogItem, getPackageVendorNodeNameIds } from "@/lib/catalog-utils";
import { resolveCatalogLabel } from "@/lib/catalog-display";
import { generateId } from "@/lib/tree-utils";
import { PaginatedSearchList } from "@/components/capex/PaginatedSearchList";
import { CatalogSelect } from "@/components/settings/CatalogSelect";
import {
  CatalogCrudTable,
  CatalogFormFooter,
  CatalogNameField,
} from "@/components/settings/CatalogCrudTable";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

function CatalogNameForm({
  label,
  value,
  onChange,
  placeholder,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <>
      <CatalogNameField
        id="catalog-name"
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
      />
      <CatalogFormFooter
        onCancel={onCancel}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        canSubmit={!!value.trim()}
      />
    </>
  );
}

interface SimpleCatalogSectionProps {
  title: string;
  description: string;
  items: CatalogItem[];
  addLabel: string;
  nameLabel: string;
  placeholder: string;
  idPrefix: string;
  onAdd: (item: CatalogItem) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function SimpleCatalogSection({
  title,
  description,
  items,
  addLabel,
  nameLabel,
  placeholder,
  idPrefix,
  onAdd,
  onUpdate,
  onDelete,
}: SimpleCatalogSectionProps) {
  const [addName, setAddName] = useState("");

  return (
    <CatalogCrudTable
      title={title}
      description={description}
      items={items}
      columns={[
        {
          key: "name",
          header: "Name",
          sortable: true,
          render: (item) => <span className="font-medium">{item.name}</span>,
        },
      ]}
      searchKeys={[(item) => item.name]}
      addLabel={addLabel}
      addDialogTitle={addLabel}
      addDialogDescription={`Add a reusable ${title.toLowerCase()} entry to the global catalog.`}
      canSubmitAdd={!!addName.trim()}
      onAdd={() => {
        const trimmed = addName.trim();
        if (!trimmed) return;
        onAdd(createCatalogItem(trimmed, idPrefix));
        setAddName("");
      }}
      onDelete={onDelete}
      renderAddForm={({ onSubmit, onCancel }) => (
        <CatalogNameForm
          label={nameLabel}
          value={addName}
          onChange={setAddName}
          placeholder={placeholder}
          onSubmit={onSubmit}
          onCancel={() => {
            setAddName("");
            onCancel();
          }}
          submitLabel={addLabel}
        />
      )}
      renderEditForm={({ item, onSubmit, onCancel }) => (
        <EditNameForm
          key={item.id}
          item={item}
          nameLabel={nameLabel}
          placeholder={placeholder}
          onSubmit={(name) => {
            onUpdate(item.id, name);
            onSubmit();
          }}
          onCancel={onCancel}
        />
      )}
    />
  );
}

function EditNameForm({
  item,
  nameLabel,
  placeholder,
  onSubmit,
  onCancel,
}: {
  item: CatalogItem;
  nameLabel: string;
  placeholder?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);

  useEffect(() => {
    setName(item.name);
  }, [item.id, item.name]);

  return (
    <CatalogNameForm
      label={nameLabel}
      value={name}
      onChange={setName}
      placeholder={placeholder}
      onSubmit={() => onSubmit(name.trim())}
      onCancel={() => {
        setName(item.name);
        onCancel();
      }}
      submitLabel="Save changes"
    />
  );
}

interface VendorNodeNameCatalogSectionProps {
  items: VendorNodeNameCatalogItem[];
  nodes: CatalogItem[];
  vendors: CatalogItem[];
  onAdd: (item: VendorNodeNameCatalogItem) => void;
  onUpdate: (id: string, patch: Partial<VendorNodeNameCatalogItem>) => void;
  onDelete: (id: string) => void;
}

export function VendorNodeNameCatalogSection({
  items,
  nodes,
  vendors,
  onAdd,
  onUpdate,
  onDelete,
}: VendorNodeNameCatalogSectionProps) {
  const [addName, setAddName] = useState("");
  const [addNodeId, setAddNodeId] = useState(nodes[0]?.id ?? "");
  const [addVendorId, setAddVendorId] = useState(vendors[0]?.id ?? "");

  const nodeName = (id: string) => resolveCatalogLabel(nodes, id);
  const vendorName = (id: string) => resolveCatalogLabel(vendors, id);

  const canSubmitAdd =
    !!addName.trim() && !!addNodeId && !!addVendorId && nodes.length > 0;

  return (
    <CatalogCrudTable
      title="Vendor Node Names"
      description="Map standard nodes and vendors to vendor-specific node names (e.g. PCC, UNC)."
      items={items}
      columns={[
        {
          key: "name",
          header: "Name",
          sortable: true,
          render: (item) => <span className="font-medium">{item.name}</span>,
        },
        {
          key: "node",
          header: "Node",
          sortable: true,
          render: (item) => nodeName(item.nodeId),
        },
        {
          key: "vendor",
          header: "Vendor",
          sortable: true,
          render: (item) => vendorName(item.vendorId),
        },
      ]}
      searchKeys={[
        (item) => item.name,
        (item) => nodeName(item.nodeId),
        (item) => vendorName(item.vendorId),
      ]}
      addLabel="Add Vendor Node Name"
      addDialogTitle="Add Vendor Node Name"
      addDialogDescription="Define a vendor-specific node label for a standard node and vendor pair."
      canSubmitAdd={canSubmitAdd}
      onAdd={() => {
        if (!canSubmitAdd) return;
        onAdd({
          id: `vnn-${generateId()}`,
          name: addName.trim(),
          nodeId: addNodeId,
          vendorId: addVendorId,
        });
        setAddName("");
      }}
      onDelete={onDelete}
      renderAddForm={({ onSubmit, onCancel }) => (
        <VendorNodeNameFormFields
          name={addName}
          onNameChange={setAddName}
          vendorId={addVendorId}
          onVendorChange={setAddVendorId}
          nodeId={addNodeId}
          onNodeChange={setAddNodeId}
          nodes={nodes}
          vendors={vendors}
          onSubmit={onSubmit}
          onCancel={() => {
            setAddName("");
            onCancel();
          }}
          submitLabel="Add Vendor Node Name"
          canSubmit={canSubmitAdd}
        />
      )}
      renderEditForm={({ item, onSubmit, onCancel }) => (
        <EditVendorNodeNameForm
          key={item.id}
          item={item}
          nodes={nodes}
          vendors={vendors}
          onSubmit={(patch) => {
            onUpdate(item.id, patch);
            onSubmit();
          }}
          onCancel={onCancel}
        />
      )}
    />
  );
}

function VendorNodeNameFormFields({
  name,
  onNameChange,
  vendorId,
  onVendorChange,
  nodeId,
  onNodeChange,
  nodes,
  vendors,
  onSubmit,
  onCancel,
  submitLabel,
  canSubmit,
}: {
  name: string;
  onNameChange: (value: string) => void;
  vendorId: string;
  onVendorChange: (value: string) => void;
  nodeId: string;
  onNodeChange: (value: string) => void;
  nodes: CatalogItem[];
  vendors: CatalogItem[];
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  canSubmit: boolean;
}) {
  const nodeItems = nodes.map((node) => ({
    id: node.id,
    label: node.name,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <CatalogNameField
        id="vnn-name"
        label="Vendor node name"
        value={name}
        onChange={onNameChange}
        placeholder="e.g. PCC"
        required
      />
      <CatalogSelect
        label="Vendor"
        required
        value={vendorId}
        onValueChange={onVendorChange}
        items={vendors}
        placeholder="Select vendor..."
      />
      <div className="space-y-2">
        <Label required>Standard node</Label>
        <PaginatedSearchList
          items={nodeItems}
          activeId={nodeId}
          onSelect={onNodeChange}
          placeholder="Search nodes..."
          emptyMessage="No nodes match your search."
          pageSize={6}
          listClassName="max-h-[180px]"
        />
      </div>
      </div>
      <CatalogFormFooter
        onCancel={onCancel}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        canSubmit={canSubmit}
      />
    </div>
  );
}

function EditVendorNodeNameForm({
  item,
  nodes,
  vendors,
  onSubmit,
  onCancel,
}: {
  item: VendorNodeNameCatalogItem;
  nodes: CatalogItem[];
  vendors: CatalogItem[];
  onSubmit: (patch: Partial<VendorNodeNameCatalogItem>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [nodeId, setNodeId] = useState(item.nodeId);
  const [vendorId, setVendorId] = useState(item.vendorId);

  useEffect(() => {
    setName(item.name);
    setNodeId(item.nodeId);
    setVendorId(item.vendorId);
  }, [item]);

  const canSubmit = !!name.trim() && !!nodeId && !!vendorId;

  return (
    <VendorNodeNameFormFields
      name={name}
      onNameChange={setName}
      vendorId={vendorId}
      onVendorChange={setVendorId}
      nodeId={nodeId}
      onNodeChange={setNodeId}
      nodes={nodes}
      vendors={vendors}
      onSubmit={() => onSubmit({ name: name.trim(), nodeId, vendorId })}
      onCancel={onCancel}
      submitLabel="Save changes"
      canSubmit={canSubmit}
    />
  );
}

interface PackageCatalogSectionProps {
  items: PackageCatalogItem[];
  vendorNodeNames: VendorNodeNameCatalogItem[];
  vendors: CatalogItem[];
  onAdd: (item: PackageCatalogItem) => void;
  onUpdate: (id: string, patch: Partial<PackageCatalogItem>) => void;
  onDelete: (id: string) => void;
}

export function PackageCatalogSection({
  items,
  vendorNodeNames,
  vendors,
  onAdd,
  onUpdate,
  onDelete,
}: PackageCatalogSectionProps) {
  const [form, setForm] = useState({
    name: "",
    vendorId: vendors[0]?.id ?? "",
    vendorNodeNameIds: [] as string[],
    licensePackage: "",
    unit: "",
    unitPrice: "",
  });

  const vendorNodeNameLabel = (id: string) =>
    vendorNodeNames.find((item) => item.id === id)?.name ?? id;

  const vendorNodeNamesForVendor = (vendorId: string) =>
    vendorNodeNames.filter((item) => item.vendorId === vendorId);

  const canSubmitAdd =
    !!form.name.trim() &&
    form.vendorNodeNameIds.length > 0 &&
    !!form.licensePackage.trim() &&
    !!form.unit.trim() &&
    form.unitPrice !== "" &&
    !Number.isNaN(parseFloat(form.unitPrice));

  return (
    <CatalogCrudTable
      title="Packages"
      description="Configure license packages with default unit metadata and pricing for CAPEX entry."
      items={items}
      columns={[
        {
          key: "name",
          header: "Package",
          sortable: true,
          render: (item) => <span className="font-medium">{item.name}</span>,
        },
        {
          key: "vendorNodeNames",
          header: "Vendor Node Names",
          render: (item) =>
            getPackageVendorNodeNameIds(item)
              .map(vendorNodeNameLabel)
              .join(", ") || "—",
        },
        {
          key: "licensePackage",
          header: "License Package",
          render: (item) => item.licensePackage,
        },
        {
          key: "unit",
          header: "Unit",
          render: (item) => item.unit,
        },
        {
          key: "unitPrice",
          header: "Unit Price",
          className: "text-right",
          sortable: true,
          render: (item) => formatCurrency(item.unitPrice),
        },
      ]}
      searchKeys={[
        (item) => item.name,
        (item) => item.licensePackage,
        (item) => item.unit,
        (item) =>
          getPackageVendorNodeNameIds(item)
            .map(vendorNodeNameLabel)
            .join(" "),
      ]}
      addLabel="Add Package"
      addDialogTitle="Add Package"
      addDialogDescription="Define a package catalog entry with default license and pricing metadata."
      canSubmitAdd={canSubmitAdd}
      onAdd={() => {
        if (!canSubmitAdd) return;
        onAdd({
          id: `pkg-${generateId()}`,
          name: form.name.trim(),
          vendorNodeNameIds: form.vendorNodeNameIds,
          licensePackage: form.licensePackage.trim(),
          unit: form.unit.trim(),
          unitPrice: parseFloat(form.unitPrice),
        });
        setForm({
          name: "",
          vendorId: vendors[0]?.id ?? "",
          vendorNodeNameIds: [],
          licensePackage: "",
          unit: "",
          unitPrice: "",
        });
      }}
      onDelete={onDelete}
      renderAddForm={({ onSubmit, onCancel }) => (
        <PackageFormFields
          form={form}
          setForm={setForm}
          vendorNodeNames={vendorNodeNames}
          vendors={vendors}
          onSubmit={onSubmit}
          onCancel={onCancel}
          submitLabel="Add Package"
          canSubmit={canSubmitAdd}
        />
      )}
      renderEditForm={({ item, onSubmit, onCancel }) => (
        <EditPackageForm
          key={item.id}
          item={item}
          vendorNodeNames={vendorNodeNames}
          vendors={vendors}
          onSubmit={(patch) => {
            onUpdate(item.id, patch);
            onSubmit();
          }}
          onCancel={onCancel}
        />
      )}
    />
  );
}

function PackageFormFields({
  form,
  setForm,
  vendorNodeNames,
  vendors,
  onSubmit,
  onCancel,
  submitLabel,
  canSubmit,
}: {
  form: {
    name: string;
    vendorId: string;
    vendorNodeNameIds: string[];
    licensePackage: string;
    unit: string;
    unitPrice: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      vendorId: string;
      vendorNodeNameIds: string[];
      licensePackage: string;
      unit: string;
      unitPrice: string;
    }>
  >;
  vendorNodeNames: VendorNodeNameCatalogItem[];
  vendors: CatalogItem[];
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  canSubmit: boolean;
}) {
  const filteredVendorNodeNames = vendorNodeNames.filter(
    (item) => item.vendorId === form.vendorId,
  );

  const toggleVendorNodeName = (id: string) => {
    setForm((prev) => ({
      ...prev,
      vendorNodeNameIds: prev.vendorNodeNameIds.includes(id)
        ? prev.vendorNodeNameIds.filter((entry) => entry !== id)
        : [...prev.vendorNodeNameIds, id],
    }));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <CatalogNameField
        id="pkg-name"
        label="Package name"
        value={form.name}
        onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
        placeholder="e.g. Basic Package"
        required
      />
      <CatalogSelect
        label="Vendor"
        required
        value={form.vendorId}
        onValueChange={(value) =>
          setForm((prev) => ({
            ...prev,
            vendorId: value,
            vendorNodeNameIds: [],
          }))
        }
        items={vendors}
        placeholder="Select vendor..."
      />
      <div className="space-y-2">
        <Label required>Vendor node names</Label>
        <p className="text-xs text-muted-foreground">
          Select one or more vendor node names for this package. A package can
          apply to many nodes.
        </p>
        <PaginatedSearchList
          items={filteredVendorNodeNames.map((entry) => ({
            id: entry.id,
            label: entry.name,
            selected: form.vendorNodeNameIds.includes(entry.id),
          }))}
          activeId={form.vendorNodeNameIds[0] ?? null}
          onSelect={toggleVendorNodeName}
          placeholder="Search vendor node names..."
          emptyMessage={
            form.vendorId
              ? "No vendor node names for this vendor."
              : "Select a vendor first."
          }
          pageSize={6}
          listClassName="max-h-[180px]"
        />
      </div>
      <CatalogNameField
        id="pkg-license"
        label="License package"
        value={form.licensePackage}
        onChange={(value) =>
          setForm((prev) => ({ ...prev, licensePackage: value }))
        }
        placeholder="e.g. Basic Att KSAU"
        required
      />
      <CatalogNameField
        id="pkg-unit"
        label="Unit"
        value={form.unit}
        onChange={(value) => setForm((prev) => ({ ...prev, unit: value }))}
        placeholder="e.g. KSAU"
        required
      />
      <div className="space-y-2">
        <Label htmlFor="pkg-price" required>
          Unit price
        </Label>
        <Input
          id="pkg-price"
          type="number"
          min={0}
          step="0.01"
          value={form.unitPrice}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, unitPrice: event.target.value }))
          }
          placeholder="e.g. 1.00"
        />
      </div>
      </div>
      <CatalogFormFooter
        onCancel={onCancel}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        canSubmit={canSubmit}
      />
    </div>
  );
}

function EditPackageForm({
  item,
  vendorNodeNames,
  vendors,
  onSubmit,
  onCancel,
}: {
  item: PackageCatalogItem;
  vendorNodeNames: VendorNodeNameCatalogItem[];
  vendors: CatalogItem[];
  onSubmit: (patch: Partial<PackageCatalogItem>) => void;
  onCancel: () => void;
}) {
  const initialVendorId =
    vendorNodeNames.find((entry) =>
      getPackageVendorNodeNameIds(item).includes(entry.id),
    )?.vendorId ?? vendors[0]?.id ?? "";

  const [form, setForm] = useState({
    name: item.name,
    vendorId: initialVendorId,
    vendorNodeNameIds: getPackageVendorNodeNameIds(item),
    licensePackage: item.licensePackage,
    unit: item.unit,
    unitPrice: String(item.unitPrice),
  });

  useEffect(() => {
    const vendorId =
      vendorNodeNames.find((entry) =>
        getPackageVendorNodeNameIds(item).includes(entry.id),
      )?.vendorId ?? vendors[0]?.id ?? "";
    setForm({
      name: item.name,
      vendorId,
      vendorNodeNameIds: getPackageVendorNodeNameIds(item),
      licensePackage: item.licensePackage,
      unit: item.unit,
      unitPrice: String(item.unitPrice),
    });
  }, [item, vendorNodeNames, vendors]);

  const canSubmit =
    !!form.name.trim() &&
    form.vendorNodeNameIds.length > 0 &&
    !!form.licensePackage.trim() &&
    !!form.unit.trim() &&
    form.unitPrice !== "" &&
    !Number.isNaN(parseFloat(form.unitPrice));

  return (
    <PackageFormFields
      form={form}
      setForm={setForm}
      vendorNodeNames={vendorNodeNames}
      vendors={vendors}
      onSubmit={() =>
        onSubmit({
          name: form.name.trim(),
          vendorNodeNameIds: form.vendorNodeNameIds,
          licensePackage: form.licensePackage.trim(),
          unit: form.unit.trim(),
          unitPrice: parseFloat(form.unitPrice),
        })
      }
      onCancel={onCancel}
      submitLabel="Save changes"
      canSubmit={canSubmit}
    />
  );
}
