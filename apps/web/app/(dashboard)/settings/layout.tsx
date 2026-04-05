"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/settings/channels", label: "Channels" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/billing", label: "Billing" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row"
    >
      <aside className="shrink-0 lg:w-52">
        <h1 className="mb-4 text-lg font-semibold">Settings</h1>
        <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                    : "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </motion.div>
  );
}
