"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCapex } from "@/context/CapexContext";
import { DimensionPicker } from "@/components/benchmarking/DimensionPicker";
import { BenchmarkItemPicker } from "@/components/benchmarking/BenchmarkItemPicker";
import { ComparisonResultsView } from "@/components/benchmarking/ComparisonResultsView";
import {
  createBenchmarkScenario,
  deleteBenchmarkScenario,
  listBenchmarkScenarios,
  type BenchmarkScenario,
} from "@/lib/api/capex-api";
import {
  buildComparison,
  collectCandidates,
  comparisonToCsv,
  listLicensePackageOptions,
  listYearOptionsFromCandidates,
  loadBenchmarkSession,
  numericValue,
  saveBenchmarkSession,
  type BenchmarkDimension,
} from "@/lib/benchmarking";

const DEFAULT_DIMENSION: BenchmarkDimension = "countries";

export function BenchmarkCompareWorkspace() {
  const { tree, settings, apiEnabled } = useCapex();
  const [hydrated, setHydrated] = useState(false);
  const [scenarios, setScenarios] = useState<BenchmarkScenario[]>([]);
  const [dimension, setDimension] =
    useState<BenchmarkDimension>(DEFAULT_DIMENSION);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [licensePackageFilter, setLicensePackageFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [baselineId, setBaselineId] = useState<string | null>(null);
  const [sortByPrice, setSortByPrice] = useState(false);
  const [showDeltas, setShowDeltas] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const saved = loadBenchmarkSession();
    if (saved) {
      if (saved.dimension) setDimension(saved.dimension);
      if (saved.selectedIds) setSelectedIds(saved.selectedIds);
      if (saved.licensePackageFilter != null) {
        setLicensePackageFilter(saved.licensePackageFilter);
      }
      if (saved.yearFilter != null) setYearFilter(saved.yearFilter);
      if (saved.baselineId !== undefined) setBaselineId(saved.baselineId);
      if (saved.sortByPrice != null) setSortByPrice(saved.sortByPrice);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!apiEnabled) return;
    void listBenchmarkScenarios()
      .then(setScenarios)
      .catch(() => undefined);
  }, [apiEnabled]);

  useEffect(() => {
    if (!hydrated) return;
    saveBenchmarkSession({
      dimension,
      selectedIds,
      licensePackageFilter,
      yearFilter,
      baselineId,
      sortByPrice,
    });
  }, [
    hydrated,
    dimension,
    selectedIds,
    licensePackageFilter,
    yearFilter,
    baselineId,
    sortByPrice,
  ]);

  const candidates = useMemo(
    () =>
      collectCandidates(dimension, tree, settings.catalogs, {
        licensePackageFilter:
          dimension === "packages" ? licensePackageFilter : undefined,
      }),
    [dimension, tree, settings.catalogs, licensePackageFilter],
  );

  const licenseOptions = useMemo(
    () => listLicensePackageOptions(settings.catalogs),
    [settings.catalogs],
  );

  const yearOptions = useMemo(
    () => listYearOptionsFromCandidates(candidates),
    [candidates],
  );

  const namePresets = useMemo(() => {
    if (dimension !== "deliveries" && dimension !== "domains") return [];
    const counts = new Map<string, string[]>();
    for (const c of candidates) {
      const base = c.label.split(" · ")[0]?.trim() || c.label;
      const list = counts.get(base) ?? [];
      list.push(c.id);
      counts.set(base, list);
    }
    return [...counts.entries()]
      .filter(([, ids]) => ids.length >= 2)
      .map(([name, ids]) => ({ name, ids }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [candidates, dimension]);

  // Drop selections that no longer exist for the active dimension/filter
  useEffect(() => {
    const valid = new Set(candidates.map((c) => c.id));
    setSelectedIds((prev) => {
      const next = prev.filter((id) => valid.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [candidates]);

  const comparison = useMemo(() => {
    let built = buildComparison(dimension, selectedIds, tree, settings.catalogs, {
      yearFilter:
        dimension === "vendorNodeNames" && yearFilter
          ? yearFilter
          : undefined,
    });

    const labels = new Map(candidates.map((c) => [c.id, c.label] as const));
    built = {
      ...built,
      columns: built.columns.map((col) => ({
        ...col,
        label: labels.get(col.id) ?? col.label,
      })),
    };

    if (sortByPrice && built.columns.length > 1) {
      const key = built.sortMetric;
      const sorted = [...built.columns].sort((a, b) => {
        const av = numericValue(a, key);
        const bv = numericValue(b, key);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return av - bv;
      });
      built = { ...built, columns: sorted };
    }
    return built;
  }, [
    dimension,
    selectedIds,
    tree,
    settings.catalogs,
    yearFilter,
    sortByPrice,
    candidates,
  ]);

  useEffect(() => {
    if (comparison.columns.length === 0) {
      setBaselineId(null);
      return;
    }
    if (
      !baselineId ||
      !comparison.columns.some((c) => c.id === baselineId)
    ) {
      setBaselineId(comparison.columns[0].id);
    }
  }, [comparison.columns, baselineId]);

  useEffect(() => {
    if (selectedIds.length < 2 && expanded) setExpanded(false);
  }, [selectedIds.length, expanded]);

  const handleDimensionChange = (next: BenchmarkDimension) => {
    setDimension(next);
    setSelectedIds([]);
    setLicensePackageFilter("");
    setYearFilter("");
    setBaselineId(null);
    setExpanded(false);
  };

  const exportCsv = () => {
    if (comparison.columns.length < 2) {
      toast.error("Select at least two items to export");
      return;
    }
    const csv = comparisonToCsv(comparison);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `capex-benchmark-${dimension}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const copyCsv = async () => {
    if (comparison.columns.length < 2) {
      toast.error("Select at least two items to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(comparisonToCsv(comparison));
      toast.success("Comparison copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const resultsProps = {
    comparison,
    baselineId,
    onSetBaseline: setBaselineId,
    showDeltas,
    onToggleDeltas: () => setShowDeltas((v) => !v),
    sortByPrice,
    onToggleSort: () => setSortByPrice((v) => !v),
    onCopy: () => void copyCsv(),
    onExport: exportCsv,
    expanded,
    onToggleExpand: () => setExpanded((v) => !v),
  } as const;

  const currentPayload = {
    dimension,
    selectedIds,
    licensePackageFilter,
    yearFilter,
    baselineId,
    sortByPrice,
    showDeltas,
  };

  const onSaveScenario = async () => {
    if (!apiEnabled) {
      toast.error("Saved scenarios require API mode");
      return;
    }
    const name = window.prompt("Scenario name");
    if (!name?.trim()) return;
    try {
      const created = await createBenchmarkScenario(name.trim(), currentPayload);
      setScenarios((prev) => [created, ...prev]);
      toast.success("Scenario saved");
    } catch {
      toast.error("Could not save scenario");
    }
  };

  const onLoadScenario = (scenario: BenchmarkScenario) => {
    const payload = scenario.payload as Partial<typeof currentPayload>;
    if (payload.dimension) setDimension(payload.dimension);
    if (payload.selectedIds) setSelectedIds(payload.selectedIds);
    if (payload.licensePackageFilter != null) {
      setLicensePackageFilter(payload.licensePackageFilter);
    }
    if (payload.yearFilter != null) setYearFilter(payload.yearFilter);
    if (payload.baselineId !== undefined) setBaselineId(payload.baselineId);
    if (payload.sortByPrice != null) setSortByPrice(payload.sortByPrice);
    if (payload.showDeltas != null) setShowDeltas(payload.showDeltas);
    toast.message(`Loaded “${scenario.name}”`);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {apiEnabled ? (
        <section className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
          <p className="mr-auto text-xs text-muted-foreground">
            Named comparisons saved to your workspace.
          </p>
          <Button size="sm" variant="outline" onClick={() => void onSaveScenario()}>
            Save scenario
          </Button>
          {scenarios.length > 0 ? (
            <select
              className="h-8 max-w-[220px] rounded-md border bg-background px-2 text-xs"
              defaultValue=""
              onChange={(e) => {
                const row = scenarios.find((s) => s.id === e.target.value);
                if (row) onLoadScenario(row);
                e.target.value = "";
              }}
            >
              <option value="">Load scenario…</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : null}
          {scenarios[0] ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const id = scenarios[0].id;
                if (!window.confirm(`Delete “${scenarios[0].name}”?`)) return;
                void deleteBenchmarkScenario(id)
                  .then(() => {
                    setScenarios((prev) => prev.filter((s) => s.id !== id));
                  })
                  .catch(() => toast.error("Could not delete scenario"));
              }}
            >
              Delete latest
            </Button>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">1. Choose a dimension</h2>
          <p className="text-xs text-muted-foreground">
            Compare one entity type at a time so price units stay comparable.
          </p>
        </div>
        <DimensionPicker value={dimension} onChange={handleDimensionChange} />
      </section>

      {(dimension === "packages" && licenseOptions.length > 0) ||
      (dimension === "vendorNodeNames" && yearOptions.length > 0) ||
      namePresets.length > 0 ? (
        <section className="flex flex-wrap gap-4">
          {dimension === "packages" ? (
            <div className="space-y-1.5">
              <Label htmlFor="lp-filter" className="text-xs">
                License package filter (optional)
              </Label>
              <select
                id="lp-filter"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={licensePackageFilter}
                onChange={(e) => {
                  setLicensePackageFilter(e.target.value);
                  setSelectedIds([]);
                }}
              >
                <option value="">All license packages</option>
                {licenseOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {dimension === "vendorNodeNames" ? (
            <div className="space-y-1.5">
              <Label htmlFor="year-filter" className="text-xs">
                License year (optional)
              </Label>
              <select
                id="year-filter"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All years</option>
                {yearOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {namePresets.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="name-preset" className="text-xs">
                Guided preset (same name across tree)
              </Label>
              <select
                id="name-preset"
                className="h-9 max-w-xs rounded-md border bg-background px-2 text-sm"
                defaultValue=""
                onChange={(e) => {
                  const preset = namePresets.find(
                    (p) => p.name === e.target.value,
                  );
                  if (!preset) return;
                  setSelectedIds(preset.ids.slice(0, 8));
                  e.target.value = "";
                }}
              >
                <option value="">Select a shared name…</option>
                {namePresets.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.ids.length})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-medium">2. Pick two or more items</h2>
            <p className="text-xs text-muted-foreground">
              {dimension === "packages" || dimension === "licensePackages"
                ? "Prices come from your catalog list prices."
                : "Prices are rolled up from CAPEX Tree quantities in this portfolio."}
            </p>
          </div>
          <BenchmarkItemPicker
            items={candidates}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
          />
        </section>

        <section className="min-w-0 space-y-4">
          {selectedIds.length < 2 ? (
            <div className="rounded-md border border-dashed px-4 py-16 text-center">
              <p className="text-sm font-medium">
                Select a dimension to compare prices
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose at least two{" "}
                {dimension.replace(/([A-Z])/g, " $1").toLowerCase()} to see a
                side-by-side price matrix.
              </p>
            </div>
          ) : expanded ? (
            <div className="rounded-md border border-dashed px-4 py-16 text-center">
              <p className="text-sm font-medium">
                Comparison is open in full screen
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use Exit full screen or press Esc to return here.
              </p>
            </div>
          ) : (
            <ComparisonResultsView {...resultsProps} />
          )}
        </section>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          showCloseButton
          className="flex h-[min(96vh,100dvh)] w-[min(96vw,100%)] max-w-none translate-x-[-50%] translate-y-[-50%] flex-col gap-3 overflow-hidden p-4 sm:max-w-none md:p-6"
          aria-describedby="benchmark-expand-desc"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Full screen price comparison</DialogTitle>
            <DialogDescription id="benchmark-expand-desc">
              Expanded comparison matrix. Press Escape or Exit full screen to
              return.
            </DialogDescription>
          </DialogHeader>
          <ComparisonResultsView
            {...resultsProps}
            className="min-h-0 flex-1"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
