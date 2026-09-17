"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/benchmarking", label: "Compare", exact: true },
  { href: "/benchmarking/traffic", label: "Input Current Traffic", exact: false },
] as const;

export default function BenchmarkingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      <div className="border-b bg-background px-4 py-4 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Benchmarking</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Compare prices across your portfolio and catalogs.
        </p>
        <nav className="mt-4 flex gap-1 border-b-0">
          {TABS.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
