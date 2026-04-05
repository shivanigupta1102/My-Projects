"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Channel, ListingPackageData, PackageStatus, ValidationIssue } from "@listingpilot/shared-types";
import { ChannelPackageCard } from "@/components/channels/ChannelPackageCard";
import { ListingPreview } from "@/components/channels/ListingPreview";
import { ValidationReport } from "@/components/channels/ValidationReport";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const channelOrder: Channel[] = ["AMAZON", "EBAY", "WALMART", "SHOPIFY", "ETSY"];

const qualityByChannel: Record<Channel, number> = {
  AMAZON: 0.91,
  EBAY: 0.85,
  WALMART: 0.72,
  SHOPIFY: 0.88,
  ETSY: 0.8,
};

const statusByChannel: Record<Channel, PackageStatus> = {
  AMAZON: "VALIDATED",
  EBAY: "DRAFT",
  WALMART: "FAILED",
  SHOPIFY: "VALIDATED",
  ETSY: "DRAFT",
};

function mockPackage(productId: string, channel: Channel): ListingPackageData {
  const baseTitle = "AeroPress Clear Coffee Maker — BPA-Free Tritan";
  return {
    id: `pkg-${channel}-1`,
    productId,
    channel,
    status: statusByChannel[channel],
    title: baseTitle,
    bullets: [
      "Crystal-clear Tritan chamber shows brew strength in real time.",
      "Includes 350 microfilters — smoother cup, less grit.",
      "Compact design for travel; dishwasher-safe top rack.",
      "Compatible with AeroPress OG accessories.",
    ],
    description:
      "Brew cafe-quality coffee anywhere. The Clear edition adds visibility without compromising durability. Designed for daily use and easy cleaning.",
    attributes: {
      Brand: "AeroPress",
      "Item Weight": "6.4 ounces",
      Material: "Tritan, silicone",
      UPC: "085255118926",
      "Is Dishwasher Safe": channel === "AMAZON" ? "Yes" : "Y",
    },
    keywords: ["pour over", "travel coffee", "aeropress", "filters included"],
    images: [
      {
        url: "https://picsum.photos/seed/pkgmain/200/200",
        role: "MAIN",
        order: 0,
      },
      {
        url: "https://picsum.photos/seed/pkg2/200/200",
        role: "LIFESTYLE",
        order: 1,
      },
    ],
    qualityScore: qualityByChannel[channel],
  };
}

function mockIssues(channel: Channel): ValidationIssue[] {
  const common: ValidationIssue[] = [
    {
      id: `${channel}-i1`,
      field: "title",
      rule: "LENGTH_MAX",
      severity: "WARNING",
      message: "Title is 4 characters under the recommended richness score for this browse node.",
      suggestedFix: "Add a differentiator (capacity, material, or count).",
    },
  ];
  if (channel === "WALMART") {
    return [
      {
        id: "wm-1",
        field: "shortDescription",
        rule: "WM_REQUIRED_SHORT_DESC",
        severity: "BLOCKING",
        message: "Walmart requires a short description between 500–1000 characters.",
        suggestedFix: "Expand the marketing copy block to meet minimum length.",
      },
      {
        id: "wm-2",
        field: "fulfillment",
        rule: "WFS_ELIGIBILITY",
        severity: "ERROR",
        message: "WFS eligibility flag missing for this category.",
        suggestedFix: "Select fulfillment template or mark as seller-fulfilled.",
      },
      ...common,
    ];
  }
  if (channel === "EBAY") {
    return [
      {
        id: "eb-1",
        field: "conditionId",
        rule: "EBAY_CONDITION_ENUM",
        severity: "ERROR",
        message: "Condition ID must map to eBay item condition for selected category.",
        suggestedFix: "Set condition to NEW (1000) for sealed inventory.",
      },
      ...common,
    ];
  }
  if (channel === "ETSY") {
    return [
      {
        id: "et-1",
        field: "who_made",
        rule: "ETSY_HANDMADE",
        severity: "INFO",
        message: "Confirm 'who made' and 'when made' for handmade taxonomy.",
        suggestedFix: null,
      },
      ...common,
    ];
  }
  return common;
}

function issueCounts(ch: Channel) {
  const issues = mockIssues(ch);
  return {
    blocking: issues.filter((i) => i.severity === "BLOCKING").length,
    error: issues.filter((i) => i.severity === "ERROR").length,
    warning: issues.filter((i) => i.severity === "WARNING").length,
    info: issues.filter((i) => i.severity === "INFO").length,
  };
}

export default function ChannelPackagesPage() {
  const params = useParams();
  const productId = typeof params.id === "string" ? params.id : "prod-8842";
  const [tab, setTab] = useState<Channel>("AMAZON");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Channel packages</h1>
          <p className="text-sm text-foreground-muted">
            Product <span className="font-mono">{productId}</span> — preview and validation per marketplace.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/products/${productId}`}>Back to truth record</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Channel)} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-surface">
          {channelOrder.map((c) => (
            <TabsTrigger key={c} value={c} className="font-mono text-xs">
              {c === "AMAZON"
                ? "Amazon"
                : c === "EBAY"
                  ? "eBay"
                  : c === "WALMART"
                    ? "Walmart"
                    : c === "SHOPIFY"
                      ? "Shopify"
                      : "Etsy"}
            </TabsTrigger>
          ))}
        </TabsList>

        {channelOrder.map((c) => (
          <TabsContent key={c} value={c} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <ChannelPackageCard
                channel={c}
                qualityScore={qualityByChannel[c]}
                status={statusByChannel[c]}
                issueCountBySeverity={issueCounts(c)}
                onPublish={() => undefined}
              />
              <div className="flex flex-col gap-2 lg:flex-row lg:justify-end">
                <Button variant="secondary">Regenerate</Button>
                <Button>Approve</Button>
              </div>
            </div>
            <ListingPreview channel={c} data={mockPackage(productId, c)} />
            <ValidationReport issues={mockIssues(c)} />
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
