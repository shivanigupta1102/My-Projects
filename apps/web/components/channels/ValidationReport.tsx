"use client";

import type { Severity, ValidationIssue } from "@listingpilot/shared-types";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function severityIcon(severity: Severity) {
  switch (severity) {
    case "BLOCKING":
      return OctagonAlert;
    case "ERROR":
      return AlertCircle;
    case "WARNING":
      return AlertTriangle;
    default:
      return Info;
  }
}

function severityVariant(
  severity: Severity,
): "error" | "warning" | "outline" {
  switch (severity) {
    case "BLOCKING":
    case "ERROR":
      return "error";
    case "WARNING":
      return "warning";
    default:
      return "outline";
  }
}

export interface ValidationReportProps {
  issues: ValidationIssue[];
  className?: string;
}

export function ValidationReport({ issues, className }: ValidationReportProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)}>
      <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Validation ({issues.length})
      </div>
      <ScrollArea className="max-h-[360px]">
        <ul className="divide-y divide-border">
          {issues.map((issue) => {
            const Icon = severityIcon(issue.severity);
            return (
              <motion.li
                key={issue.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 px-3 py-3"
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    issue.severity === "BLOCKING" || issue.severity === "ERROR"
                      ? "text-error"
                      : issue.severity === "WARNING"
                        ? "text-warning"
                        : "text-foreground-muted",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant(issue.severity)}>
                      {issue.severity}
                    </Badge>
                    <span className="font-mono text-[10px] text-foreground-muted">
                      {issue.field} · {issue.rule}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{issue.message}</p>
                  {issue.suggestedFix && (
                    <p className="mt-1 text-xs text-accent">
                      Suggested: {issue.suggestedFix}
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
