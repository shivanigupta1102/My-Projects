"use client";

import { ChannelPill } from "@/components/product/ChannelPill";

const mockChannels = [
  { channel: "AMAZON", status: "connected" as const, listings: 45, health: 94 },
  { channel: "EBAY", status: "connected" as const, listings: 32, health: 88 },
  { channel: "ETSY", status: "connected" as const, listings: 18, health: 100 },
  { channel: "SHOPIFY", status: "connected" as const, listings: 28, health: 91 },
  { channel: "WALMART", status: "default" as const, listings: 0, health: 0 },
];

export default function ChannelsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">
          Channels
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Connected marketplace accounts and publishing status.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockChannels.map((ch) => (
          <div
            key={ch.channel}
            className="rounded-lg border border-border bg-bg-surface p-5 transition-colors hover:border-border-bright"
          >
            <div className="flex items-center justify-between">
              <ChannelPill channel={ch.channel} status={ch.status} />
              {ch.health > 0 && (
                <span className="font-mono text-sm tabular-nums text-text-primary">
                  {ch.health}%
                </span>
              )}
            </div>
            <div className="mt-4 flex justify-between text-xs text-text-secondary">
              <span>{ch.listings} active listings</span>
              <span>{ch.status === "connected" ? "Connected" : "Not connected"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
