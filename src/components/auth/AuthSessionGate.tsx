"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe } from "@/lib/api/auth-api";
import { CapexApiError } from "@/lib/api/client";
import { isCapexApiConfigured, isSameOriginApiMode } from "@/lib/api/config";

type AuthSessionGateProps = {
  /** require = must be signed in; guest = redirect away if already signed in */
  mode: "require" | "guest";
  children: React.ReactNode;
};

/**
 * Client session gate.
 * - Same-origin: middleware already enforces `capex_auth`; guest pages skip the spinner.
 *   Require mode still calls `/me` so expired access tokens refresh before the shell mounts.
 * - Cross-origin: middleware cannot see Railway cookies — this gate enforces routes.
 */
export function AuthSessionGate({ mode, children }: AuthSessionGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sameOrigin = isSameOriginApiMode();
  const [ready, setReady] = useState(
    !isCapexApiConfigured() || (sameOrigin && mode === "guest"),
  );

  useEffect(() => {
    if (!isCapexApiConfigured()) {
      setReady(true);
      return;
    }

    // Guest routes: middleware already redirects signed-in users when cookies are first-party.
    if (sameOrigin && mode === "guest") {
      setReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await getMe();
        if (cancelled) return;
        if (mode === "guest") {
          router.replace("/capex-tree");
          return;
        }
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        const unauthorized =
          error instanceof CapexApiError && error.status === 401;
        if (mode === "require") {
          const next = encodeURIComponent(pathname || "/capex-tree");
          router.replace(`/login?next=${next}`);
          return;
        }
        if (unauthorized || mode === "guest") {
          setReady(true);
          return;
        }
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, pathname, router, sameOrigin]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-[#f0b429]" />
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
