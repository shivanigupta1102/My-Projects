"use client";

import { motion } from "framer-motion";
import { ChevronRight, ClipboardCheck, Hammer, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type ActionKind = "review" | "publish" | "remediate";

export interface ActionItem {
  id: string;
  kind: ActionKind;
  title: string;
  subtitle?: string;
  href?: string;
}

const kindMeta: Record<
  ActionKind,
  { label: string; icon: typeof ClipboardCheck; variant: "warning" | "default" | "outline" }
> = {
  review: { label: "Review", icon: ClipboardCheck, variant: "warning" },
  publish: { label: "Publish", icon: Rocket, variant: "default" },
  remediate: { label: "Remediate", icon: Hammer, variant: "outline" },
};

export interface ActionQueueProps {
  items: ActionItem[];
  className?: string;
}

export function ActionQueue({ items, className }: ActionQueueProps) {
  return (
    <Card className={cn("border-border bg-surface", className)}>
      <CardHeader>
        <CardTitle className="text-base">Action queue</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[280px]">
          <ul className="divide-y divide-border">
            {items.map((item, i) => {
              const meta = kindMeta[item.kind];
              const Icon = meta.icon;
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <a
                    href={item.href ?? "#"}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-hover"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="truncate text-xs text-foreground-muted">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />
                  </a>
                </motion.li>
              );
            })}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
