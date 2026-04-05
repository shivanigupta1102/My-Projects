"use client";

import { useState } from "react";
import { Check, X, ImageIcon, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChannelPill } from "@/components/product/ChannelPill";

const mockImages = [
  {
    id: "1",
    filename: "headphones-front.jpg",
    resolution: "2400x2400",
    hasWhiteBackground: false,
    qualityScore: 0.72,
    complianceFlags: {
      AMAZON: ["MAIN_IMAGE_BACKGROUND"],
      EBAY: [],
      ETSY: [],
    },
  },
  {
    id: "2",
    filename: "headphones-side.jpg",
    resolution: "2000x2000",
    hasWhiteBackground: true,
    qualityScore: 0.91,
    complianceFlags: { AMAZON: [], EBAY: [], ETSY: [] },
  },
  {
    id: "3",
    filename: "headphones-box.jpg",
    resolution: "1800x1200",
    hasWhiteBackground: true,
    qualityScore: 0.85,
    complianceFlags: { AMAZON: [], EBAY: [], ETSY: [] },
  },
];

export default function ImagesPage() {
  const [selectedImage, setSelectedImage] = useState(mockImages[0]);
  const [viewMode, setViewMode] = useState<"original" | "processed">("original");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Image Management
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Original vs processed, per-channel compliance, drag to reorder.
          </p>
        </div>
        <Button size="sm">
          <ImageIcon className="mr-2 h-3.5 w-3.5" />
          Upload Image
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-bg-surface">
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <ImageIcon className="mx-auto h-16 w-16 text-text-tertiary" />
                <p className="mt-2 text-sm text-text-secondary">
                  {selectedImage?.filename}
                </p>
                <p className="text-xs text-text-tertiary">
                  {selectedImage?.resolution}
                </p>
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-bg-elevated/90 p-1 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setViewMode("original")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  viewMode === "original"
                    ? "bg-indigo-500 text-white"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setViewMode("processed")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  viewMode === "processed"
                    ? "bg-indigo-500 text-white"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                Processed
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {mockImages.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={cn(
                  "relative flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border transition-all",
                  selectedImage?.id === img.id
                    ? "border-indigo-500 shadow-glow-indigo"
                    : "border-border bg-bg-surface hover:border-border-bright",
                )}
              >
                <ImageIcon className="h-8 w-8 text-text-tertiary" />
                {!img.hasWhiteBackground && (
                  <div className="absolute -right-1 -top-1 rounded-full bg-compliance-blocking p-0.5">
                    <X className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
            <button
              type="button"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border-bright text-text-tertiary transition-colors hover:border-indigo-500 hover:text-indigo-400"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-bg-surface p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Image Details
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Resolution</span>
                <span className="font-mono text-text-primary">{selectedImage?.resolution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">White Background</span>
                <span>
                  {selectedImage?.hasWhiteBackground ? (
                    <Check className="h-4 w-4 text-confidence-high" />
                  ) : (
                    <X className="h-4 w-4 text-compliance-blocking" />
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Quality Score</span>
                <span className="font-mono text-text-primary">
                  {selectedImage?.qualityScore}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-bg-surface p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Per-Channel Compliance
            </h3>
            <div className="mt-3 space-y-2">
              {Object.entries(selectedImage?.complianceFlags ?? {}).map(
                ([channel, flags]) => (
                  <div key={channel} className="flex items-center justify-between">
                    <ChannelPill channel={channel} />
                    {(flags as string[]).length === 0 ? (
                      <Check className="h-4 w-4 text-confidence-high" />
                    ) : (
                      <span className="text-2xs text-compliance-blocking">
                        {(flags as string[]).length} issue{(flags as string[]).length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>

          {!selectedImage?.hasWhiteBackground && (
            <Button className="w-full" size="sm">
              <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
              Auto-fix: Remove Background
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
