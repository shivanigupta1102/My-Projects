"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  Package,
  Settings,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/auth";

const navGroups: {
  label: string;
  items: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }[];
}[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/products", label: "Products", icon: Package },
      { href: "/ingest", label: "Ingest", icon: Upload },
      { href: "/bulk", label: "Bulk Ops", icon: Layers },
    ],
  },
  {
    label: "Publishing",
    items: [
      { href: "/review", label: "Review Queue", icon: ClipboardCheck },
      { href: "/channels", label: "Channels", icon: Globe },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/monitoring", label: "Monitoring", icon: Activity },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/audit", label: "Audit Log", icon: FileText },
      { href: "/settings/channels", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="flex h-screen shrink-0 flex-col border-r border-border bg-surface"
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
            LP
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="min-w-0"
              >
                <div className="truncate text-sm font-semibold text-foreground">
                  ListingPilot AI
                </div>
                <div className="truncate text-[10px] uppercase tracking-wider text-accent">
                  Operator
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-foreground-muted"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                {group.label}
              </div>
            )}
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isSettingsNav = item.href.startsWith("/settings");
                const active =
                  pathname === item.href ||
                  (isSettingsNav && pathname.startsWith("/settings")) ||
                  (item.href !== "/dashboard" &&
                    item.href !== "/" &&
                    !isSettingsNav &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                      active
                        ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                        : "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-accent" : "",
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </ScrollArea>

      <Separator />
      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border border-border bg-background/50 p-2",
            collapsed && "justify-center p-1",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-medium text-foreground">
            {(user?.name ?? user?.email ?? "?").slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-foreground">
                {user?.name ?? "Operator"}
              </div>
              <div className="truncate text-[10px] text-foreground-muted">
                {user?.email ?? "Not signed in"}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
