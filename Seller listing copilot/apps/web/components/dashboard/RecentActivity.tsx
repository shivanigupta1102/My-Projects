"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ActivityEvent {
  id: string;
  title: string;
  detail?: string;
  at: string;
  tone?: "default" | "success" | "warning" | "error";
}

export interface RecentActivityProps {
  events: ActivityEvent[];
  className?: string;
}

export function RecentActivity({ events, className }: RecentActivityProps) {
  return (
    <Card className={cn("border-border bg-surface", className)}>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative border-l border-border pl-4">
          {events.map((ev, i) => (
            <motion.li
              key={ev.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="mb-6 ml-1 last:mb-0"
            >
              <div className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-accent" />
              <time className="mb-1 block text-[10px] font-mono uppercase text-foreground-muted">
                {formatDistanceToNow(new Date(ev.at), { addSuffix: true })}
              </time>
              <p className="text-sm font-medium text-foreground">{ev.title}</p>
              {ev.detail && (
                <p className="text-xs text-foreground-muted">{ev.detail}</p>
              )}
            </motion.li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
