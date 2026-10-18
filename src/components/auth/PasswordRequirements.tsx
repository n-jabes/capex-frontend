"use client";

import { Check, Circle } from "lucide-react";
import { evaluatePassword } from "@/lib/password";
import { cn } from "@/lib/utils";

export function PasswordRequirements({ password }: { password: string }) {
  const results = evaluatePassword(password);
  const started = password.length > 0;

  return (
    <ul className="space-y-1.5 rounded-lg border border-white/10 bg-black/20 p-3">
      {results.map((rule) => {
        const passed = rule.passed;
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              !started && "text-[#9bb4bb]",
              started && passed && "text-emerald-400",
              started && !passed && "text-amber-300/90",
            )}
          >
            {started && passed ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 opacity-70" />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
