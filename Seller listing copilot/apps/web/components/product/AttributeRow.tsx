"use client";

import type { ExtractionMethod } from "@listingpilot/shared-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  PenLine,
  Scan,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { ConfidenceBadge } from "@/components/product/ConfidenceBadge";
import { EvidencePanel } from "@/components/product/EvidencePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AttributeRowProps {
  fieldName: string;
  value: string;
  confidence: number;
  method: string;
  requiresReview: boolean;
  evidences: Array<{
    id: string;
    snippet: string | null;
    explanation: string;
    confidence: number;
  }>;
  onApprove: () => void;
  onOverride: (newValue: string) => void;
  /** When false, expandable evidence block is omitted (e.g. external EvidencePanel). */
  embedEvidence?: boolean;
}

function methodIcon(method: string) {
  const m = method as ExtractionMethod;
  switch (m) {
    case "OCR":
    case "IMAGE_VISION":
      return Scan;
    case "LLM_INFERENCE":
      return Sparkles;
    default:
      return Sparkles;
  }
}

export function AttributeRow({
  fieldName,
  value,
  confidence,
  method,
  requiresReview,
  evidences,
  onApprove,
  onOverride,
  embedEvidence = true,
}: AttributeRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const SourceIcon = methodIcon(method);

  const isOverridden = method === "SELLER_CONFIRMED";
  const isAutoApproved = !requiresReview && confidence >= 0.85;
  const needsReview = requiresReview && confidence >= 0.6 && confidence < 0.85;
  const reviewRequired = requiresReview && confidence < 0.6;
  const conflicted =
    requiresReview &&
    evidences.length >= 2 &&
    Math.max(...evidences.map((e) => e.confidence)) -
      Math.min(...evidences.map((e) => e.confidence)) >
      0.25;

  const commitEdit = () => {
    if (draft.trim() !== value) {
      onOverride(draft.trim());
    }
    setEditing(false);
  };

  return (
    <motion.div
      layout
      className="rounded-lg border border-border bg-surface"
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              {fieldName}
            </span>
            {isAutoApproved && !isOverridden && (
              <Check
                className="h-4 w-4 text-success"
                aria-label="Auto-approved"
              />
            )}
            {needsReview && !isOverridden && (
              <AlertTriangle
                className="h-4 w-4 text-warning"
                aria-label="Review suggested"
              />
            )}
            {reviewRequired && !isOverridden && (
              <AlertTriangle
                className="h-4 w-4 text-error"
                aria-label="Review required"
              />
            )}
            {conflicted && !isOverridden && (
              <AlertTriangle
                className="h-4 w-4 text-error"
                aria-label="Conflicted sources"
              />
            )}
            {isOverridden && (
              <PenLine
                className="h-4 w-4 text-accent"
                aria-label="Overridden"
              />
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            {editing ? (
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") {
                    setDraft(value);
                    setEditing(false);
                  }
                }}
                className="h-8 max-w-md font-mono text-sm"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraft(value);
                  setEditing(true);
                }}
                className="text-left font-mono text-sm text-foreground hover:underline"
              >
                {value || "—"}
              </button>
            )}
          </div>
        </div>
        <ConfidenceBadge confidence={confidence} />
        <SourceIcon className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
        {embedEvidence && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={confidence < 0.6 || !requiresReview}
          onClick={onApprove}
        >
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
        >
          Override
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {embedEvidence && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <EvidencePanel
              evidences={evidences.map((e) => ({
                ...e,
                sourceHint: method,
              }))}
              className="border-0"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
