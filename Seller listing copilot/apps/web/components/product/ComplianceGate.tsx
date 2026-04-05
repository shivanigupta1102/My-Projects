"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, MinusCircle } from "lucide-react";

export interface ComplianceGateProps {
  status: "PASSED" | "BLOCKED" | "PENDING";
  blockingCount: number;
  warningCount: number;
  channelSummary: string;
  onExpand?: () => void;
  className?: string;
}

export function ComplianceGate({
  status,
  blockingCount,
  warningCount,
  channelSummary,
  onExpand,
  className,
}: ComplianceGateProps) {
  const StatusIcon =
    status === "PASSED"
      ? CheckCircle2
      : status === "BLOCKED"
        ? AlertCircle
        : MinusCircle;

  const statusLabel =
    status === "PASSED"
      ? "PASSING"
      : status === "BLOCKED"
        ? "BLOCKED"
        : "MIXED";

  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors",
        status === "BLOCKED" &&
          "border-l-2 border-l-compliance-blocking bg-compliance-blocking-bg",
        status === "PASSED" &&
          "border-l-2 border-l-compliance-pass bg-compliance-pass-bg",
        status === "PENDING" &&
          "border-l-2 border-l-indigo-500 bg-bg-elevated",
        className,
      )}
    >
      <StatusIcon
        className={cn(
          "h-5 w-5 shrink-0",
          status === "BLOCKED" && "text-compliance-blocking",
          status === "PASSED" && "text-compliance-pass",
          status === "PENDING" && "text-indigo-400",
        )}
      />
      <span
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          status === "BLOCKED" && "text-red-300",
          status === "PASSED" && "text-green-300",
          status === "PENDING" && "text-indigo-300",
        )}
      >
        {statusLabel}
      </span>
      <div className="flex flex-1 items-center gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < 10 - blockingCount
                ? status === "PASSED"
                  ? "bg-compliance-pass"
                  : "bg-indigo-500"
                : "bg-compliance-blocking/40",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-text-secondary">
        {blockingCount > 0 && `${blockingCount} blocking · `}
        {warningCount > 0 && `${warningCount} warnings · `}
        {channelSummary}
      </span>
    </button>
  );
}
