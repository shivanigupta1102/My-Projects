"use client";

import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";

const ACCEPT_ALL = {
  "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/pdf": [".pdf"],
};

const ACCEPT_IMAGES = {
  "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
};

export interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  maxFiles?: number;
  imagesOnly?: boolean;
  hint?: string;
}

export function DropZone({
  onFiles,
  disabled,
  className,
  maxFiles = 20,
  imagesOnly = false,
  hint,
}: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length) onFiles(accepted);
    },
    [onFiles],
  );

  const onDropRejected = useCallback((rej: FileRejection[]) => {
    console.warn("Rejected files", rej);
  }, []);

  const accept = imagesOnly ? ACCEPT_IMAGES : ACCEPT_ALL;

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      onDropRejected,
      disabled,
      accept,
      maxFiles,
    });

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 transition-colors duration-200",
          isDragActive
            ? "border-accent bg-accent/[0.08]"
            : "border-border bg-surface/60",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-3 h-10 w-10 text-accent" />
        <p className="text-center text-sm font-medium text-foreground">
          {isDragActive
            ? "Drop files to upload"
            : imagesOnly
              ? `Drag & drop up to ${maxFiles} product images`
              : "Drag & drop images, CSV, XLSX, or PDF"}
        </p>
        <p className="mt-1 text-center text-xs text-foreground-muted">
          {hint ?? `Up to ${maxFiles} files · max 50MB each`}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-[10px] uppercase text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> Images
          </span>
          {!imagesOnly && (
            <>
              <span className="inline-flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3" /> CSV / XLSX
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" /> PDF
              </span>
            </>
          )}
        </div>
        {fileRejections.length > 0 && (
          <p className="mt-3 text-xs text-error">
            Some files were rejected. Check type and size.
          </p>
        )}
      </div>
    </div>
  );
}
