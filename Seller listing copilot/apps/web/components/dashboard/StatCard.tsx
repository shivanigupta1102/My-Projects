"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend = "flat",
  trendLabel,
  className,
}: StatCardProps) {
  const Icon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-error"
        : "text-foreground-muted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(className)}
    >
      <Card className="border-border bg-surface">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {label}
          </span>
          <Icon className={cn("h-4 w-4", trendColor)} />
        </CardHeader>
        <CardContent>
          <div className="font-mono text-2xl font-semibold text-accent">
            {value}
          </div>
          {trendLabel && (
            <p className="mt-1 text-xs text-foreground-muted">{trendLabel}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
