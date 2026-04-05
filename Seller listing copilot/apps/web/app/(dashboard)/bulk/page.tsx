"use client";

import { isAxiosError } from "axios";
import { Loader2, Layers, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { PaginatedResponse } from "@listingpilot/shared-types";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  title: string | null;
  status: string;
};

const CHANNEL_OPTIONS = [
  { value: "AMAZON", label: "Amazon" },
  { value: "EBAY", label: "eBay" },
  { value: "WALMART", label: "Walmart" },
  { value: "SHOPIFY", label: "Shopify" },
  { value: "ETSY", label: "Etsy" },
] as const;

function toggleSet<T>(set: Set<T>, key: T, on: boolean): Set<T> {
  const next = new Set(set);
  if (on) next.add(key);
  else next.delete(key);
  return next;
}

export default function BulkOpsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(
    () => new Set(),
  );

  const [publishing, setPublishing] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setLoadError(null);
    try {
      const res = await apiGet<PaginatedResponse<Product>>(
        "/products?limit=100",
      );
      setProducts(res.data);
      setSelectedProductIds(new Set());
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { error?: string })?.error ??
          e.message ??
          "Failed to load products"
        : e instanceof Error
          ? e.message
          : "Failed to load products";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const allProductsSelected = useMemo(() => {
    if (products.length === 0) return false;
    return products.every((p) => selectedProductIds.has(p.id));
  }, [products, selectedProductIds]);

  const someProductsSelected = useMemo(() => {
    if (products.length === 0) return false;
    const n = products.filter((p) => selectedProductIds.has(p.id)).length;
    return n > 0 && n < products.length;
  }, [products, selectedProductIds]);

  const headerCheckboxState = allProductsSelected
    ? true
    : someProductsSelected
      ? "indeterminate"
      : false;

  const toggleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(new Set(products.map((p) => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  const toggleProduct = (id: string, checked: boolean) => {
    setSelectedProductIds((prev) => toggleSet(prev, id, checked));
  };

  const toggleChannel = (value: string, checked: boolean) => {
    setSelectedChannels((prev) => toggleSet(prev, value, checked));
  };

  const handleBulkPublish = async () => {
    if (selectedProductIds.size === 0) {
      toast.error("Select at least one product.");
      return;
    }
    if (selectedChannels.size === 0) {
      toast.error("Select at least one channel.");
      return;
    }

    setPublishing(true);
    try {
      const result = await apiPost<{ operationId: string }, { productIds: string[]; channels: string[] }>(
        "/bulk/publish",
        {
          productIds: Array.from(selectedProductIds),
          channels: Array.from(selectedChannels),
        },
      );
      toast.success(
        `Bulk publish started${result.operationId ? ` (${result.operationId})` : ""}.`,
      );
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { error?: string })?.error ??
          e.message ??
          "Bulk publish failed"
        : e instanceof Error
          ? e.message
          : "Bulk publish failed";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Bulk publish
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Choose products and marketplaces, then start a bulk publish job.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-foreground-muted">Channels</h2>
        <p className="mt-1 text-xs text-foreground-muted">
          Select one or more channels to publish to.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          {CHANNEL_OPTIONS.map((ch) => (
            <label
              key={ch.value}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={selectedChannels.has(ch.value)}
                onCheckedChange={(v) => toggleChannel(ch.value, v === true)}
                disabled={publishing}
              />
              <span className="text-sm text-foreground">{ch.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground-muted">
              Products
            </h2>
            <p className="mt-1 text-xs text-foreground-muted">
              Up to 100 products loaded. {selectedProductIds.size} selected.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadProducts()}
              disabled={loadingProducts || publishing}
            >
              {loadingProducts ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleBulkPublish()}
              disabled={
                loadingProducts ||
                publishing ||
                selectedProductIds.size === 0 ||
                selectedChannels.size === 0
              }
            >
              {publishing ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Layers className="mr-2 h-3.5 w-3.5" />
              )}
              Bulk publish
            </Button>
          </div>
        </div>

        {loadError && (
          <p className="mt-4 text-sm text-error" role="alert">
            {loadError}
          </p>
        )}

        <div className="mt-4 overflow-x-auto rounded-md border border-border">
          {loadingProducts ? (
            <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-foreground-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading products…
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center px-4 text-center text-sm text-foreground-muted">
              No products found. Create products or adjust filters elsewhere,
              then refresh.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={headerCheckboxState}
                      onCheckedChange={(v) => toggleSelectAllProducts(v === true)}
                      disabled={publishing}
                      aria-label="Select all products"
                    />
                  </TableHead>
                  <TableHead className="text-foreground-muted">Title</TableHead>
                  <TableHead className="text-foreground-muted">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const checked = selectedProductIds.has(p.id);
                  return (
                    <TableRow
                      key={p.id}
                      className={cn(
                        "border-border",
                        checked && "bg-background/40",
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            toggleProduct(p.id, v === true)
                          }
                          disabled={publishing}
                          aria-label={`Select ${p.title ?? p.id}`}
                        />
                      </TableCell>
                      <TableCell className="max-w-[min(480px,50vw)] truncate font-medium text-foreground">
                        {p.title?.trim() || "(untitled)"}
                      </TableCell>
                      <TableCell className="text-foreground-muted">
                        {p.status}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
