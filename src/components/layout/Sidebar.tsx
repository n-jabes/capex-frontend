"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Network,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getStoredLocale,
  setStoredLocale,
  t,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navItems: Array<{
  href: string;
  labelKey: MessageKey;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/capex-tree", labelKey: "nav.tree", icon: Network },
  { href: "/benchmarking", labelKey: "nav.benchmarking", icon: BarChart3 },
  {
    href: "/input-current-traffic",
    labelKey: "nav.traffic",
    icon: Activity,
  },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  const onLocale = (next: Locale) => {
    setLocale(next);
    setStoredLocale(next);
  };

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className="flex items-center justify-end p-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2 pb-4">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const label = t(labelKey, locale);
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      {!collapsed ? (
        <div className="flex gap-1 border-t p-2">
          <Button
            type="button"
            size="xs"
            variant={locale === "en" ? "secondary" : "ghost"}
            onClick={() => onLocale("en")}
          >
            EN
          </Button>
          <Button
            type="button"
            size="xs"
            variant={locale === "fr" ? "secondary" : "ghost"}
            onClick={() => onLocale("fr")}
          >
            FR
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
