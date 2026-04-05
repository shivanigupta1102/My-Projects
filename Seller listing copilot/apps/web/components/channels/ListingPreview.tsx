"use client";

import type { Channel, ListingPackageData } from "@listingpilot/shared-types";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const channelLabels: Record<Channel, string> = {
  AMAZON: "Amazon",
  EBAY: "eBay",
  WALMART: "Walmart",
  SHOPIFY: "Shopify",
  ETSY: "Etsy",
};

export interface ListingPreviewProps {
  channel: Channel;
  data: ListingPackageData;
  className?: string;
}

export function ListingPreview({ channel, data, className }: ListingPreviewProps) {
  const specifics = Object.entries(data.attributes ?? {}).filter(
    ([, v]) => v != null && String(v).length > 0,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(className)}
    >
      <Card className="border-border bg-surface">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">
              {data.title ?? "Untitled listing"}
            </CardTitle>
            <Badge variant="outline">{channelLabels[channel]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.bullets.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-foreground-muted">
                Bullets
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                {data.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          {data.description && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-foreground-muted">
                Description
              </h4>
              <p className="whitespace-pre-wrap text-sm text-foreground-muted">
                {data.description}
              </p>
            </div>
          )}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-foreground-muted">
              Images
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.images.length === 0 && (
                <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-border text-foreground-muted">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              {data.images
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((img) => (
                  <div
                    key={`${img.url}-${img.order}`}
                    className="relative h-20 w-20 overflow-hidden rounded border border-border bg-surface-hover"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <Badge
                      variant="outline"
                      className="absolute bottom-1 left-1 text-[9px]"
                    >
                      {img.role}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
          {specifics.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-foreground-muted">
                  Item specifics
                </h4>
                <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  {specifics.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 rounded border border-border px-2 py-1"
                    >
                      <dt className="text-foreground-muted">{k}</dt>
                      <dd className="font-mono text-xs text-foreground">
                        {String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
