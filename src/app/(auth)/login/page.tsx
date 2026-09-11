"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api/auth-api";
import { CapexApiError } from "@/lib/api/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(email, password);
      const next = searchParams.get("next") || "/capex-tree";
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof CapexApiError
          ? err.message
          : "Unable to sign in. Check API URL and credentials.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#10262c]/85 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#f0b429]">
          Welcome back
        </p>
        <h1
          className="mt-2 text-2xl font-semibold tracking-tight text-white"
          style={{ fontFamily: "var(--font-auth-display), sans-serif" }}
        >
          Sign in
        </h1>
        <p className="mt-1.5 text-sm text-[#9bb4bb]">
          Access your Capex portfolio and planning workspace.
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
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
          placeholder="Enter your password"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-10 w-full bg-[#f0b429] text-[#1a1205] hover:bg-[#f7c856]"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-[#9bb4bb]">
        No account?{" "}
        <Link
          href="/register"
          className="font-medium text-[#f0b429] underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-[#9bb4bb]">Loading sign-in…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
