"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  wrapperClassName?: string;
};

export function PasswordInput({
  className,
  wrapperClassName,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("relative", wrapperClassName)}>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className={cn("h-10 pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
