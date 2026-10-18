"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCapex } from "@/context/CapexContext";
import { logout } from "@/lib/api/auth-api";
import { roleLabel } from "@/lib/roles";

function syncLabel(status: ReturnType<typeof useCapex>["syncStatus"]) {
  switch (status) {
    case "local":
      return "Local storage";
    case "loading":
      return "Loading…";
    case "saving":
      return "Saving…";
    case "synced":
      return "Synced";
    case "conflict":
      return "Conflict — reloaded";
    case "error":
      return "Sync error";
    default:
      return status;
  }
}

export function Header() {
  const router = useRouter();
  const {
    tree,
    settings,
    apiEnabled,
    syncStatus,
    syncError,
    portfolioId,
    portfolioVersion,
    reloadFromServer,
    flushPendingSaves,
    clearSessionState,
    canMutate,
    membershipRole,
  } = useCapex();

  const onLogout = async () => {
    try {
      await flushPendingSaves();
    } catch {
      // best-effort flush
    }
    try {
      await logout();
      toast.success("Signed out");
    } catch {
      toast.message("Signed out locally");
    }
    clearSessionState();
    router.replace("/login");
    router.refresh();
  };

  const onExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      portfolioId,
      portfolioVersion,
      settings,
      tree,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `capex-portfolio-${portfolioId ?? "local"}-v${portfolioVersion ?? 0}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          CV
        </div>
        <h1 className="text-base font-semibold tracking-tight">
          Axian Telecom Capacity and Pricing
        </h1>
      </div>
      <div className="flex max-w-[65%] items-center gap-2">
        {syncError ? (
          <span
            className="hidden truncate text-xs text-destructive lg:inline"
            title={syncError}
          >
            {syncError}
          </span>
        ) : null}
        {apiEnabled && (syncStatus === "error" || syncStatus === "conflict") ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void reloadFromServer().then(() =>
                toast.message("Reloaded from server"),
              );
            }}
          >
            Reload
          </Button>
        ) : null}
        {apiEnabled && !canMutate ? (
          <Badge variant="outline" className="font-normal text-amber-700">
            Read-only{membershipRole ? ` · ${roleLabel(membershipRole)}` : ""}
          </Badge>
        ) : null}
        <Button size="sm" variant="outline" onClick={onExport}>
          Export JSON
        </Button>
        <Badge
          variant={
            syncStatus === "error" || syncStatus === "conflict"
              ? "destructive"
              : "secondary"
          }
          className="font-normal"
        >
          {syncLabel(syncStatus)}
          {apiEnabled && portfolioVersion != null
            ? ` · v${portfolioVersion}`
            : ""}
        </Badge>
        {apiEnabled ? (
          <Button size="sm" variant="ghost" onClick={() => void onLogout()}>
            Sign out
          </Button>
        ) : null}
      </div>
    </header>
  );
}
