"use client";

import { Loader2 } from "lucide-react";
import { CapexErrorBoundary } from "@/components/CapexErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { CapexProvider, useCapex } from "@/context/CapexContext";

function DashboardGate({ children }: { children: React.ReactNode }) {
  const { apiEnabled, isHydrated, syncStatus, syncError, reloadFromServer } =
    useCapex();

  if (apiEnabled && (!isHydrated || syncStatus === "loading")) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading Capex workspace…
        </p>
      </div>
    );
  }

  if (apiEnabled && syncStatus === "error") {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="text-lg font-semibold">Unable to load workspace</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {syncError || "The Capex API did not return portfolio data."}
        </p>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => void reloadFromServer()}
        >
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CapexProvider>
      <AppShell>
        <CapexErrorBoundary>
          <DashboardGate>{children}</DashboardGate>
        </CapexErrorBoundary>
      </AppShell>
    </CapexProvider>
  );
}
