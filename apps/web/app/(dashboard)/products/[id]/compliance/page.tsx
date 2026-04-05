"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Wrench,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ComplianceGate } from "@/components/product/ComplianceGate";
import { ChannelPill } from "@/components/product/ChannelPill";

const CHANNELS = ["AMAZON", "EBAY", "ETSY", "SHOPIFY", "WALMART"] as const;

const mockChecks = {
  AMAZON: {
    gate: "BLOCKED" as const,
    checks: [
      {
        ruleId: "AMAZON_GTIN_REQUIRED",
        severity: "BLOCKING" as const,
        field: "gtin",
        violation: "Valid GTIN required for this category. Electronics > Headphones is not GTIN-exempt.",
        suggestedFix: "Enter or confirm a valid UPC/EAN for this product",
        autoFixAvailable: false,
        policyUrl: "https://sellercentral.amazon.com/help/hub/reference/G200317470",
      },
      {
        ruleId: "AMAZON_MAIN_IMAGE_BACKGROUND",
        severity: "BLOCKING" as const,
        field: "images[0]",
        violation: "Main image background detected as #F2F2F2 (94% confidence). Must be pure white (#FFFFFF).",
        suggestedFix: "Remove background and replace with pure white",
        autoFixAvailable: true,
        policyUrl: "https://sellercentral.amazon.com/help/hub/reference/G1881",
      },
      {
        ruleId: "AMAZON_BULLET_COUNT",
        severity: "WARNING" as const,
        field: "bullets",
        violation: "Only 3 bullet points. 5 recommended for optimal conversion.",
        suggestedFix: "Generate 2 additional benefit-led bullet points",
        autoFixAvailable: true,
      },
    ],
  },
  EBAY: {
    gate: "PASSED" as const,
    checks: [
      {
        ruleId: "EBAY_GTIN_RECOMMENDED",
        severity: "INFO" as const,
        field: "gtin",
        violation: "GTIN not provided. Adding a GTIN improves search visibility.",
        suggestedFix: "Add UPC/EAN if available",
        autoFixAvailable: false,
      },
    ],
  },
  ETSY: { gate: "PASSED" as const, checks: [] },
  SHOPIFY: { gate: "PASSED" as const, checks: [] },
  WALMART: { gate: "BLOCKED" as const, checks: [] },
};

const SEVERITY_ICONS = {
  BLOCKING: AlertCircle,
  ERROR: AlertTriangle,
  WARNING: AlertTriangle,
  INFO: Info,
};

export default function CompliancePage() {
  const [activeChannel, setActiveChannel] = useState<string>("AMAZON");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    BLOCKING: true,
    WARNING: false,
    PASSING: false,
  });

  const channelData = mockChecks[activeChannel as keyof typeof mockChecks] ?? {
    gate: "PASSED",
    checks: [],
  };

  const blockingChecks = channelData.checks.filter((c) => c.severity === "BLOCKING");
  const warningChecks = channelData.checks.filter((c) => {
    const s = c.severity as "BLOCKING" | "ERROR" | "WARNING" | "INFO";
    return s === "WARNING" || s === "ERROR";
  });
  const infoChecks = channelData.checks.filter((c) => c.severity === "INFO");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">
          Compliance Report
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Per-channel compliance status with blocking gates.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        {CHANNELS.map((ch) => {
          const data = mockChecks[ch as keyof typeof mockChecks];
          return (
            <button
              key={ch}
              type="button"
              onClick={() => setActiveChannel(ch)}
              className="relative"
            >
              <ChannelPill
                channel={ch}
                status={data?.gate === "BLOCKED" ? "blocked" : data?.gate === "PASSED" ? "published" : "default"}
              />
              {activeChannel === ch && (
                <motion.div
                  layoutId="compliance-tab"
                  className="absolute -bottom-3 left-0 right-0 h-0.5 bg-indigo-500"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <ComplianceGate
        status={channelData.gate}
        blockingCount={blockingChecks.length}
        warningCount={warningChecks.length}
        channelSummary={activeChannel}
      />

      {blockingChecks.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() =>
              setExpandedSections((s) => ({ ...s, BLOCKING: !s.BLOCKING }))
            }
            className="flex w-full items-center gap-2 py-2 text-left"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-compliance-blocking transition-transform",
                expandedSections.BLOCKING && "rotate-180",
              )}
            />
            <span className="text-sm font-medium text-red-300">
              BLOCKING ({blockingChecks.length})
            </span>
          </button>
          <AnimatePresence>
            {expandedSections.BLOCKING && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {blockingChecks.map((check) => {
                  const Icon = SEVERITY_ICONS[check.severity];
                  return (
                    <div
                      key={check.ruleId}
                      className="rounded-lg border border-compliance-blocking-border bg-compliance-blocking-bg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-compliance-blocking" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-medium text-red-300">
                              {check.ruleId}
                            </span>
                            {check.policyUrl && (
                              <a
                                href={check.policyUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-2xs text-text-link hover:underline"
                              >
                                Policy <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-text-secondary">
                            Field: <span className="font-mono">{check.field}</span>
                          </p>
                          <p className="mt-1 text-sm text-text-primary">
                            {check.violation}
                          </p>
                          <p className="mt-2 text-xs text-text-secondary">
                            Fix: {check.suggestedFix}
                          </p>
                          <div className="mt-3 flex gap-2">
                            {check.autoFixAvailable && (
                              <Button size="sm" variant="secondary">
                                <Wrench className="mr-1.5 h-3.5 w-3.5" />
                                Auto-fix: Remove background
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              {check.autoFixAvailable ? "Preview" : "Fix manually"} →
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {warningChecks.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() =>
              setExpandedSections((s) => ({ ...s, WARNING: !s.WARNING }))
            }
            className="flex w-full items-center gap-2 py-2 text-left"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-compliance-warning transition-transform",
                !expandedSections.WARNING && "-rotate-90",
              )}
            />
            <span className="text-sm font-medium text-yellow-300">
              WARNINGS ({warningChecks.length})
            </span>
          </button>
          <AnimatePresence>
            {expandedSections.WARNING && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {warningChecks.map((check) => (
                  <div
                    key={check.ruleId}
                    className="rounded-lg border border-compliance-warning/30 bg-compliance-warning-bg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-compliance-warning" />
                      <div>
                        <span className="font-mono text-xs text-yellow-300">{check.ruleId}</span>
                        <p className="mt-1 text-sm text-text-primary">{check.violation}</p>
                        <p className="mt-1 text-xs text-text-secondary">Fix: {check.suggestedFix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {infoChecks.length > 0 && (
        <div className="space-y-3">
          {infoChecks.map((check) => (
            <div
              key={check.ruleId}
              className="rounded-lg border border-compliance-info/30 bg-compliance-info-bg p-3"
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-compliance-info" />
                <span className="font-mono text-xs text-blue-300">{check.ruleId}</span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">{check.violation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
