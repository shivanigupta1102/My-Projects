"use client";

import type { RemediationType } from "@listingpilot/shared-types";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface RemediationCardProps {
  title: string;
  description: string;
  type: RemediationType;
  impactScore: number;
  onApply: () => void;
  onDismiss: () => void;
  className?: string;
}

export function RemediationCard({
  title,
  description,
  type,
  impactScore,
  onApply,
  onDismiss,
  className,
}: RemediationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(className)}
    >
      <Card className="border-border bg-surface">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              {type.replace(/_/g, " ")}
            </Badge>
            <Badge variant="warning">Impact {Math.round(impactScore * 100)}%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-muted">{description}</p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="button" className="flex-1" onClick={onApply}>
            Apply fix
          </Button>
          <Button type="button" variant="secondary" onClick={onDismiss}>
            Dismiss
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
