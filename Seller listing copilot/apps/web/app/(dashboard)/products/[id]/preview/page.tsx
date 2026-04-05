"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Pencil,
  Shield,
  ShoppingCart,
  Star,
  Store,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import { toast } from "sonner";

function resolveImageBase(): string {
  if (typeof window === "undefined") return "http://localhost:4000/api/v1";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000/api/v1";
  return `${window.location.origin}/api/v1`;
}

interface Product {
  id: string;
  title: string | null;
  brand: string | null;
  modelNumber: string | null;
  upc: string | null;
  ean: string | null;
  asin: string | null;
  status: string;
  reviewStatus: string;
  completeness: number;
}

interface Attribute {
  id: string;
  fieldName: string;
  value: string;
  normalizedValue: string | null;
  confidence: number;
  method: string;
  requiresReview: boolean;
}

interface ProductImage {
  id: string;
  filename: string;
  mimeType: string | null;
  url: string;
}

interface ListingPackage {
  id: string;
  channel: string;
  status: string;
  title: string | null;
  description: string | null;
  bulletsJson: string[] | unknown;
  qualityScore: number | null;
  attributesJson: Record<string, unknown> | unknown;
  keywordsJson: string[] | unknown;
}

type ChannelId = "EBAY" | "AMAZON" | "SHOPIFY" | "WALMART" | "ETSY" | "ALL";

interface ChannelConfig {
  id: ChannelId;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  titleLimit: number;
  bulletLimit: number;
  descLimit: number;
  requiresGtin: boolean;
  requiredFields: string[];
}

const CHANNELS: ChannelConfig[] = [
  {
    id: "EBAY",
    name: "eBay",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    titleLimit: 80,
    bulletLimit: 0,
    descLimit: 500000,
    requiresGtin: false,
    requiredFields: ["title", "condition"],
  },
  {
    id: "AMAZON",
    name: "Amazon",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    titleLimit: 200,
    bulletLimit: 5,
    descLimit: 2000,
    requiresGtin: true,
    requiredFields: ["title", "brand", "category", "condition"],
  },
  {
    id: "SHOPIFY",
    name: "Shopify",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    titleLimit: 255,
    bulletLimit: 20,
    descLimit: 100000,
    requiresGtin: false,
    requiredFields: ["title"],
  },
  {
    id: "WALMART",
    name: "Walmart",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    titleLimit: 200,
    bulletLimit: 10,
    descLimit: 4000,
    requiresGtin: true,
    requiredFields: ["title", "brand", "category", "condition"],
  },
  {
    id: "ETSY",
    name: "Etsy",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    titleLimit: 140,
    bulletLimit: 13,
    descLimit: 100000,
    requiresGtin: false,
    requiredFields: ["title", "category"],
  },
];

