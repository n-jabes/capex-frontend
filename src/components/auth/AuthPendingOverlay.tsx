"use client";

import { Loader2 } from "lucide-react";

export function AuthPendingOverlay({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-[#0b1a1e]/78 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-[#f0b429]" aria-hidden />
      <p className="mt-3 text-sm font-medium text-white">{title}</p>
      {detail ? (
        <p className="mt-1 max-w-[16rem] text-center text-xs text-[#9bb4bb]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
