"use client";

import type { Channel } from "@listingpilot/shared-types";
import { motion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const channelLabels: Record<Channel, string> = {
  AMAZON: "Amazon",
  EBAY: "eBay",
  WALMART: "Walmart",
  SHOPIFY: "Shopify",
  ETSY: "Etsy",
};

export interface HealthScoreCardProps {
  channel: Channel;
  score: number;
  dimensions: { label: string; value: number }[];
  className?: string;
}

export function HealthScoreCard({
  channel,
  score,
  dimensions,
  className,
}: HealthScoreCardProps) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "text-success" : pct >= 55 ? "text-warning" : "text-error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(className)}
    >
      <Card className="border-border bg-surface">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-baseline justify-between text-base">
            <span>{channelLabels[channel]}</span>
            <span className={cn("font-mono text-2xl", color)}>{pct}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={dimensions}>
              <PolarGrid stroke="#2A2A3E" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: "#71717A", fontSize: 10 }}
              />
              <Radar
                name="Health"
                dataKey="value"
                stroke="#6366F1"
                fill="#6366F1"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
