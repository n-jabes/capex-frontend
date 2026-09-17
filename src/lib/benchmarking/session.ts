import type { BenchmarkDimension } from "./types";

const STORAGE_KEY = "capex-benchmarking-state-v1";

export type BenchmarkSessionState = {
  dimension: BenchmarkDimension;
  selectedIds: string[];
  licensePackageFilter: string;
  yearFilter: string;
  baselineId: string | null;
  sortByPrice: boolean;
};

export function loadBenchmarkSession(): Partial<BenchmarkSessionState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<BenchmarkSessionState>;
  } catch {
    return null;
  }
}

export function saveBenchmarkSession(state: BenchmarkSessionState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}
