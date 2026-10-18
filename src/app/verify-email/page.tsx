"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { verifyEmail } from "@/lib/api/auth-api";
import { CapexApiError } from "@/lib/api/client";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("Verifying…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    void (async () => {
      try {
        await verifyEmail(token);
        setStatus("ok");
        setMessage("Email verified. You can continue using Capex.");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof CapexApiError
            ? error.message
            : "Invalid or expired verification link.",
        );
      }
    })();
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">
        {status === "ok" ? "Email verified" : "Email verification"}
      </h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href="/capex-tree" className="text-sm font-medium underline">
        Continue to app
      </Link>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="p-6 text-sm">Verifying…</main>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
