"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api/auth-api";
import { CapexApiError } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      const result = await forgotPassword(email);
      setDone(true);
      setDevUrl(result.devResetUrl ?? null);
      toast.success("Check your email", { description: result.message });
    } catch (error) {
      toast.error("Request failed", {
        description:
          error instanceof CapexApiError ? error.message : "Try again later",
      });
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
          Account recovery
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Forgot password
        </h1>
        <p className="mt-1.5 text-sm text-[#9bb4bb]">
          We&apos;ll email a reset link if that address has an account.
        </p>
      </div>

      {done ? (
        <div className="space-y-3 text-sm text-[#d5e4e8]">
          <p>If the account exists, a reset link is on its way.</p>
          {devUrl ? (
            <p className="break-all rounded-md border border-white/10 bg-white/5 p-2 text-xs">
              Dev link:{" "}
              <Link href={devUrl} className="text-[#f0b429] underline">
                {devUrl}
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#d5e4e8]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            disabled={pending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 border-white/15 bg-white/5 text-white"
          />
          <Button
            type="submit"
            disabled={pending}
            className="mt-2 h-10 w-full bg-[#f0b429] text-[#1a1205] hover:bg-[#f7c856]"
          >
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-[#9bb4bb]">
        <Link href="/login" className="text-[#f0b429] hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
