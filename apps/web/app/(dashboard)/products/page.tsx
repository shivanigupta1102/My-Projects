"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
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

type ProductStatus = "DRAFT" | "REVIEW_READY" | "APPROVED" | "PUBLISHED";

interface ProductRow {
  id: string;
  title: string;
  sku: string;
  thumb: string;
  status: ProductStatus;
  completeness: number;
  channels: string[];
}

const MOCK_PRODUCTS: ProductRow[] = [
  {
    id: "prod-8842",
    title: "AeroPress Clear Coffee Maker",
    sku: "NW-2044 · UPC 085255118926",
    thumb: "https://picsum.photos/seed/ap1/80/80",
    status: "REVIEW_READY",
    completeness: 88,
    channels: ["Amazon", "Shopify"],
  },
  {
    id: "prod-7721",
    title: "Ceramic Pour-Over Set (Matte Black)",
    sku: "NW-1192 · UPC 008421993104",
    thumb: "https://picsum.photos/seed/po1/80/80",
    status: "APPROVED",
    completeness: 96,
    channels: ["Amazon", "eBay", "Etsy"],
  },
  {
    id: "prod-6610",
    title: "Stainless Steel Milk Frother",
    sku: "NW-3301",
    thumb: "https://picsum.photos/seed/fr1/80/80",
    status: "DRAFT",
    completeness: 54,
    channels: ["eBay"],
  },
  {
    id: "prod-5509",
    title: "Glass Storage Canisters — 3 Pack",
    sku: "NW-4410 · GTIN 008421993118",
    thumb: "https://picsum.photos/seed/gc1/80/80",
    status: "REVIEW_READY",
    completeness: 71,
    channels: ["Walmart", "Amazon"],
  },
  {
    id: "prod-4408",
    title: "Bamboo Cutting Board — Large",
    sku: "NW-2208",
    thumb: "https://picsum.photos/seed/bb1/80/80",
    status: "PUBLISHED",
    completeness: 100,
    channels: ["Etsy", "Shopify"],
  },
  {
    id: "prod-3307",
    title: "Copper French Press — 34oz",
    sku: "NW-1188",
    thumb: "https://picsum.photos/seed/fp1/80/80",
    status: "REVIEW_READY",
    completeness: 63,
    channels: ["Amazon", "Walmart"],
  },
  {
    id: "prod-2206",
    title: "Digital Kitchen Scale — USB-C",
    sku: "NW-5512",
    thumb: "https://picsum.photos/seed/ks1/80/80",
    status: "APPROVED",
    completeness: 91,
    channels: ["Shopify", "eBay"],
  },
  {
    id: "prod-1105",
    title: "Silicone Espresso Tamping Mat",
    sku: "NW-0093",
    thumb: "https://picsum.photos/seed/tm1/80/80",
    status: "DRAFT",
    completeness: 42,
    channels: ["Amazon"],
  },
  {
    id: "prod-0094",
    title: "Vacuum-Insulated Travel Mug — 16oz",
    sku: "NW-6620",
    thumb: "https://picsum.photos/seed/mg1/80/80",
    status: "REVIEW_READY",
    completeness: 77,
    channels: ["Amazon", "eBay", "Walmart"],
  },
  {
    id: "prod-9983",
    title: "Handcrafted Ceramic Mug — Speckle",
    sku: "NW-7731",
    thumb: "https://picsum.photos/seed/mg2/80/80",
    status: "APPROVED",
    completeness: 89,
    channels: ["Etsy", "Shopify"],
  },
];

function statusVariant(s: ProductStatus): "warning" | "success" | "outline" | "default" {
  switch (s) {
    case "REVIEW_READY":
      return "warning";
    case "APPROVED":
      return "success";
    case "PUBLISHED":
      return "default";
    default:
      return "outline";
  }
}

const PAGE_SIZE = 5;

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      const matchQ =
        !q.trim() ||
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.sku.toLowerCase().includes(q.toLowerCase());
      const matchS = statusFilter === "all" || p.status === statusFilter;
      const matchC =
        channelFilter === "all" ||
        p.channels.some((c) => c.toLowerCase() === channelFilter.toLowerCase());
      return matchQ && matchS && matchC;
    });
  }, [q, statusFilter, channelFilter]);

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
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
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
          </SelectContent>
        </Select>
        <Select
          value={channelFilter}
          onValueChange={(v) => {
            setChannelFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[180px] bg-surface">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="amazon">Amazon</SelectItem>
            <SelectItem value="ebay">eBay</SelectItem>
            <SelectItem value="walmart">Walmart</SelectItem>
            <SelectItem value="shopify">Shopify</SelectItem>
            <SelectItem value="etsy">Etsy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[72px]" />
              <TableHead>Title</TableHead>
              <TableHead>SKU / UPC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completeness</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="relative h-10 w-10 overflow-hidden rounded border border-border bg-background">
                    <Image src={p.thumb} alt="" width={40} height={40} className="object-cover" unoptimized />
                  </div>
                </TableCell>
                <TableCell className="max-w-[220px] font-medium">
                  <Link href={`/products/${p.id}`} className="hover:text-accent hover:underline">
                    {p.title}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground-muted">{p.sku}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(p.status)}>{p.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell className="w-[140px]">
                  <div className="mb-1 flex justify-between text-[10px] text-foreground-muted">
                    <span>{p.completeness}%</span>
                  </div>
                  <Progress value={p.completeness} className="h-1.5" />
                </TableCell>
                <TableCell className="text-xs text-foreground-muted">
                  {p.channels.join(", ")}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/products/${p.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-foreground-muted">
        <span>
          Page {page} of {totalPages} · {filtered.length} products
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
