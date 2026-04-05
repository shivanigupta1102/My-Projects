"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface IngestionSourceCardProps {
  filename: string;
  mimeType: string;
  status: string;
  progress: number;
  className?: string;
}

function iconFor(filename: string, mime: string) {
  const m = mime.toLowerCase();
  const f = filename.toLowerCase();
  if (m.startsWith("image/")) return ImageIcon;
  if (m.includes("sheet") || m.includes("csv") || /\.xlsx?$/.test(f))
    return FileSpreadsheet;
  return FileText;
}

export function IngestionSourceCard({
  filename,
  mimeType,
  status,
  progress,
  className,
}: IngestionSourceCardProps) {
  const Icon = iconFor(filename, mimeType);
  const processing =
    status === "PROCESSING" ||
    status === "PENDING" ||
    status === "UPLOADING";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(className)}
    >
      <Card className="border-border bg-surface">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-sm text-foreground">
              {filename}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">{status}</Badge>
              {processing && (
                <Loader2 className="h-3 w-3 animate-spin text-accent" />
              )}
            </div>
            <Progress value={progress} className="mt-2 h-1" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
