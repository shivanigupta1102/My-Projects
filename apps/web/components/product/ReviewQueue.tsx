"use client";

import type { ReviewQueueItem } from "@listingpilot/shared-types";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AttributeRow } from "@/components/product/AttributeRow";
import { EvidencePanel } from "@/components/product/EvidencePanel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useApproveAttribute,
  useBulkApprove,
  useOverrideAttribute,
  useReviewQueue,
} from "@/hooks/useReviewQueue";

interface ReviewQueueProps {
  className?: string;
  /** When set, seeds the queue without calling the API (demo mode). */
  mockQueue?: ReviewQueueItem[];
}

/** Placeholder evidence when queue item has no hydrated evidences */
function placeholderEvidences(item: ReviewQueueItem) {
  return [
    {
      id: `${item.attributeId}-e1`,
      snippet: item.value,
      explanation: `Extracted via ${item.method} with confidence ${Math.round(item.confidence * 100)}%.`,
      confidence: item.confidence,
    },
  ];
}

export function ReviewQueue({ className, mockQueue }: ReviewQueueProps) {
  const { data: fetched = [], isLoading } = useReviewQueue(
    mockQueue?.length ? { mockData: mockQueue } : undefined,
  );
  const [localQueue, setLocalQueue] = useState<ReviewQueueItem[] | null>(() =>
    mockQueue ? [...mockQueue] : null,
  );
  const queue = localQueue ?? fetched;
  const isDemo = mockQueue !== undefined;

  useEffect(() => {
    if (mockQueue !== undefined) {
      setLocalQueue([...mockQueue]);
      setSelectedId(null);
    }
  }, [mockQueue]);

  const approve = useApproveAttribute();
  const override = useOverrideAttribute();
  const bulkApprove = useBulkApprove();

  const sorted = useMemo(() => {
    return [...queue].sort((a, b) => {
      if (a.conflicted !== b.conflicted) return a.conflicted ? -1 : 1;
      return a.confidence - b.confidence;
    });
  }, [queue]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sorted.find((q) => q.attributeId === selectedId) ?? sorted[0];

  useEffect(() => {
    if (!selectedId && sorted[0]) {
      setSelectedId(sorted[0].attributeId);
    }
  }, [selectedId, sorted]);

  const reviewedCount = useMemo(() => {
    return queue.filter((q) => q.confidence >= 0.85 && !q.conflicted).length;
  }, [queue]);

  const progressPct =
    queue.length === 0 ? 0 : Math.min(100, (reviewedCount / queue.length) * 100);

  const highConfidenceIds = useMemo(
    () =>
      queue
        .filter((q) => q.confidence >= 0.85 && !q.conflicted)
        .map((q) => q.attributeId),
    [queue],
  );

  const approveField = useCallback(
    (attributeId: string) => {
      if (isDemo) {
        setLocalQueue((prev) => {
          const base = prev ?? mockQueue ?? [];
          return base.filter((q) => q.attributeId !== attributeId);
        });
        return;
      }
      void approve.mutateAsync(attributeId);
    },
    [approve, isDemo, mockQueue],
  );

  const overrideField = useCallback(
    (input: { attributeId: string; value: string }) => {
      if (isDemo) {
        setLocalQueue((prev) => {
          const base = prev ?? mockQueue ?? [];
          return base.map((q) =>
            q.attributeId === input.attributeId
              ? { ...q, value: input.value, confidence: 0.95, conflicted: false }
              : q,
          );
        });
        return;
      }
      void override.mutate(input);
    },
    [isDemo, mockQueue, override],
  );

  const bulkApproveFields = useCallback(
    (attributeIds: string[]) => {
      if (isDemo) {
        const setIds = new Set(attributeIds);
        setLocalQueue((prev) => {
          const base = prev ?? mockQueue ?? [];
          return base.filter((q) => !setIds.has(q.attributeId));
        });
        return;
      }
      void bulkApprove.mutate(attributeIds);
    },
    [bulkApprove, isDemo, mockQueue],
  );

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        approveField(selected.attributeId);
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        document.querySelector<HTMLElement>(`[data-field="${selected.attributeId}"]`)?.click();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const idx = sorted.findIndex((s) => s.attributeId === selected.attributeId);
        const next = sorted[idx + 1];
        if (next) setSelectedId(next.attributeId);
      }
    },
    [approveField, selected, sorted],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Review queue</h2>
            <p className="text-xs text-foreground-muted">
              {queue.length} fields · lowest confidence first
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={
              highConfidenceIds.length === 0 ||
              (!isDemo && bulkApprove.isPending)
            }
            onClick={() => bulkApproveFields(highConfidenceIds)}
          >
            Bulk approve high-confidence
          </Button>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase text-foreground-muted">
            <span>Reviewed</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>
        <p className="rounded border border-border-light bg-background/50 px-2 py-1 font-mono text-[10px] text-foreground-muted">
          Shortcuts: <kbd className="text-foreground">A</kbd> approve ·{" "}
          <kbd className="text-foreground">E</kbd> edit ·{" "}
          <kbd className="text-foreground">→</kbd> next
        </p>
        <ScrollArea className="h-[480px] pr-2">
          {isLoading && (
            <p className="text-sm text-foreground-muted">Loading queue…</p>
          )}
          {!isLoading && sorted.length === 0 && (
            <p className="text-sm text-foreground-muted">Queue is empty.</p>
          )}
          <div className="flex flex-col gap-2">
            {sorted.map((item) => (
              <button
                type="button"
                key={item.attributeId}
                data-field={item.attributeId}
                onClick={() => setSelectedId(item.attributeId)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  selected?.attributeId === item.attributeId
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-surface-hover",
                )}
              >
                <div className="font-medium text-foreground">{item.fieldName}</div>
                <div className="truncate font-mono text-xs text-foreground-muted">
                  {item.value}
                </div>
                <div className="mt-1 text-[10px] text-foreground-muted">
                  {Math.round(item.confidence * 100)}% · {item.method}
                  {item.conflicted ? " · conflicted" : ""}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="min-h-[320px]"
      >
        {selected ? (
          <div className="space-y-3">
            <AttributeRow
              fieldName={selected.fieldName}
              value={selected.value}
              confidence={selected.confidence}
              method={selected.method}
              requiresReview
              evidences={placeholderEvidences(selected)}
              embedEvidence={false}
              onApprove={() => approveField(selected.attributeId)}
              onOverride={(v) =>
                overrideField({
                  attributeId: selected.attributeId,
                  value: v,
                })
              }
            />
            <EvidencePanel
              evidences={placeholderEvidences(selected).map((e) => ({
                ...e,
                sourceHint: selected.method,
              }))}
            />
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">Select a field to review.</p>
        )}
      </motion.div>
    </div>
  );
}
