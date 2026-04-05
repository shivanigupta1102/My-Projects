"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  CheckCircle2,
  ArrowUpCircle,
  LayoutDashboard,
  Activity,
  Package,
  Upload,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  icon: typeof Search;
  section: string;
  shortcut?: string;
  badge?: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const items: CommandItem[] = [
    {
      id: "ingest",
      label: "Ingest new product",
      icon: Plus,
      section: "Quick Actions",
      shortcut: "\u2318N",
      action: () => router.push("/ingest"),
    },
    {
      id: "review",
      label: "Open review queue",
      icon: CheckCircle2,
      section: "Quick Actions",
      shortcut: "\u2318R",
      action: () => router.push("/review"),
    },
    {
      id: "publish",
      label: "Publish ready products",
      icon: ArrowUpCircle,
      section: "Quick Actions",
      shortcut: "\u2318P",
      action: () => router.push("/products"),
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      section: "Navigation",
      action: () => router.push("/dashboard"),
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      section: "Navigation",
      action: () => router.push("/products"),
    },
    {
      id: "monitoring",
      label: "Monitoring",
      icon: Activity,
      section: "Navigation",
      action: () => router.push("/monitoring"),
    },
    {
      id: "bulk",
      label: "Bulk Operations",
      icon: Upload,
      section: "Navigation",
      action: () => router.push("/bulk"),
    },
    {
      id: "audit",
      label: "Audit Log",
      icon: FileText,
      section: "Navigation",
      action: () => router.push("/audit"),
    },
  ];

  const filtered = query
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.section.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  const sections = Array.from(new Set(filtered.map((i) => i.section)));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
        setOpen(false);
      }
    },
    [filtered, selectedIndex],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-bg-surface px-3 py-1.5 text-xs text-text-tertiary transition-colors hover:border-border-bright hover:text-text-secondary"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search products, actions...</span>
        <kbd className="ml-4 rounded border border-border px-1.5 py-0.5 font-mono text-2xs text-text-tertiary">
          {"\u2318"}K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28, mass: 0.8 }}
              className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-xl"
            >
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Search className="h-4 w-4 text-text-tertiary" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products, actions, channels..."
                  className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                />
                <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-2xs text-text-tertiary">
                  esc
                </kbd>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {sections.map((section) => (
                  <div key={section} className="mb-2">
                    <div className="px-2 pb-1 pt-2 text-2xs font-semibold uppercase tracking-widest text-text-tertiary">
                      {section}
                    </div>
                    {filtered
                      .filter((item) => item.section === section)
                      .map((item) => {
                        const flatIdx = filtered.indexOf(item);
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              item.action();
                              setOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                              flatIdx === selectedIndex
                                ? "bg-indigo-500/15 text-text-primary"
                                : "text-text-secondary hover:bg-bg-overlay",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0 text-text-tertiary" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && (
                              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-2xs font-medium text-indigo-300">
                                {item.badge}
                              </span>
                            )}
                            {item.shortcut && (
                              <kbd className="font-mono text-2xs text-text-tertiary">
                                {item.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="py-8 text-center text-sm text-text-tertiary">
                    No results found
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
