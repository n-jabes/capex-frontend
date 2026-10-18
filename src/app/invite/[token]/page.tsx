"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMe, login, register } from "@/lib/api/auth-api";
import {
  acceptInvitation,
  getInvitationPreview,
  type InvitePreview,
} from "@/lib/api/capex-api";
import { CapexApiError } from "@/lib/api/client";
import { isCapexApiConfigured } from "@/lib/api/config";
import { redirectAfterAuth } from "@/lib/auth-navigation";
import { isPasswordValid } from "@/lib/password";
import { roleLabel } from "@/lib/roles";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const passwordOk = useMemo(() => isPasswordValid(password), [password]);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (!isCapexApiConfigured() || !token) {
      setLoadError("API is not configured.");
      return;
    }
    void (async () => {
      try {
        setPreview(await getInvitationPreview(token));
      } catch (error) {
        setLoadError(
          error instanceof CapexApiError
            ? error.message
            : "Invitation not found or expired",
        );
      }
      try {
        const me = await getMe();
        setSessionEmail(me.email);
      } catch {
        setSessionEmail(null);
      }
    })();
  }, [token]);

  const onRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (!preview || !token) return;
    if (!passwordOk || !passwordsMatch) {
      toast.error("Check password requirements");
      return;
    }
    setPending(true);
    try {
      await register(preview.email, password, token);
      toast.success("Joined workspace", {
        description: preview.organizationName,
      });
      redirectAfterAuth("/capex-tree");
    } catch (error) {
      toast.error("Could not join", {
        description:
          error instanceof CapexApiError
            ? error.message
            : "Registration failed",
      });
      setPending(false);
    }
  };

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!preview || !token) return;
    setPending(true);
    try {
      await login(preview.email, password);
      await acceptInvitation(token);
      toast.success("Joined workspace");
      redirectAfterAuth("/capex-tree");
    } catch (error) {
      toast.error("Could not join", {
        description:
          error instanceof CapexApiError ? error.message : "Login failed",
      });
      setPending(false);
    }
  };

  const onAcceptLoggedIn = async () => {
    if (!token) return;
    setPending(true);
    try {
      await acceptInvitation(token);
      toast.success("Joined workspace");
      redirectAfterAuth("/capex-tree");
    } catch (error) {
      toast.error("Could not accept invite", {
        description:
          error instanceof CapexApiError ? error.message : "Request failed",
      });
      setPending(false);
    }
  };

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-xl font-semibold">Invitation unavailable</h1>
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Link
          href="/login"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          Go to sign in
        </Link>
      </main>
    );
  }

  if (!preview) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading invitation…
      </main>
    );
  }

  const emailMismatch =
    sessionEmail &&
    sessionEmail.toLowerCase() !== preview.email.toLowerCase();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6">
      <div>
        <p className="text-sm text-muted-foreground">You are invited to</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {preview.organizationName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          as <strong>{roleLabel(preview.role)}</strong> · {preview.email}
        </p>
      </div>

      {sessionEmail && !emailMismatch ? (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm">
            Signed in as <strong>{sessionEmail}</strong>
          </p>
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => void onAcceptLoggedIn()}
          >
            {pending ? "Joining…" : "Accept invitation"}
          </Button>
        </div>
      ) : null}

      {emailMismatch ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          You are signed in as {sessionEmail}, but this invite is for{" "}
          {preview.email}. Sign out and use the invited email.
        </p>
      ) : null}

      {!sessionEmail ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              className={
                mode === "register" ? "font-semibold underline" : "opacity-70"
              }
              onClick={() => setMode("register")}
            >
              Create account
            </button>
            <span className="opacity-40">·</span>
            <button
              type="button"
              className={
                mode === "login" ? "font-semibold underline" : "opacity-70"
              }
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
          </div>

          <form
            className="space-y-3"
            onSubmit={mode === "register" ? onRegister : onLogin}
          >
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={preview.email} disabled readOnly />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-password">Password</Label>
              <PasswordInput
                id="invite-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
              />
            </div>
            {mode === "register" ? (
              <>
                <PasswordRequirements password={password} />
                <div className="space-y-1">
                  <Label htmlFor="invite-confirm">Confirm password</Label>
                  <PasswordInput
                    id="invite-confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={
                pending ||
                (mode === "register" && (!passwordOk || !passwordsMatch))
              }
            >
              {pending
                ? "Working…"
                : mode === "register"
                  ? "Create account & join"
                  : "Sign in & join"}
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="text-sm text-muted-foreground underline"
        onClick={() => router.push("/")}
      >
        Back to home
      </button>
    </main>
  );
}
