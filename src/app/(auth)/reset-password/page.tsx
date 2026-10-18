"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/api/auth-api";
import { CapexApiError } from "@/lib/api/client";
import { isPasswordValid } from "@/lib/password";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const passwordOk = useMemo(() => isPasswordValid(password), [password]);
  const match = confirm.length > 0 && password === confirm;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !passwordOk || !match) return;
    setPending(true);
    try {
      await resetPassword(token, password);
      toast.success("Password updated");
      router.replace("/login");
    } catch (error) {
      toast.error("Reset failed", {
        description:
          error instanceof CapexApiError
            ? error.message
            : "Invalid or expired link",
      });
      setPending(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#10262c]/85 p-7 text-[#d5e4e8]">
        <h1 className="text-xl font-semibold text-white">Invalid reset link</h1>
        <Link href="/forgot-password" className="text-[#f0b429] underline">
          Request a new one
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#10262c]/85 p-7"
    >
      <h1 className="text-2xl font-semibold text-white">Choose a new password</h1>
      <div className="space-y-2">
        <Label className="text-[#d5e4e8]">Password</Label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-white/15 bg-white/5 text-white"
        />
        <PasswordRequirements password={password} />
      </div>
      <div className="space-y-2">
        <Label className="text-[#d5e4e8]">Confirm</Label>
        <PasswordInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="border-white/15 bg-white/5 text-white"
        />
      </div>
      <Button
        type="submit"
        disabled={pending || !passwordOk || !match}
        className="h-10 w-full bg-[#f0b429] text-[#1a1205] hover:bg-[#f7c856]"
      >
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#9bb4bb]">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
