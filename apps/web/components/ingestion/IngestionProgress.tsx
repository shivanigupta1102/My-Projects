"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  "Uploading",
  "Processing",
  "Extracting",
  "Building",
  "Complete",
] as const;

export type IngestionStage = (typeof STAGES)[number];

export interface IngestionProgressProps {
  /** 0-based index of active stage */
  activeIndex: number;
  className?: string;
}

export function IngestionProgress({ activeIndex, className }: IngestionProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-1">
        {STAGES.map((label, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          return (
            <div key={label} className="flex flex-1 flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: current ? 1.05 : 1,
                  backgroundColor: done || current ? "rgb(99 102 241)" : "rgb(30 30 46)",
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-white",
                  done && "bg-success border-success",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </motion.div>
              <span
                className={cn(
                  "mt-2 hidden text-center text-[10px] uppercase sm:block",
                  current ? "text-accent" : "text-foreground-muted",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(100, ((activeIndex + 1) / STAGES.length) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
