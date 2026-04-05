"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FolderTree, Check, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChannelPill } from "@/components/product/ChannelPill";
import { ConfidenceBadge } from "@/components/product/ConfidenceBadge";

const mockMappings = [
  {
    channel: "AMAZON",
    categoryId: "123456",
    categoryPath: "Electronics > Headphones > Over-Ear",
    confidence: 0.92,
    method: "AI_INFERRED",
    alternatives: [
      { path: "Electronics > Audio > Headphones", confidence: 0.78 },
      { path: "Cell Phone Accessories > Headsets", confidence: 0.45 },
    ],
    itemSpecifics: [],
  },
  {
    channel: "EBAY",
    categoryId: "112529",
    categoryPath: "Consumer Electronics > Portable Audio > Headphones",
    confidence: 0.88,
    method: "AI_INFERRED",
    alternatives: [
      { path: "Sound & Vision > Headphones", confidence: 0.65 },
    ],
    itemSpecifics: [
      { name: "Brand", required: true, value: "Sony" },
      { name: "Model", required: true, value: "WH-1000XM5" },
      { name: "Type", required: true, value: "Over-Ear" },
      { name: "Connectivity", required: true, value: null },
      { name: "Color", recommended: true, value: "Black" },
      { name: "Features", recommended: true, value: null },
    ],
  },
  {
    channel: "ETSY",
    categoryId: "etsy-cat-123",
    categoryPath: "Electronics & Accessories > Audio > Headphones",
    confidence: 0.85,
    method: "AI_INFERRED",
    alternatives: [],
    itemSpecifics: [],
  },
];

export default function CategoryPage() {
  const [selectedChannel, setSelectedChannel] = useState("AMAZON");
  const mapping = mockMappings.find((m) => m.channel === selectedChannel);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Category Mapping
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Per-channel category assignments and item specifics.
          </p>
        </div>
        <Button size="sm" variant="outline">
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Re-map All
        </Button>
      </div>

      <div className="flex gap-2">
        {mockMappings.map((m) => (
          <button
            key={m.channel}
            type="button"
            onClick={() => setSelectedChannel(m.channel)}
            className="relative"
          >
            <ChannelPill
              channel={m.channel}
              status={selectedChannel === m.channel ? "connected" : "default"}
            />
            {selectedChannel === m.channel && (
              <motion.div
                layoutId="category-tab"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-indigo-500"
              />
            )}
          </button>
        ))}
      </div>

      {mapping && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-text-primary">
                    Mapped Category
                  </span>
                  <ConfidenceBadge confidence={mapping.confidence} />
                </div>
                <div className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                  {mapping.categoryPath.split(" > ").map((seg, i, arr) => (
                    <span key={i} className="flex items-center gap-1">
                      <span>{seg}</span>
                      {i < arr.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-text-tertiary" />
                      )}
                    </span>
                  ))}
                </div>
                <div className="mt-1 text-2xs text-text-tertiary">
                  ID: {mapping.categoryId} · Method: {mapping.method}
                </div>
              </div>
              <Button size="sm" variant="secondary">
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Confirm
              </Button>
            </div>

            {mapping.alternatives.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <h4 className="text-2xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Alternatives
                </h4>
                <div className="mt-2 space-y-2">
                  {mapping.alternatives.map((alt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border border-border bg-bg-elevated px-3 py-2"
                    >
                      <span className="text-xs text-text-secondary">{alt.path}</span>
                      <div className="flex items-center gap-2">
                        <ConfidenceBadge confidence={alt.confidence} />
                        <Button size="sm" variant="ghost">
                          Use this
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {mapping.itemSpecifics.length > 0 && (
            <div className="rounded-lg border border-border bg-bg-surface p-5">
              <h3 className="text-sm font-medium text-text-secondary">
                Item Specifics ({mapping.channel})
              </h3>
              <div className="mt-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-text-tertiary">
                      <th className="pb-2 pr-4">Specific</th>
                      <th className="pb-2 pr-4">Required</th>
                      <th className="pb-2 pr-4">Value</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapping.itemSpecifics.map((spec: Record<string, unknown>, i: number) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium text-text-primary">
                          {spec.name as string}
                        </td>
                        <td className="py-2 pr-4">
                          {spec.required ? (
                            <span className="text-compliance-blocking">Required</span>
                          ) : (
                            <span className="text-text-tertiary">Recommended</span>
                          )}
                        </td>
                        <td className="py-2 pr-4 font-mono text-text-secondary">
                          {(spec.value as string) ?? "—"}
                        </td>
                        <td className="py-2">
                          {spec.value ? (
                            <Check className="h-4 w-4 text-confidence-high" />
                          ) : (
                            <span className="text-compliance-blocking">Missing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
