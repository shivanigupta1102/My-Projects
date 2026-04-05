"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from "lucide-react";
import type { PaginatedResponse } from "@listingpilot/shared-types";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";

type ProductStatus = "DRAFT" | "REVIEW_READY" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

interface ProductListItem {
  id: string;
  title: string | null;
  brand: string | null;
  modelNumber: string | null;
  upc: string | null;
  ean: string | null;
  asin: string | null;
  status: ProductStatus;
  reviewStatus: string;
  completeness: number;
  createdAt: string;
  updatedAt: string;
}

function formatIdentifiers(p: ProductListItem): string {
  const bits: string[] = [];
  if (p.brand) bits.push(p.brand);
  if (p.modelNumber) bits.push(`Model ${p.modelNumber}`);
  if (p.upc) bits.push(`UPC ${p.upc}`);
  if (p.ean) bits.push(`EAN ${p.ean}`);
  if (p.asin) bits.push(`ASIN ${p.asin}`);
  return bits.length ? bits.join(" · ") : "—";
}

function titleInitial(title: string | null): string {
  const t = title?.trim();
  if (!t) return "?";
  return t[0]!.toUpperCase();
}

function statusVariant(
  s: ProductStatus,
): "warning" | "success" | "outline" | "default" {
  switch (s) {
    case "REVIEW_READY":
      return "warning";
    case "APPROVED":
      return "success";
    case "PUBLISHED":
      return "default";
    case "ARCHIVED":
      return "outline";
    default:
      return "outline";
  }
}

const PAGE_SIZE = 5;
const FETCH_PAGE_SIZE = 100;

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        let apiPage = 1;
        let merged: ProductListItem[] = [];
        let totalPages = 1;

        do {
          const res = await apiGet<PaginatedResponse<ProductListItem>>(
            `/products?page=${apiPage}&limit=${FETCH_PAGE_SIZE}`,
          );
          if (cancelled) return;
          merged = [...merged, ...res.data];
          totalPages = res.totalPages;
          apiPage += 1;
        } while (apiPage <= totalPages);

        if (!cancelled) setProducts(merged);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load products");
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      const matchQ =
        !query ||
        (p.title?.toLowerCase().includes(query) ?? false) ||
        (p.brand?.toLowerCase().includes(query) ?? false) ||
        (p.modelNumber?.toLowerCase().includes(query) ?? false) ||
        (p.upc?.toLowerCase().includes(query) ?? false) ||
        (p.ean?.toLowerCase().includes(query) ?? false) ||
        (p.asin?.toLowerCase().includes(query) ?? false);
      const matchS = statusFilter === "all" || p.status === statusFilter;
      return matchQ && matchS;
    });
  }, [q, statusFilter, products]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-7xl space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Canonical records, completeness, and channel coverage.
          </p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/ingest">
            <Plus className="h-4 w-4" />
            New product
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, SKU, UPC…"
            className="bg-surface pl-9"
            disabled={loading}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          disabled={loading}
        >
          <SelectTrigger className="w-full md:w-[180px] bg-surface">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="REVIEW_READY">Review ready</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-border bg-surface">
        {loading ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
            <span className="text-sm text-foreground-muted">Loading products…</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]" />
                <TableHead>Title</TableHead>
                <TableHead>SKU / UPC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completeness</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-foreground-muted">
                    No products match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-background text-sm font-semibold text-foreground-muted">
                        {titleInitial(p.title)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px] font-medium">
                      <Link
                        href={`/products/${p.id}`}
                        className="hover:text-accent hover:underline"
                      >
                        {p.title ?? "Untitled"}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground-muted">
                      {formatIdentifiers(p)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(p.status)}>
                        {p.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[140px]">
                      <div className="mb-1 flex justify-between text-[10px] text-foreground-muted">
                        <span>{Math.round(p.completeness)}%</span>
                      </div>
                      <Progress value={p.completeness} className="h-1.5" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/products/${p.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-foreground-muted">
        <span>
          Page {Math.min(page, totalPages)} of {totalPages} · {filtered.length} products
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
