"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  Channel,
  PaginatedResponse,
  PublishResult,
} from "@listingpilot/shared-types";
import { apiGet, apiPost } from "@/lib/api";

export interface PublishEventRecord {
  id: string;
  productId: string;
  listingPackageId: string;
  channel: Channel;
  status: string;
  createdAt: string;
  publishedAt: string | null;
}

const publishKeys = {
  events: ["publish", "events"] as const,
  eventsPaged: (page: number, limit: number) =>
    [...publishKeys.events, page, limit] as const,
};

export function usePublishEvents(
  page = 1,
  limit = 20,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<PublishEventRecord>, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: publishKeys.eventsPaged(page, limit),
    queryFn: () =>
      apiGet<PaginatedResponse<PublishEventRecord>>(
        `/publish/events?page=${page}&limit=${limit}`,
      ),
    ...options,
  });
}

export function usePublishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      listingPackageId: string;
      channel: Channel;
      channelAccountId?: string;
      dryRun?: boolean;
    }) => apiPost<PublishResult, typeof body>("/publish", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: publishKeys.events });
    },
  });
}

export function useRevertPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      apiPost<{ reverted: boolean }, Record<string, never>>(
        `/publish/revert/${eventId}`,
        {},
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: publishKeys.events });
    },
  });
}
