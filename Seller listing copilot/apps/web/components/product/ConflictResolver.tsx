"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { ConfidenceBadge } from "@/components/product/ConfidenceBadge";
import { EvidencePanel } from "@/components/product/EvidencePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ConflictCandidate {
  id: string;
  value: string;
  sourceLabel: string;
  confidence: number;
  evidences: Array<{
    id: string;
    snippet: string | null;
    explanation: string;
    confidence: number;
  }>;
}

export interface ConflictResolverProps {
  fieldName: string;
  candidates: ConflictCandidate[];
  onResolve: (candidateId: string) => void;
  className?: string;
}

export function ConflictResolver({
  fieldName,
  candidates,
  onResolve,
  className,
}: ConflictResolverProps) {
  const [activeId, setActiveId] = useState<string | null>(
    candidates[0]?.id ?? null,
  );

  const active = candidates.find((c) => c.id === activeId) ?? candidates[0];

  return (
    <Card className={cn("border-border bg-surface", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Resolve conflict · {fieldName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-2">
          {candidates.map((c) => (
            <motion.button
              key={c.id}
              type="button"
              layout
              onClick={() => setActiveId(c.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                activeId === c.id
                  ? "border-accent bg-accent/10"
                  : "border-border hover:bg-surface-hover",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground-muted">
                  {c.sourceLabel}
                </span>
                <ConfidenceBadge confidence={c.confidence} />
              </div>
              <p className="mt-2 font-mono text-sm text-foreground">{c.value}</p>
            </motion.button>
          ))}
        </div>
        {active && (
          <EvidencePanel
            evidences={active.evidences.map((e) => ({
              ...e,
              sourceHint: active.sourceLabel,
            }))}
          />
        )}
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={!active}
          onClick={() => active && onResolve(active.id)}
        >
          <Check className="mr-2 h-4 w-4" />
          Use this value
        </Button>
      </CardContent>
    </Card>
  );
}
