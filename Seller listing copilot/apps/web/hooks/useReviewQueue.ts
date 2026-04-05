"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductAttribute, ReviewQueueItem } from "@listingpilot/shared-types";
import { apiGet, apiPost } from "@/lib/api";

const reviewKeys = {
  queue: ["review-queue"] as const,
};

export function useReviewQueue(options?: { mockData?: ReviewQueueItem[] }) {
  const isMock = options !== undefined && "mockData" in options;
  return useQuery({
    queryKey: reviewKeys.queue,
    queryFn: () => apiGet<ReviewQueueItem[]>("/review-queue"),
    enabled: !isMock,
    initialData: options?.mockData,
    staleTime: isMock ? Number.POSITIVE_INFINITY : 60_000,
  });
}

export function useApproveAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attributeId: string) =>
      apiPost<ProductAttribute, { attributeId: string }>("/review-queue/approve", {
        attributeId,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reviewKeys.queue });
    },
  });
}

export function useOverrideAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      attributeId: string;
      value: string;
      normalizedValue?: string;
    }) =>
      apiPost<ProductAttribute, typeof input>("/review-queue/override", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reviewKeys.queue });
    },
  });
}

export function useBulkApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attributeIds: string[]) =>
      apiPost<{ updated: number }, { attributeIds: string[] }>(
        "/review-queue/bulk-approve",
        { attributeIds },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reviewKeys.queue });
    },
  });
}
