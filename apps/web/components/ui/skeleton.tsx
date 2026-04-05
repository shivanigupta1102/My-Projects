"use client";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-border-light/40 dark:bg-border/60",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
