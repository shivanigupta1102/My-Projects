"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { DropZone } from "@/components/ingestion/DropZone";
import { IngestionProgress } from "@/components/ingestion/IngestionProgress";
import { IngestionSourceCard } from "@/components/ingestion/IngestionSourceCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet, apiPostMultipart } from "@/lib/api";
import { toast } from "sonner";

const MAX_IMAGES = 5;

interface IngestionAsset {
  id: string;
  originalFilename: string;
  mimeType: string | null;
  type: string;
  sizeBytes: number | null;
}

interface IngestionProduct {
  id: string;
  title: string | null;
  status: string;
  reviewStatus: string;
  completeness: number;
}

interface IngestionJob {
  id: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  assets?: IngestionAsset[];
  products?: IngestionProduct[];
  _count?: { assets: number };
}

type IngestionStatus =
  | "PENDING"
  | "PROCESSING"
  | "EXTRACTING"
  | "BUILDING"
  | "COMPLETE"
  | "FAILED";

function statusToStageIndex(status: IngestionStatus): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "PROCESSING":
      return 1;
    case "EXTRACTING":
      return 2;
    case "BUILDING":
      return 3;
    case "COMPLETE":
      return 4;
    case "FAILED":
      return -1;
    default:
      return 0;
  }
}

function statusToProgress(status: IngestionStatus): number {
  switch (status) {
    case "PENDING":
      return 10;
    case "PROCESSING":
      return 35;
    case "EXTRACTING":
      return 60;
    case "BUILDING":
      return 85;
    case "COMPLETE":
      return 100;
    case "FAILED":
      return 0;
    default:
      return 0;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface StagedImage {
  file: File;
  preview: string;
}

export default function IngestPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [job, setJob] = useState<IngestionJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
      stagedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopPolling]);

  const pollJob = useCallback(
    (jobId: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const data = await apiGet<IngestionJob>(`/ingestions/${jobId}`);
          setJob(data);
          if (data.status === "COMPLETE" || data.status === "FAILED") {
            stopPolling();
            if (data.status === "FAILED") {
              setError(data.errorMessage ?? "Ingestion failed");
            }
          }
        } catch {
          stopPolling();
          setError("Failed to check ingestion status");
        }
      }, 1500);
    },
    [stopPolling],
  );

  const handleFilesDropped = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        toast.error("Please select image files only");
        return;
      }

      setStagedImages((prev) => {
        const remaining = MAX_IMAGES - prev.length;
        if (remaining <= 0) {
          toast.error(`Maximum ${MAX_IMAGES} images allowed`);
          return prev;
        }
        const toAdd = imageFiles.slice(0, remaining);
        if (imageFiles.length > remaining) {
          toast.warning(
            `Only added ${toAdd.length} of ${imageFiles.length} — limit is ${MAX_IMAGES}`,
          );
        }
        return [
          ...prev,
          ...toAdd.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
        ];
      });
      setError(null);
    },
    [],
  );

  const removeImage = useCallback((index: number) => {
    setStagedImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const startIngestion = useCallback(async () => {
    if (stagedImages.length === 0) return;

    setUploading(true);
    setError(null);
    setJob(null);

    try {
      const formData = new FormData();
      for (const img of stagedImages) {
        formData.append("files", img.file);
      }
      const data = await apiPostMultipart<IngestionJob>(
        "/ingestions",
        formData,
      );
      setJob(data);
      setUploading(false);
      pollJob(data.id);
    } catch (e: unknown) {
      setUploading(false);
      const msg = e instanceof Error ? e.message : "Upload failed";
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        setError("Not logged in. Please log in first, then try again.");
      } else {
        setError(msg);
      }
    }
  }, [stagedImages, pollJob]);

  const resetAll = useCallback(() => {
    stopPolling();
    setJob(null);
    stagedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setStagedImages([]);
    setError(null);
    setUploading(false);
  }, [stopPolling, stagedImages]);

  const status = (job?.status ?? "PENDING") as IngestionStatus;
  const stageIndex = uploading ? 0 : statusToStageIndex(status);
  const isActive =
    uploading || (job != null && status !== "COMPLETE" && status !== "FAILED");
  const isComplete = job != null && status === "COMPLETE";
  const isFailed = job != null && status === "FAILED";
  const hasJobStarted = uploading || job != null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-5xl space-y-8"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Product Ingestion
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Upload up to {MAX_IMAGES} product photos — AI will extract all
          attributes from every angle to build a complete listing.
        </p>
      </div>

      {error && !hasJobStarted && (
        <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {!hasJobStarted && (
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upload Product Images</CardTitle>
              <Badge variant="outline" className="gap-1 font-mono text-xs">
                <Camera className="h-3 w-3" />
                {stagedImages.length} / {MAX_IMAGES}
              </Badge>
            </div>
            <p className="text-xs text-foreground-muted">
              Add multiple angles — front, back, label, details, packaging —
              for the most accurate extraction.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {stagedImages.length < MAX_IMAGES && (
              <DropZone
                onFiles={handleFilesDropped}
                disabled={uploading}
                maxFiles={MAX_IMAGES - stagedImages.length}
                imagesOnly
                hint={`Add up to ${MAX_IMAGES - stagedImages.length} more image${MAX_IMAGES - stagedImages.length === 1 ? "" : "s"} · max 50MB each`}
              />
            )}

            {stagedImages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Staged Images ({stagedImages.length}/{MAX_IMAGES})
                  </p>
                  <div className="flex gap-2">
                    {stagedImages.length >= MAX_IMAGES && (
                      <span className="text-xs text-amber-400">
                        Maximum reached
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {stagedImages.map((img, i) => (
                    <div
                      key={`${img.file.name}-${i}`}
                      className="group relative overflow-hidden rounded-lg border border-border bg-background/60"
                    >
                      <div className="aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.preview}
                          alt={img.file.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="border-t border-border bg-background/80 px-2 py-1.5">
                        <p className="truncate text-[11px] font-medium text-foreground">
                          {img.file.name}
                        </p>
                        <p className="text-[10px] text-foreground-muted">
                          {formatFileSize(img.file.size)}
                        </p>
                      </div>
                      {i === 0 && (
                        <div className="absolute left-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          Main
                        </div>
                      )}
                    </div>
                  ))}

                  {stagedImages.length < MAX_IMAGES && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/30 text-foreground-muted transition-colors hover:border-accent hover:text-accent">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (files.length) handleFilesDropped(files);
                          e.target.value = "";
                        }}
                      />
                      <ImageIcon className="mb-1 h-6 w-6" />
                      <span className="text-[10px] font-medium">Add More</span>
                    </label>
                  )}
                </div>

                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <p className="text-xs text-blue-300">
                    <strong>Tip:</strong> Upload different angles to capture all
                    product details — labels, certifications, barcodes, and
                    packaging. Each image helps the AI extract more attributes.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    size="lg"
                    className="gap-2"
                    onClick={startIngestion}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4" />
                    Start Ingestion ({stagedImages.length} image
                    {stagedImages.length !== 1 ? "s" : ""})
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      stagedImages.forEach((img) =>
                        URL.revokeObjectURL(img.preview),
                      );
                      setStagedImages([]);
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasJobStarted && (
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {isComplete
                  ? "Ingestion complete"
                  : isFailed
                    ? "Ingestion failed"
                    : uploading
                      ? "Uploading..."
                      : "Processing..."}
              </CardTitle>
              {job && (
                <Badge
                  variant={
                    isComplete
                      ? "success"
                      : isFailed
                        ? "error"
                        : "warning"
                  }
                >
                  {job.status}
                </Badge>
              )}
            </div>
            {stagedImages.length > 0 && (
              <p className="text-xs text-foreground-muted">
                {stagedImages.map((img) => img.file.name).join(" · ")}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!isFailed && (
              <IngestionProgress activeIndex={stageIndex} />
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {(job?.assets ?? stagedImages.map((s) => s.file)).map(
                (item, i) => {
                  const isAsset = typeof item === "object" && "originalFilename" in item;
                  const filename = isAsset
                    ? (item as IngestionAsset).originalFilename
                    : (item as File).name;
                  const mimeType = isAsset
                    ? ((item as IngestionAsset).mimeType ??
                      "application/octet-stream")
                    : (item as File).type;

                  return (
                    <IngestionSourceCard
                      key={
                        isAsset
                          ? (item as IngestionAsset).id
                          : `file-${i}`
                      }
                      filename={filename}
                      mimeType={mimeType}
                      status={
                        uploading
                          ? "UPLOADING"
                          : (job?.status ?? "PENDING")
                      }
                      progress={
                        uploading ? 30 : statusToProgress(status)
                      }
                    />
                  );
                },
              )}
            </div>

            {isActive && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploading
                  ? "Uploading images..."
                  : status === "EXTRACTING"
                    ? "AI is analyzing your images..."
                    : "Processing..."}
              </div>
            )}

            {isComplete &&
              job?.products &&
              job.products.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
                    Extracted products
                  </h3>
                  {job.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background/60 p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                          <span className="font-medium text-foreground">
                            {product.title ?? "Untitled Product"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-foreground-muted">
                          Status: {product.status} · Review:{" "}
                          {product.reviewStatus}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/products/${product.id}/review`)
                          }
                          className="gap-1"
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/products/${product.id}/preview`)
                          }
                          className="gap-1"
                        >
                          Preview Listing
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {(isComplete || isFailed) && (
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={resetAll}>
                  Ingest another
                </Button>
                {isComplete && job?.products?.[0] && (
                  <Button
                    onClick={() => {
                      const p = job.products?.[0];
                      if (p) router.push(`/products/${p.id}/preview`);
                    }}
                    className="gap-1"
                  >
                    Preview Listing
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
