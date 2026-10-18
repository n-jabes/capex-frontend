"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCapex } from "@/context/CapexContext";
import { logout } from "@/lib/api/auth-api";
import { roleLabel } from "@/lib/roles";

const FLUSH_TIMEOUT_MS = 1500;
const SYNCED_VISIBLE_MS = 2000;

function formatSavedAt(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function syncLabel(
  status: ReturnType<typeof useCapex>["syncStatus"],
  savedAt: Date | null,
) {
  switch (status) {
    case "local":
      return "Local";
    case "loading":
      return "Loading…";
    case "saving":
      return "Saving…";
    case "synced":
      return savedAt ? `Saved ${formatSavedAt(savedAt)}` : "Saved";
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
    organizationName,
  } = useCapex();

  const [signingOut, setSigningOut] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [badgeVisible, setBadgeVisible] = useState(
    () => syncStatus !== "synced" && syncStatus !== "local",
  );

  useEffect(() => {
    if (
      syncStatus === "saving" ||
      syncStatus === "loading" ||
      syncStatus === "error" ||
      syncStatus === "conflict"
    ) {
      setBadgeVisible(true);
      return;
    }

    if (syncStatus === "synced") {
      const at = new Date();
      setSavedAt(at);
      setBadgeVisible(true);
      const timer = window.setTimeout(() => {
        setBadgeVisible(false);
      }, SYNCED_VISIBLE_MS);
      return () => window.clearTimeout(timer);
    }

    // Idle local mode — stay quiet.
    setBadgeVisible(false);
  }, [syncStatus]);

  const onLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);

    let flushTimedOut = false;
    let flushFinished = false;
    const flushPromise = flushPendingSaves()
      .catch(() => undefined)
      .finally(() => {
        flushFinished = true;
      });

    await Promise.race([
      flushPromise,
      new Promise<void>((resolve) => {
        window.setTimeout(() => {
          if (!flushFinished) flushTimedOut = true;
          resolve();
        }, FLUSH_TIMEOUT_MS);
      }),
    ]);

    try {
      await logout();
      toast.success("Signed out");
    } catch {
      toast.message("Signed out locally");
    }

    if (flushTimedOut) {
      toast.message("Signed out before all saves finished", {
        description: "Some recent edits may not have synced.",
      });
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

  const showBadge =
    badgeVisible ||
    syncStatus === "error" ||
    syncStatus === "conflict" ||
    syncStatus === "saving" ||
    syncStatus === "loading";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          CV
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight">
            Axian Telecom Capacity and Pricing
          </h1>
          {apiEnabled && organizationName ? (
            <p className="truncate text-xs text-muted-foreground">
              {organizationName}
              {membershipRole ? ` · ${roleLabel(membershipRole)}` : ""}
            </p>
          ) : null}
        </div>
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
              void reloadFromServer();
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
        {showBadge ? (
          <Badge
            variant={
              syncStatus === "error" || syncStatus === "conflict"
                ? "destructive"
                : "secondary"
            }
            className="font-normal transition-opacity"
          >
            {syncLabel(syncStatus, savedAt)}
            {apiEnabled &&
            portfolioVersion != null &&
            (syncStatus === "saving" ||
              syncStatus === "error" ||
              syncStatus === "conflict")
              ? ` · v${portfolioVersion}`
              : ""}
          </Badge>
        ) : null}
        {apiEnabled ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={signingOut}
            onClick={() => void onLogout()}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
