"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCapex } from "@/context/CapexContext";
import { logout } from "@/lib/api/auth-api";

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
    apiEnabled,
    syncStatus,
    syncError,
    portfolioVersion,
    reloadFromServer,
  } = useCapex();

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      // clear client route anyway
    }
    router.replace("/login");
    router.refresh();
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
      <div className="flex max-w-[60%] items-center gap-2">
        {syncError ? (
          <span
            className="hidden truncate text-xs text-destructive sm:inline"
            title={syncError}
          >
            {syncError}
          </span>
        ) : null}
        {apiEnabled && (syncStatus === "error" || syncStatus === "conflict") ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void reloadFromServer()}
          >
            Reload
          </Button>
        ) : null}
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
