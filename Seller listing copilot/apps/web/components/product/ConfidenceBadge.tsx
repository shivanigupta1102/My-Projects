"use client";

import { cn } from "@/lib/utils";

export interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);
  let label: string;
  let dotClass: string;
  let textClass: string;
  if (confidence >= 0.85) {
    label = "Auto-approved";
    dotClass = "bg-[#10B981]";
    textClass = "text-[#10B981]";
  } else if (confidence >= 0.6) {
    label = "Review suggested";
    dotClass = "bg-[#F59E0B]";
    textClass = "text-[#F59E0B]";
  } else {
    label = "Review required";
    dotClass = "bg-[#EF4444]";
    textClass = "text-[#EF4444]";
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
      title={label}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden />
      <span className={textClass}>{pct}%</span>
      <span className="hidden text-foreground-muted sm:inline">{label}</span>
    </div>
  );
}
