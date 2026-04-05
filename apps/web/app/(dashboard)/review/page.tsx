"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ReviewQueueItem } from "@listingpilot/shared-types";
import { ReviewQueue } from "@/components/product/ReviewQueue";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOCK_REVIEW_QUEUE: ReviewQueueItem[] = [
  {
    attributeId: "attr-weight",
    productId: "prod-5509",
    productTitle: "Glass Storage Canisters — 3 Pack",
    fieldName: "Weight (shipping)",
    value: "Conflict: 2.1 lb vs 2.4 lb",
    confidence: 0.41,
    method: "STRUCTURED_PARSE",
    conflicted: true,
    evidenceCount: 3,
  },
  {
    attributeId: "attr-dims",
    productId: "prod-8842",
    productTitle: "AeroPress Clear Coffee Maker",
    fieldName: "Dimensions",
    value: '3.1" × 3.1" × 5.2" (inferred)',
    confidence: 0.38,
    method: "LLM_INFERENCE",
    conflicted: false,
    evidenceCount: 1,
  },
  {
    attributeId: "attr-color",
    productId: "prod-7721",
    productTitle: "Ceramic Pour-Over Set (Matte Black)",
    fieldName: "Color",
    value: "Matte Black vs Charcoal",
    confidence: 0.52,
    method: "IMAGE_VISION",
    conflicted: true,
    evidenceCount: 2,
  },
  {
    attributeId: "attr-hazmat",
    productId: "prod-3307",
    productTitle: "Copper French Press — 34oz",
    fieldName: "Hazmat / battery",
    value: "Unknown",
    confidence: 0.44,
    method: "LLM_INFERENCE",
    conflicted: false,
    evidenceCount: 0,
  },
  {
    attributeId: "attr-warranty",
    productId: "prod-8842",
    productTitle: "AeroPress Clear Coffee Maker",
    fieldName: "Warranty",
    value: "1 year limited",
    confidence: 0.55,
    method: "URL_SCRAPE",
    conflicted: false,
    evidenceCount: 1,
  },
  {
    attributeId: "attr-cap",
    productId: "prod-7721",
    productTitle: "Ceramic Pour-Over Set (Matte Black)",
    fieldName: "Capacity",
    value: "24 oz",
    confidence: 0.58,
    method: "OCR",
    conflicted: false,
    evidenceCount: 1,
  },
  {
    attributeId: "attr-mat",
    productId: "prod-8842",
    productTitle: "AeroPress Clear Coffee Maker",
    fieldName: "Material",
    value: "Tritan copolyester, silicone seal",
    confidence: 0.62,
    method: "URL_SCRAPE",
    conflicted: false,
    evidenceCount: 2,
  },
  {
    attributeId: "attr-bp",
    productId: "prod-0094",
    productTitle: "Vacuum-Insulated Travel Mug — 16oz",
    fieldName: "Boil safe",
    value: "Not recommended",
    confidence: 0.64,
    method: "LLM_INFERENCE",
    conflicted: false,
    evidenceCount: 1,
  },
  {
    attributeId: "attr-geo",
    productId: "prod-9983",
    productTitle: "Handcrafted Ceramic Mug — Speckle",
    fieldName: "Country of origin",
    value: "USA",
    confidence: 0.66,
    method: "OCR",
    conflicted: false,
    evidenceCount: 1,
  },
  {
    attributeId: "attr-msrp",
    productId: "prod-2206",
    productTitle: "Digital Kitchen Scale — USB-C",
    fieldName: "MSRP",
    value: "$34.99",
    confidence: 0.68,
    method: "STRUCTURED_PARSE",
    conflicted: false,
    evidenceCount: 1,
  },
  {
    attributeId: "attr-thread",
    productId: "prod-1105",
    productTitle: "Silicone Espresso Tamping Mat",
    fieldName: "Dimensions (metric)",
    value: "210 × 150 mm",
    confidence: 0.71,
    method: "IMAGE_VISION",
    conflicted: false,
    evidenceCount: 1,
  },
  {
    attributeId: "attr-cal",
    productId: "prod-6610",
    productTitle: "Stainless Steel Milk Frother",
    fieldName: "Wattage",
    value: "500W",
    confidence: 0.74,
    method: "STRUCTURED_PARSE",
    conflicted: false,
    evidenceCount: 1,
  },
  {
    attributeId: "attr-pack",
    productId: "prod-5509",
    productTitle: "Glass Storage Canisters — 3 Pack",
    fieldName: "Units per pack",
    value: "3",
    confidence: 0.81,
    method: "OCR",
    conflicted: false,
    evidenceCount: 1,
  },
  {
    attributeId: "attr-title",
    productId: "prod-4408",
    productTitle: "Bamboo Cutting Board — Large",
    fieldName: "Title suffix",
    value: "Large — 18 inch",
    confidence: 0.83,
    method: "LLM_INFERENCE",
    conflicted: false,
    evidenceCount: 2,
  },
  {
    attributeId: "attr-cat",
    productId: "prod-3307",
    productTitle: "Copper French Press — 34oz",
    fieldName: "Category path",
    value: "Kitchen › Coffee & Tea › French Presses",
    confidence: 0.84,
    method: "LLM_INFERENCE",
    conflicted: false,
    evidenceCount: 2,
  },
];

export default function ReviewQueuePage() {
  const [productFilter, setProductFilter] = useState<string>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");

  const products = useMemo(() => {
    const titles = [...new Set(MOCK_REVIEW_QUEUE.map((q) => q.productTitle))];
    return titles.sort();
  }, []);

  const filteredQueue = useMemo(() => {
    return MOCK_REVIEW_QUEUE.filter((q) => {
      const matchP =
        productFilter === "all" || q.productTitle === productFilter;
      let matchC = true;
      if (confidenceFilter === "low") matchC = q.confidence < 0.6;
      else if (confidenceFilter === "medium")
        matchC = q.confidence >= 0.6 && q.confidence < 0.85;
      else if (confidenceFilter === "high") matchC = q.confidence >= 0.85;
      return matchP && matchC;
    });
  }, [productFilter, confidenceFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-7xl space-y-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Lowest confidence and conflicted fields first — keyboard-first workflow.
          </p>
          <p className="mt-2 font-mono text-xs text-accent">
            Progress: 23/35 fields reviewed (66%)
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground-muted">Product</Label>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[260px] bg-surface">
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {products.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground-muted">Confidence</Label>
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[200px] bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
                <SelectItem value="medium">Medium (60–84%)</SelectItem>
                <SelectItem value="high">High (85%+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ReviewQueue mockQueue={filteredQueue} />

      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-xs text-foreground-muted">
        <kbd className="rounded border border-border-light bg-background px-1.5 py-0.5 font-mono text-foreground">
          A
        </kbd>{" "}
        approve ·{" "}
        <kbd className="rounded border border-border-light bg-background px-1.5 py-0.5 font-mono text-foreground">
          E
        </kbd>{" "}
        edit ·{" "}
        <kbd className="rounded border border-border-light bg-background px-1.5 py-0.5 font-mono text-foreground">
          →
        </kbd>{" "}
        next field ·{" "}
        <kbd className="rounded border border-border-light bg-background px-1.5 py-0.5 font-mono text-foreground">
          Esc
        </kbd>{" "}
        blur
      </div>
    </motion.div>
  );
}
