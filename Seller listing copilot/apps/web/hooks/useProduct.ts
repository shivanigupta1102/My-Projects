"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  CanonicalProduct,
  EvidenceRecord,
  PaginatedResponse,
  ProductAttribute,
} from "@listingpilot/shared-types";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

const productKeys = {
  all: ["products"] as const,
  list: (page: number, limit: number) =>
    [...productKeys.all, "list", page, limit] as const,
  detail: (id: string) => [...productKeys.all, id] as const,
  attributes: (id: string) => [...productKeys.detail(id), "attributes"] as const,
  evidence: (id: string) => [...productKeys.detail(id), "evidence"] as const,
};

export function useProducts(
  page = 1,
  limit = 20,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<CanonicalProduct>, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: productKeys.list(page, limit),
    queryFn: () =>
      apiGet<PaginatedResponse<CanonicalProduct>>(
        `/products?page=${page}&limit=${limit}`,
      ),
    ...options,
  });
}

export function useProduct(
  id: string | undefined,
  options?: Omit<
    UseQueryOptions<CanonicalProduct, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => apiGet<CanonicalProduct>(`/products/${id}`),
    enabled: Boolean(id),
    ...options,
  });
}

export function useProductAttributes(
  productId: string | undefined,
  options?: Omit<
    UseQueryOptions<ProductAttribute[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: productKeys.attributes(productId ?? ""),
    queryFn: () =>
      apiGet<ProductAttribute[]>(`/products/${productId}/attributes`),
    enabled: Boolean(productId),
    ...options,
  });
}

export function useProductEvidence(
  productId: string | undefined,
  options?: Omit<
    UseQueryOptions<EvidenceRecord[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: productKeys.evidence(productId ?? ""),
    queryFn: () => apiGet<EvidenceRecord[]>(`/products/${productId}/evidence`),
    enabled: Boolean(productId),
    ...options,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title?: string; brand?: string }) =>
      apiPost<CanonicalProduct, typeof body>("/products", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<CanonicalProduct, "title" | "brand" | "status" | "reviewStatus">>) =>
      apiPatch<CanonicalProduct, typeof body>(`/products/${productId}`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      void qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ deleted: boolean }>(`/products/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useAddAttribute(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      fieldName: string;
      value: string;
      confidence?: number;
      method?: string;
    }) =>
      apiPost<ProductAttribute, typeof body>(
        `/products/${productId}/attributes`,
        body,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.attributes(productId) });
      void qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}
