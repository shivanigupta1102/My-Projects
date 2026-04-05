"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
  Scan,
} from "lucide-react";
import { useState } from "react";
import { ConfidenceBadge } from "@/components/product/ConfidenceBadge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface EvidenceItem {
  id: string;
  snippet: string | null;
  explanation: string;
  confidence: number;
  sourceHint?: string;
}

interface EvidencePanelProps {
  evidences: EvidenceItem[];
  className?: string;
}

function sourceIcon(hint?: string) {
  const h = (hint ?? "").toLowerCase();
  if (h.includes("image") || h.includes("vision")) return FileImage;
  if (h.includes("csv") || h.includes("sheet")) return FileSpreadsheet;
  if (h.includes("url") || h.includes("scrape")) return Globe;
  if (h.includes("ocr")) return Scan;
  return FileText;
}

export function EvidencePanel({ evidences, className }: EvidencePanelProps) {
  const [openId, setOpenId] = useState<string | null>(
    evidences[0]?.id ?? null,
  );

  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)}>
      <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Evidence
      </div>
      <ScrollArea className="max-h-[320px]">
        <ul className="divide-y divide-border p-2">
          {evidences.map((ev) => {
            const Icon = sourceIcon(ev.sourceHint);
            const expanded = openId === ev.id;
            return (
              <li key={ev.id} className="py-2">
                <button
                  type="button"
                  onClick={() => setOpenId(expanded ? null : ev.id)}
                  className="flex w-full items-start gap-2 rounded-md text-left hover:bg-surface-hover"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ConfidenceBadge confidence={ev.confidence} />
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-foreground-muted transition-transform",
                          expanded && "rotate-180",
                        )}
                      />
                    </div>
                    <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
                      {ev.explanation}
                    </p>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded border border-border-light bg-background/40 p-2 font-mono text-xs text-foreground">
                        {ev.snippet ?? (
                          <span className="text-foreground-muted italic">
                            No snippet preview
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 text-xs"
                        onClick={() => setOpenId(expanded ? null : ev.id)}
                      >
                        {expanded ? "Collapse source" : "Expand source"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
