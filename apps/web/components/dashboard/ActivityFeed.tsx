"use client";

import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  product?: string;
  timestamp: string;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className={cn("py-8 text-center text-xs text-text-tertiary", className)}>
        Activity will appear here as your team takes actions.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex gap-3 rounded-md px-2 py-2 transition-colors hover:bg-bg-overlay"
        >
          <span className="mt-0.5 text-2xs tabular-nums text-text-tertiary">
            {timeAgo(item.timestamp)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-secondary">{item.action}</p>
            {item.product && (
              <p className="mt-0.5 text-2xs text-text-tertiary">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {item.product}
                {item.detail && ` \u00b7 ${item.detail}`}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
