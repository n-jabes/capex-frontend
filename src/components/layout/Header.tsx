"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCapex } from "@/context/CapexContext";
import { logout, resendVerification } from "@/lib/api/auth-api";
import { enqueueExportPortfolioJob } from "@/lib/api/capex-api";
import { trackJob, waitForTrackedJob } from "@/lib/job-tracker";
import { getStoredLocale, t, type Locale } from "@/lib/i18n";
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
    portfolios,
    reloadFromServer,
    flushPendingSaves,
    clearSessionState,
    canMutate,
    membershipRole,
    organizationName,
    emailVerifiedAt,
    switchPortfolio,
    createPortfolioScenario,
    cloneActivePortfolio,
  } = useCapex();

  const [locale, setLocale] = useState<Locale>("en");
  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [badgeVisible, setBadgeVisible] = useState(
    () => syncStatus !== "synced" && syncStatus !== "local",
  );

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

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
    void (async () => {
      if (!apiEnabled || !portfolioId) {
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
        return;
      }

      setExporting(true);
      try {
        toast.message("Export started", {
          description: "Progress is shown under the header.",
        });
        const queued = await enqueueExportPortfolioJob({ portfolioId });
        trackJob(queued, "Preparing export…");
        const finished = await waitForTrackedJob(queued.id);
        const result = finished.result as {
          filename?: string;
          body?: unknown;
        } | null;
        const blob = new Blob([JSON.stringify(result?.body ?? {}, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download =
          result?.filename ||
          `capex-portfolio-${portfolioId}-v${portfolioVersion ?? 0}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success("Export downloaded");
      } catch (error) {
        toast.error("Export failed", {
          description:
            error instanceof Error ? error.message : "Unable to export",
        });
      } finally {
        setExporting(false);
      }
    })();
  };

  const showBadge =
    badgeVisible ||
    syncStatus === "error" ||
    syncStatus === "conflict" ||
    syncStatus === "saving" ||
    syncStatus === "loading";

  return (
    <div className="shrink-0 border-b bg-card">
      {apiEnabled && !emailVerifiedAt ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/10 px-6 py-1.5 text-xs text-amber-950 dark:text-amber-100">
          <span>{t("auth.verifyBanner", locale)}</span>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              void resendVerification()
                .then((result) => {
                  if (result.devVerifyUrl) {
                    toast.message("Dev verify link", {
                      description: result.devVerifyUrl,
                    });
                  } else {
                    toast.success("Verification email sent");
                  }
                })
                .catch(() => toast.error("Could not resend verification"));
            }}
          >
            {t("auth.resend", locale)}
          </Button>
        </div>
      ) : null}
      <header className="flex h-14 items-center justify-between px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            CV
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight">
              {organizationName || "Axian Telecom Capacity and Pricing"}
            </h1>
            {apiEnabled ? (
              <p className="truncate text-xs text-muted-foreground">
                {membershipRole ? roleLabel(membershipRole) : ""}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex max-w-[70%] items-center gap-2">
          {apiEnabled && portfolios.length > 0 ? (
            <div className="hidden items-center gap-1 md:flex">
              <Select
                value={portfolioId ?? undefined}
                onValueChange={(value) => {
                  if (value) void switchPortfolio(value);
                }}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder={t("header.portfolio", locale)} />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canMutate ? (
                <>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      const name = window.prompt("New portfolio name");
                      if (!name?.trim()) return;
                      void createPortfolioScenario(name.trim()).then(() =>
                        toast.success("Portfolio created"),
                      );
                    }}
                  >
                    New
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      void cloneActivePortfolio().then(() =>
                        toast.success("Portfolio cloned"),
                      );
                    }}
                  >
                    Clone
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
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
              {t("header.readOnly", locale)}
              {membershipRole ? ` · ${roleLabel(membershipRole)}` : ""}
            </Badge>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={onExport}
          >
            {exporting ? "Exporting…" : t("header.export", locale)}
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
              {signingOut
                ? t("header.signingOut", locale)
                : t("header.signOut", locale)}
            </Button>
          ) : null}
        </div>
      </header>
    </div>
  );
}
