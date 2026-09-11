"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthPendingOverlay } from "@/components/auth/AuthPendingOverlay";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/api/auth-api";
import { CapexApiError } from "@/lib/api/client";
import { redirectAfterAuth } from "@/lib/auth-navigation";
import { isPasswordValid } from "@/lib/password";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const passwordOk = useMemo(() => isPasswordValid(password), [password]);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const confirmTouched = confirmPassword.length > 0;
  const canSubmit = passwordOk && passwordsMatch && !pending;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordOk) {
      setError("Password does not meet all requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await register(email, password);
      toast.success("Account created", {
        description: "Your Capex portfolio is ready.",
      });
      redirectAfterAuth("/capex-tree");
    } catch (err) {
      const message =
        err instanceof CapexApiError
          ? err.message
          : "Unable to register. Ensure the API is running and Capex_1 is seeded.";
      setError(message);
      toast.error("Registration failed", { description: message });
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="relative w-full max-w-md space-y-5 overflow-hidden rounded-2xl border border-white/10 bg-[#10262c]/85 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md"
    >
      {pending ? (
        <AuthPendingOverlay
          title="Provisioning Capex portfolio…"
          detail="Cloning Capex_1 catalogs and creating your workspace. This can take a few seconds."
        />
      ) : null}

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#f0b429]">
          Get started
        </p>
        <h1
          className="mt-2 text-2xl font-semibold tracking-tight text-white"
          style={{ fontFamily: "var(--font-auth-display), sans-serif" }}
        >
          Create account
        </h1>
        <p className="mt-1.5 text-sm text-[#9bb4bb]">
          We&apos;ll provision your Capex portfolio from the Capex_1 template.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#d5e4e8]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 border-white/15 bg-white/5 text-white placeholder:text-white/35"
          placeholder="you@company.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#d5e4e8]">
          Password
        </Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          required
          disabled={pending}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
          placeholder="Create a strong password"
          aria-describedby="password-requirements"
        />
        <div id="password-requirements">
          <PasswordRequirements password={password} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-[#d5e4e8]">
          Confirm password
        </Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          required
          disabled={pending}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={cn(
            "border-white/15 bg-white/5 text-white placeholder:text-white/35",
            confirmTouched &&
              !passwordsMatch &&
              "border-amber-400/50 focus-visible:border-amber-400",
            confirmTouched &&
              passwordsMatch &&
              "border-emerald-400/40 focus-visible:border-emerald-400",
          )}
          placeholder="Re-enter your password"
        />
        {confirmTouched ? (
          <p
            className={cn(
              "text-xs",
              passwordsMatch ? "text-emerald-400" : "text-amber-300",
            )}
          >
            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-10 w-full bg-[#f0b429] text-[#1a1205] hover:bg-[#f7c856]"
        disabled={!canSubmit}
      >
        {pending ? "Creating…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-[#9bb4bb]">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-[#f0b429] underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
