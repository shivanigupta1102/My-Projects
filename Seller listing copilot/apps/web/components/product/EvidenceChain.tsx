"use client";

import { cn } from "@/lib/utils";
import { Check, FileText, Image, Globe } from "lucide-react";

export interface EvidenceSource {
  id: string;
  type: "pdf" | "image" | "url" | "csv" | "seller";
  filename: string;
  location?: string;
  confidence: number;
}

export interface EvidenceChainProps {
  sources: EvidenceSource[];
  onSourceClick?: (sourceId: string) => void;
  className?: string;
}

const SOURCE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  image: Image,
  url: Globe,
  csv: FileText,
  seller: Check,
};

function getQualityColor(confidence: number): string {
  if (confidence >= 0.8) return "bg-confidence-high";
  if (confidence >= 0.6) return "bg-confidence-medium";
  return "bg-confidence-low";
}

export function EvidenceChain({
  sources,
  onSourceClick,
  className,
}: EvidenceChainProps) {
  if (sources.length === 0) {
    return (
      <div className={cn("text-xs text-text-tertiary italic", className)}>
        No evidence sources
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {sources.map((source, i) => {
        const Icon = SOURCE_ICONS[source.type] ?? FileText;
        return (
          <div key={source.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSourceClick?.(source.id)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 py-1 text-2xs text-text-secondary transition-colors hover:border-border-bright hover:text-text-primary"
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="max-w-[120px] truncate">{source.filename}</span>
              {source.location && (
                <span className="text-text-tertiary">{source.location}</span>
              )}
            </button>
            {i < sources.length - 1 && (
              <div className="flex items-center gap-0.5">
                <div className="h-px w-3 bg-border-bright" />
                <div
                  className={cn("h-2 w-2 rounded-full", getQualityColor(source.confidence))}
                />
                <div className="h-px w-3 bg-border-bright" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
