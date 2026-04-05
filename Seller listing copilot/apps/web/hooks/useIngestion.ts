"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiGet, apiPostMultipart } from "@/lib/api";

export interface IngestionJob {
  id: string;
  organizationId: string;
  status: string;
  sourceLabel: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SourceAsset {
  id: string;
  ingestionJobId: string;
  type: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status?: string;
}

const ingestionKeys = {
  all: ["ingestions"] as const,
  detail: (id: string) => [...ingestionKeys.all, id] as const,
  assets: (id: string) => [...ingestionKeys.detail(id), "assets"] as const,
};

export function useIngestion(
  id: string | undefined,
  options?: Omit<
    UseQueryOptions<IngestionJob, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ingestionKeys.detail(id ?? ""),
    queryFn: () => apiGet<IngestionJob>(`/ingestions/${id}`),
    enabled: Boolean(id),
    ...options,
  });
}

export function useIngestionAssets(
  id: string | undefined,
  options?: Omit<
    UseQueryOptions<SourceAsset[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ingestionKeys.assets(id ?? ""),
    queryFn: () => apiGet<SourceAsset[]>(`/ingestions/${id}/assets`),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateIngestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      files: File[];
      sourceLabel?: string;
    }) => {
      const formData = new FormData();
      if (input.sourceLabel) {
        formData.append("sourceLabel", input.sourceLabel);
      }
      for (const file of input.files) {
        formData.append("files", file);
      }
      return apiPostMultipart<IngestionJob>("/ingestions", formData);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ingestionKeys.all });
    },
  });
}
