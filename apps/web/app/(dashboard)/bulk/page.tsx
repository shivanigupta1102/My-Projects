"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, ArrowUpCircle, RefreshCw, Trash2, FolderSync } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type BulkOpType = "PUBLISH" | "RELIST" | "DELIST" | "CATEGORY_REMAP";

const mockOperations = [
  {
    id: "1",
    type: "PUBLISH" as BulkOpType,
    status: "COMPLETED",
    totalItems: 15,
    processedItems: 15,
    failedItems: 1,
    createdAt: "2026-03-30T10:00:00Z",
  },
  {
    id: "2",
    type: "RELIST" as BulkOpType,
    status: "PROCESSING",
    totalItems: 8,
    processedItems: 5,
    failedItems: 0,
    createdAt: "2026-03-31T14:00:00Z",
  },
];

const OP_ICONS: Record<BulkOpType, typeof ArrowUpCircle> = {
  PUBLISH: ArrowUpCircle,
  RELIST: RefreshCw,
  DELIST: Trash2,
  CATEGORY_REMAP: FolderSync,
};

const OP_LABELS: Record<BulkOpType, string> = {
  PUBLISH: "Bulk Publish",
  RELIST: "Bulk Relist",
  DELIST: "Bulk Delist",
  CATEGORY_REMAP: "Category Remap",
};

export default function BulkOpsPage() {
  const [selectedOp, setSelectedOp] = useState<BulkOpType>("PUBLISH");
  const [selectedProducts] = useState<string[]>([]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">
          Bulk Operations
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Perform bulk actions across products and channels.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(OP_LABELS) as BulkOpType[]).map((op) => {
          const Icon = OP_ICONS[op];
          return (
            <button
              key={op}
              type="button"
              onClick={() => setSelectedOp(op)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 text-left transition-all",
                selectedOp === op
                  ? "border-indigo-500/50 bg-indigo-950/20 shadow-glow-indigo"
                  : "border-border bg-bg-surface hover:border-border-bright",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  selectedOp === op ? "text-indigo-400" : "text-text-tertiary",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  selectedOp === op ? "text-text-primary" : "text-text-secondary",
                )}
              >
                {OP_LABELS[op]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">
            Select Products
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">
              {selectedProducts.length} selected
            </span>
            <Button size="sm" disabled={selectedProducts.length === 0}>
              <Layers className="mr-2 h-3.5 w-3.5" />
              Run {OP_LABELS[selectedOp]}
            </Button>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-text-tertiary">
          Product selection table with filters will render here.
          <br />
          Select products by status, channel, or confidence level.
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-text-secondary">
          Recent Operations
        </h2>
        <div className="space-y-3">
          {mockOperations.map((op) => {
            const Icon = OP_ICONS[op.type];
            const progress = Math.round((op.processedItems / op.totalItems) * 100);
            return (
              <div
                key={op.id}
                className="flex items-center gap-4 rounded-md border border-border bg-bg-elevated p-3"
              >
                <Icon className="h-4 w-4 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text-primary">{OP_LABELS[op.type]}</div>
                  <div className="text-2xs text-text-tertiary">
                    {op.processedItems}/{op.totalItems} items
                    {op.failedItems > 0 && ` · ${op.failedItems} failed`}
                  </div>
                </div>
                <div className="w-32">
                  <div className="h-1.5 overflow-hidden rounded-full bg-bg-overlay">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={cn(
                        "h-full rounded-full",
                        op.status === "COMPLETED" ? "bg-confidence-high" : "bg-indigo-500",
                      )}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-2xs font-medium",
                    op.status === "COMPLETED" && "bg-compliance-pass-bg text-green-300",
                    op.status === "PROCESSING" && "bg-indigo-950/30 text-indigo-300",
                    op.status === "FAILED" && "bg-compliance-blocking-bg text-red-300",
                  )}
                >
                  {op.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