function fieldDisplayName(fieldName: string): string {
  return fieldName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function clipText(text: string, limit: number): string {
  return text.length <= limit ? text : text.slice(0, limit - 1) + "…";
}

interface ComplianceCheck {
  field: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

function runChannelCompliance(
  ch: ChannelConfig,
  title: string,
  description: string | null,
  bullets: string[],
  attrMap: Record<string, string>,
  images: ProductImage[],
  product: Product,
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Title length
  if (title.length <= ch.titleLimit) {
    checks.push({ field: "title", label: "Title Length", status: "pass", message: `${title.length}/${ch.titleLimit} chars` });
  } else {
    checks.push({ field: "title", label: "Title Length", status: "fail", message: `${title.length}/${ch.titleLimit} — exceeds limit` });
  }

  // Description
  if (description && description.length > 0) {
    if (description.length <= ch.descLimit) {
      checks.push({ field: "description", label: "Description", status: "pass", message: `${description.length} chars` });
    } else {
      checks.push({ field: "description", label: "Description", status: "fail", message: `${description.length}/${ch.descLimit} — exceeds limit` });
    }
  } else {
    checks.push({ field: "description", label: "Description", status: "warn", message: "Missing — reduces conversion" });
  }

  // Bullets
  if (ch.bulletLimit > 0) {
    if (bullets.length >= 3) {
      checks.push({ field: "bullets", label: "Bullet Points", status: "pass", message: `${bullets.length}/${ch.bulletLimit}` });
    } else if (bullets.length > 0) {
      checks.push({ field: "bullets", label: "Bullet Points", status: "warn", message: `${bullets.length}/${ch.bulletLimit} — add more for better conversion` });
    } else {
      checks.push({ field: "bullets", label: "Bullet Points", status: "warn", message: `Missing — recommended for ${ch.name}` });
    }
  }

  // Images
  if (images.length > 0) {
    checks.push({ field: "images", label: "Images", status: "pass", message: `${images.length} image${images.length !== 1 ? "s" : ""}` });
  } else {
    checks.push({ field: "images", label: "Images", status: "fail", message: "Required — no images uploaded" });
  }

  // GTIN
  if (ch.requiresGtin) {
    if (product.upc || product.ean) {
      checks.push({ field: "gtin", label: "GTIN/UPC", status: "pass", message: product.upc ?? product.ean ?? "" });
    } else {
      checks.push({ field: "gtin", label: "GTIN/UPC", status: "fail", message: `Required for ${ch.name}` });
    }
  }

  // Brand
  if (ch.requiredFields.includes("brand")) {
    if (product.brand || attrMap["brand"]) {
      checks.push({ field: "brand", label: "Brand", status: "pass", message: product.brand ?? attrMap["brand"] ?? "" });
    } else {
      checks.push({ field: "brand", label: "Brand", status: "fail", message: "Required" });
    }
  }

  // Category
  if (ch.requiredFields.includes("category")) {
    if (attrMap["category"]) {
      checks.push({ field: "category", label: "Category", status: "pass", message: attrMap["category"] });
    } else {
      checks.push({ field: "category", label: "Category", status: "warn", message: "Recommended for better placement" });
    }
  }

  // Condition
  if (ch.requiredFields.includes("condition")) {
    if (attrMap["condition"]) {
      checks.push({ field: "condition", label: "Condition", status: "pass", message: attrMap["condition"] });
    } else {
      checks.push({ field: "condition", label: "Condition", status: "fail", message: "Required" });
    }
  }

  // Attribute richness
  const attrCount = Object.keys(attrMap).filter(
    (k) => !k.startsWith("ingestion.") && k !== "human_description" && k !== "description",
  ).length;
  if (attrCount >= 8) {
    checks.push({ field: "specifics", label: "Item Specifics", status: "pass", message: `${attrCount} attributes` });
  } else if (attrCount >= 4) {
    checks.push({ field: "specifics", label: "Item Specifics", status: "warn", message: `${attrCount} attributes — add more` });
  } else {
    checks.push({ field: "specifics", label: "Item Specifics", status: "fail", message: `Only ${attrCount} — minimum 4 recommended` });
  }

  return checks;
}

export default function ListingPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [packages, setPackages] = useState<ListingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>("EBAY");
  const [retrying, setRetrying] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [prod, attrs, imgs, pkgs] = await Promise.all([
        apiGet<Product>(`/products/${id}`),
        apiGet<Attribute[]>(`/products/${id}/attributes`).catch(() => [] as Attribute[]),
        apiGet<ProductImage[]>(`/products/${id}/images`).catch(() => [] as ProductImage[]),
        apiGet<ListingPackage[]>(`/listing-packages/product/${id}`).catch(() => [] as ListingPackage[]),
      ]);
      setProduct(prod);
      setAttributes(attrs);
      const apiBase = resolveImageBase();
      setImages(imgs.map((img) => ({
        ...img,
        url: img.url.startsWith("http") ? img.url : `${apiBase}${img.url}`,
      })));
      setPackages(pkgs);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const prevImage = () =>
    setActiveImage((i) => (i > 0 ? i - 1 : images.length - 1));
  const nextImage = () =>
    setActiveImage((i) => (i < images.length - 1 ? i + 1 : 0));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl pt-16 text-center">
        <p className="text-foreground-muted">{error ?? "Product not found"}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  const extractionError = attributes.find((a) => a.fieldName === "ingestion.ai_extraction_error")?.value ?? null;

  const handleRetryExtraction = async () => {
    setRetrying(true);
    try {
      const result = await apiPost<{ queued: number; message: string }>(`/products/${id}/retry-extraction`);
      if (result.queued === 0) {
        toast.warning(result.message || "No assets to re-extract");
      } else {
        toast.success(`Re-queued ${result.queued} asset(s) — waiting for extraction…`);
        await new Promise((r) => setTimeout(r, 6000));
        await fetchData();
        toast.success("Data refreshed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry extraction failed");
    } finally {
      setRetrying(false);
    }
  };

  const dedupedAttrs = (() => {
    const seen = new Map<string, Attribute>();
    for (const a of attributes) {
      if (a.fieldName.startsWith("ingestion.")) continue;
      const key = a.fieldName.toLowerCase();
      const existing = seen.get(key);
      if (!existing || a.value.length > existing.value.length || a.confidence > existing.confidence) {
        seen.set(key, a);
      }
    }
    return Array.from(seen.values());
  })();
  const displayAttrs = dedupedAttrs;
  const attrMap: Record<string, string> = {};
  for (const a of displayAttrs) {
    attrMap[a.fieldName.toLowerCase()] = a.value;
  }

  const rawTitle = product.title ?? "Untitled Product";
  const humanDescription = attrMap["human_description"] ?? null;
  const rawDescription = attrMap["description"] ?? null;
  const fullDescription = humanDescription ?? rawDescription;
  const brand = product.brand ?? attrMap["brand"] ?? null;
  const condition = attrMap["condition"] ?? "New";
  const features = attrMap["notable_features"] ?? null;
  const certCompany = attrMap["certification_company"] ?? null;
  const certNumber = attrMap["certification_number"] ?? null;
  const grade = attrMap["grade"] ?? null;
  const playerName = attrMap["player_name"] ?? null;
  const team = attrMap["team"] ?? null;

  const bullets: string[] = [];
  if (features) bullets.push(...features.split(",").map((f) => f.trim()).filter(Boolean));
  if (attrMap["certifications"]) bullets.push(`Certifications: ${attrMap["certifications"]}`);
  if (attrMap["material"]) bullets.push(`Material: ${attrMap["material"]}`);
  if (attrMap["color"]) bullets.push(`Color: ${attrMap["color"]}`);
  if (condition) bullets.push(`Condition: ${condition}`);

  const specificsAttrs = displayAttrs
    .filter((a) => !["title", "description", "human_description"].includes(a.fieldName.toLowerCase()))
    .sort((a, b) => {
      const order = ["brand","certification_company","certification_number","grade","player_name","team","card_number","card_set","card_year","condition","color","material","category"];
      const ai = order.indexOf(a.fieldName.toLowerCase());
      const bi = order.indexOf(b.fieldName.toLowerCase());
      return (ai >= 0 ? ai : order.length) - (bi >= 0 ? bi : order.length);
    });

  const allCompliance = CHANNELS.map((ch) => ({
    channel: ch,
    checks: runChannelCompliance(ch, rawTitle, fullDescription, bullets, attrMap, images, product),
  }));

  const getChannelTitle = (ch: ChannelConfig) => clipText(rawTitle, ch.titleLimit);
  const getChannelBullets = (ch: ChannelConfig) => ch.bulletLimit > 0 ? bullets.slice(0, ch.bulletLimit) : [];
  const getChannelDesc = (ch: ChannelConfig) =>
    fullDescription ? clipText(fullDescription, ch.descLimit) : null;

  const currentChannel = CHANNELS.find((c) => c.id === selectedChannel);

  const getComplianceScore = (checks: ComplianceCheck[]) => {
    const total = checks.length;
    const passed = checks.filter((c) => c.status === "pass").length;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-7xl"
    >
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1 text-foreground-muted" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-400">
            <Eye className="h-3 w-3" /> Preview Mode
          </Badge>
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href={`/products/${id}/review`}><Pencil className="h-3 w-3" /> Edit</Link>
          </Button>
          <Button size="sm" asChild className="gap-1">
            <Link href={`/products/${id}/channels`}>Channel Packages</Link>
          </Button>
        </div>
      </div>

      {/* Channel Toggle Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2">
        <span className="px-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Preview as:</span>
        {CHANNELS.map((ch) => {
          const comp = allCompliance.find((c) => c.channel.id === ch.id);
          const score = comp ? getComplianceScore(comp.checks) : 0;
          const isActive = selectedChannel === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? `${ch.bgColor} ${ch.borderColor} border ${ch.color}`
                  : "text-foreground-muted hover:bg-background/60"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              {ch.name}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                score === 100
                  ? "bg-green-500/20 text-green-400"
                  : score >= 70
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-red-500/20 text-red-400"
              }`}>
                {score}%
              </span>
            </button>
          );
        })}
        <div className="ml-auto">
          <button
            onClick={() => setSelectedChannel("ALL")}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              selectedChannel === "ALL"
                ? "border border-accent/40 bg-accent/10 text-accent"
                : "text-foreground-muted hover:bg-background/60"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            All Channels
          </button>
        </div>
      </div>

      {/* ALL CHANNELS — Compliance Dashboard */}
      {selectedChannel === "ALL" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-[#181a20] p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Cross-Channel Compliance</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {allCompliance.map(({ channel: ch, checks }) => {
                const score = getComplianceScore(checks);
                const fails = checks.filter((c) => c.status === "fail").length;
                const warns = checks.filter((c) => c.status === "warn").length;
                const passes = checks.filter((c) => c.status === "pass").length;
                const pkg = packages.find((p) => p.channel === ch.id);
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`rounded-lg border p-4 text-left transition-all hover:ring-1 hover:ring-accent/50 ${ch.borderColor} bg-[#1a1c22]`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`text-sm font-bold ${ch.color}`}>{ch.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        score === 100
                          ? "bg-green-500/20 text-green-400"
                          : score >= 70
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                      }`}>
                        {score}%
                      </span>
                    </div>
                    <div className="mb-3 h-2 overflow-hidden rounded-full bg-background/60">
                      <div
                        className={`h-full rounded-full transition-all ${
                          score === 100 ? "bg-green-500" : score >= 70 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-green-400"><Check className="h-3 w-3" />{passes}</span>
                      <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3 w-3" />{warns}</span>
                      <span className="flex items-center gap-1 text-red-400"><XCircle className="h-3 w-3" />{fails}</span>
                    </div>
                    {pkg && (
                      <div className="mt-2 text-[10px] text-foreground-muted">
                        Quality: {pkg.qualityScore != null ? `${Math.round((pkg.qualityScore <= 1 ? pkg.qualityScore * 100 : pkg.qualityScore))}%` : "—"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-channel detail checks */}
          {allCompliance.map(({ channel: ch, checks }) => (
            <div key={ch.id} className={`rounded-xl border ${ch.borderColor} bg-[#181a20] p-5`}>
              <div className="mb-3 flex items-center gap-2">
                <Store className={`h-4 w-4 ${ch.color}`} />
                <h3 className={`text-sm font-bold ${ch.color}`}>{ch.name} Requirements</h3>
                <span className="ml-auto text-xs text-foreground-muted">
                  Title: {rawTitle.length}/{ch.titleLimit} · Bullets: {ch.bulletLimit > 0 ? `${Math.min(bullets.length, ch.bulletLimit)}/${ch.bulletLimit}` : "N/A"}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {checks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md bg-[#1a1c22] px-3 py-2">
                    {check.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                    ) : check.status === "warn" ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-foreground">{check.label}</span>
                      <p className="truncate text-[11px] text-foreground-muted">{check.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SINGLE CHANNEL PREVIEW */}
      {selectedChannel !== "ALL" && currentChannel && (
        <div className={`overflow-hidden rounded-xl border ${currentChannel.borderColor} bg-[#181a20]`}>
          {/* Channel header */}
          <div className={`flex items-center justify-between border-b ${currentChannel.borderColor} ${currentChannel.bgColor} px-6 py-2`}>
            <div className="flex items-center gap-2">
              <Store className={`h-4 w-4 ${currentChannel.color}`} />
              <span className={`text-sm font-bold ${currentChannel.color}`}>{currentChannel.name} Listing Preview</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
              <span>Title: {getChannelTitle(currentChannel).length}/{currentChannel.titleLimit}</span>
              {currentChannel.bulletLimit > 0 && (
                <span>Bullets: {getChannelBullets(currentChannel).length}/{currentChannel.bulletLimit}</span>
              )}
              {(() => {
                const comp = allCompliance.find((c) => c.channel.id === currentChannel.id);
                const score = comp ? getComplianceScore(comp.checks) : 0;
                return (
                  <span className={`rounded-full px-2 py-0.5 font-bold ${
                    score === 100 ? "bg-green-500/20 text-green-400"
                      : score >= 70 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {score}% Ready
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="border-b border-border/50 bg-[#1a1c22] px-6 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
              <span>{currentChannel.name}</span>
              <ChevronRight className="h-3 w-3" />
              <span>{attrMap["category"] ?? "Products"}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{getChannelTitle(currentChannel).length > 50 ? getChannelTitle(currentChannel).slice(0, 50) + "…" : getChannelTitle(currentChannel)}</span>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
            {/* LEFT — Image + Description + Specifics */}
            <div className="border-r border-border/50 p-6">
              {/* Image Gallery */}
              <div className="relative mb-4 overflow-hidden rounded-lg bg-[#0d0f13]">
                {images.length > 0 ? (
                  <>
                    <div className="flex aspect-square items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={images[activeImage]?.url} alt={rawTitle} className="max-h-full max-w-full object-contain" />
                    </div>
                    {images.length > 1 && (
                      <>
                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80">
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                          {activeImage + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex aspect-square flex-col items-center justify-center text-foreground-muted">
                    <Eye className="mb-2 h-12 w-12 opacity-30" />
                    <p className="text-sm">No images</p>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                        i === activeImage ? "border-accent ring-1 ring-accent/50" : "border-border/50 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
                    {currentChannel.id === "EBAY" ? "Item Description" : currentChannel.id === "AMAZON" ? "Product Description" : "Description"}
                  </h2>
                  {humanDescription && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-medium text-green-400">
                      <Zap className="h-3 w-3" />AI-Written
                    </span>
                  )}
                </div>
                {getChannelDesc(currentChannel) ? (
                  <div className="rounded-lg border border-border/30 bg-[#1a1c22] p-5">
                    <div className="text-[15px] leading-[1.75] text-foreground/90">
                      {getChannelDesc(currentChannel)!.split("\n").filter(Boolean).map((p, i) => (
                        <p key={i} className="mb-3 last:mb-0">{p}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-300">No description generated</p>
                        {extractionError ? (
                          <p className="mt-1 rounded bg-red-500/10 p-2 font-mono text-[11px] text-red-400">{extractionError}</p>
                        ) : (
                          <p className="mt-1 text-xs text-amber-400/70">
                            AI extraction may have failed. Check that the Groq API key is valid and reachable from this machine.
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          onClick={handleRetryExtraction}
                          disabled={retrying}
                        >
                          {retrying ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" /> : <Zap className="h-3 w-3" />}
                          {retrying ? "Extracting…" : "Retry AI Extraction"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bullets (Amazon, Shopify, Walmart, Etsy) */}
              {currentChannel.bulletLimit > 0 && getChannelBullets(currentChannel).length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-3 border-b border-border/50 pb-2 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
                    {currentChannel.id === "AMAZON" ? "About This Item" : "Key Features"}
                  </h2>
                  <ul className="space-y-2">
                    {getChannelBullets(currentChannel).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${currentChannel.bgColor.replace("/10", "")}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Item Specifics */}
              <div className="mt-8">
                <h2 className="mb-3 border-b border-border/50 pb-2 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
                  {currentChannel.id === "EBAY" ? "Item Specifics" : currentChannel.id === "AMAZON" ? "Product Information" : "Product Details"}
                </h2>
                {specificsAttrs.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-border/50">
                    <table className="w-full">
                      <tbody>
                        {specificsAttrs.map((attr, i) => (
                          <tr key={attr.id} className={i % 2 === 0 ? "bg-[#1a1c22]" : "bg-[#15171c]"}>
                            <td className="w-[40%] border-r border-border/30 px-4 py-2.5 text-xs font-medium text-foreground-muted">
                              {fieldDisplayName(attr.fieldName)}
                            </td>
                            <td className="px-4 py-2.5 text-sm text-foreground">{attr.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-300">No item specifics extracted</p>
                        {extractionError ? (
                          <p className="mt-1 rounded bg-red-500/10 p-2 font-mono text-[11px] text-red-400">{extractionError}</p>
                        ) : (
                          <p className="mt-1 text-xs text-amber-400/70">
                            AI extraction may not have completed. Verify the Groq API key and network connectivity.
                          </p>
                        )}
                        {!fullDescription && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                            onClick={handleRetryExtraction}
                            disabled={retrying}
                          >
                            {retrying ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" /> : <Zap className="h-3 w-3" />}
                            {retrying ? "Extracting…" : "Retry AI Extraction"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Channel-specific details panel */}
            <div className="p-6">
              <h1 className="text-lg font-semibold leading-tight text-foreground">
                {getChannelTitle(currentChannel)}
              </h1>

              {/* Brand / Rating */}
              <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                {brand && <span className={`font-medium ${currentChannel.color}`}>{brand}</span>}
                {brand && <span>|</span>}
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Condition + Grade */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-green-500/40 bg-green-500/10 text-green-400">{condition}</Badge>
                {grade && <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 font-bold text-amber-400">Grade: {grade}</Badge>}
              </div>

              {/* Cert Banner */}
              {certCompany && (
                <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                  <div className="flex items-start gap-2.5">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                    <div>
                      <p className="text-sm font-semibold text-blue-300">{certCompany} Certified{grade ? ` — ${grade}` : ""}</p>
                      {certNumber && <p className="mt-0.5 font-mono text-xs text-blue-400/80">Cert #{certNumber}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Player info */}
              {playerName && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{playerName}</span>
                  {team && <span className="text-foreground-muted">· {team}</span>}
                  {attrMap["card_year"] && <span className="text-foreground-muted">· {attrMap["card_year"]}</span>}
                </div>
              )}

              {/* Price mock */}
              <div className="mt-5 rounded-lg border border-border/50 bg-[#1a1c22] p-4">
                <div className="text-2xl font-bold text-foreground">Price TBD</div>
                <p className="mt-1 text-xs text-foreground-muted">Set during publishing to {currentChannel.name}</p>
              </div>

              {/* Channel-specific CTA */}
              <div className="mt-4 space-y-2">
                {currentChannel.id === "EBAY" && (
                  <>
                    <button className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white">
                      <ShoppingCart className="h-4 w-4" /> Buy It Now
                    </button>
                    <button className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-600 py-3 text-sm font-semibold text-blue-400">
                      <Heart className="h-4 w-4" /> Add to Watchlist
                    </button>
                  </>
                )}
                {currentChannel.id === "AMAZON" && (
                  <>
                    <button className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 text-sm font-semibold text-black">
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </button>
                    <button className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-semibold text-black">
                      <Zap className="h-4 w-4" /> Buy Now
                    </button>
                  </>
                )}
                {currentChannel.id === "SHOPIFY" && (
                  <button className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3 text-sm font-semibold text-white">
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>
                )}
                {currentChannel.id === "WALMART" && (
                  <button className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-semibold text-white">
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>
                )}
                {currentChannel.id === "ETSY" && (
                  <button className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-600 py-3 text-sm font-semibold text-white">
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>
                )}
              </div>

              {/* Shipping / returns */}
              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 text-xs">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
                  <div>
                    <p className="font-medium text-foreground">Shipping</p>
                    <p className="text-foreground-muted">Configured during {currentChannel.name} publishing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
                  <div>
                    <p className="font-medium text-foreground">Buyer Protection</p>
                    <p className="text-foreground-muted">{currentChannel.name} purchase protection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
                  <div>
                    <p className="font-medium text-foreground">Returns</p>
                    <p className="text-foreground-muted">Return policy set per channel</p>
                  </div>
                </div>
              </div>

              {/* Compliance Checklist */}
              {(() => {
                const comp = allCompliance.find((c) => c.channel.id === currentChannel.id);
                if (!comp) return null;
                return (
                  <div className="mt-6 rounded-lg border border-border/50 bg-[#1a1c22] p-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      {currentChannel.name} Compliance
                    </h3>
                    <div className="space-y-2">
                      {comp.checks.map((check, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {check.status === "pass" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
                          ) : check.status === "warn" ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                          )}
                          <span className="font-medium text-foreground">{check.label}</span>
                          <span className="ml-auto text-foreground-muted">{check.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Product IDs */}
              <div className="mt-4 rounded-lg border border-border/50 bg-[#1a1c22] p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Identifiers</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {brand && <div><span className="text-foreground-muted">Brand</span><p className="font-medium text-foreground">{brand}</p></div>}
                  {product.upc && <div><span className="text-foreground-muted">UPC</span><p className="font-mono font-medium text-foreground">{product.upc}</p></div>}
                  {product.ean && <div><span className="text-foreground-muted">EAN</span><p className="font-mono font-medium text-foreground">{product.ean}</p></div>}
                  {product.asin && <div><span className="text-foreground-muted">ASIN</span><p className="font-mono font-medium text-foreground">{product.asin}</p></div>}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className={`border-t ${currentChannel.borderColor} ${currentChannel.bgColor} px-6 py-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-[11px] text-foreground-muted">
                <span>{images.length} photo{images.length !== 1 ? "s" : ""}</span>
                <span>{specificsAttrs.length} specifics</span>
                <span>{displayAttrs.length} attributes</span>
                {fullDescription && <span>{getChannelDesc(currentChannel)?.length ?? 0} char desc</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="gap-1">
                  <Link href={`/products/${id}/review`}><Pencil className="h-3 w-3" /> Edit</Link>
                </Button>
                <Button size="sm" asChild className="gap-1">
                  <Link href={`/products/${id}/publish`}>Publish to {currentChannel.name}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
