"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Barcode,
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  Package,
  Pencil,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost } from "@/lib/api";
import { toast } from "sonner";

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
  createdAt: string;
}

interface Attribute {
  id: string;
  fieldName: string;
  value: string;
  normalizedValue: string | null;
  confidence: number;
  method: string;
  requiresReview: boolean;
  conflicted: boolean;
}

interface Evidence {
  id: string;
  snippet: string | null;
  explanation: string;
  confidence: number;
  sourceAssetId: string | null;
  attributeId: string | null;
}

interface ListingPackage {
  id: string;
  channel: string;
  status: string;
  title: string | null;
  qualityScore: number | null;
}

const ATTR_GROUPS: { label: string; icon: React.ReactNode; keys: string[] }[] = [
  {
    label: "Product Identity",
    icon: <Tag className="h-4 w-4" />,
    keys: ["title", "brand", "manufacturer", "category", "subcategory", "model", "model_number", "year", "country_of_origin"],
  },
  {
    label: "Grading & Authentication",
    icon: <ShieldCheck className="h-4 w-4" />,
    keys: ["certification_company", "certification_number", "grade", "authentication_details", "serial_number"],
  },
  {
    label: "Card / Collectible Details",
    icon: <Sparkles className="h-4 w-4" />,
    keys: ["player_name", "team", "card_number", "card_set", "card_year", "edition", "variant", "rarity", "autograph", "memorabilia_type"],
  },
  {
    label: "Physical Attributes",
    icon: <Package className="h-4 w-4" />,
    keys: ["color", "material", "size", "condition", "weight", "dimensions"],
  },
  {
    label: "Description & Features",
    icon: <Sparkles className="h-4 w-4" />,
    keys: ["description", "human_description", "notable_features", "text_on_product", "visible_labels", "logos_visible"],
  },
  {
    label: "Certifications & Compliance",
    icon: <ShieldCheck className="h-4 w-4" />,
    keys: ["certifications", "safety", "compliance", "voltage", "wattage", "barcodes_visible"],
  },
];

function confidenceColor(c: number): string {
  if (c >= 0.8) return "text-green-400";
  if (c >= 0.6) return "text-amber-400";
  return "text-red-400";
}

function confidenceLabel(c: number): string {
  if (c >= 0.8) return "High";
  if (c >= 0.6) return "Medium";
  return "Low";
}

function methodLabel(m: string): string {
  switch (m) {
    case "IMAGE_VISION":
      return "AI Vision";
    case "STRUCTURED_PARSE":
      return "Structured Parse";
    case "OCR":
      return "OCR";
    case "LLM_TEXT":
      return "LLM Text";
    default:
      return m.replace(/_/g, " ");
  }
}

const CHANNEL_LABEL: Record<string, string> = {
  AMAZON: "Amazon",
  EBAY: "eBay",
  WALMART: "Walmart",
  SHOPIFY: "Shopify",
  ETSY: "Etsy",
};

export default function ProductTruthPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [packages, setPackages] = useState<ListingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [upcInput, setUpcInput] = useState("");
  const [upcLooking, setUpcLooking] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [prod, attrs, evs, pkgs] = await Promise.all([
        apiGet<Product>(`/products/${id}`),
        apiGet<Attribute[]>(`/products/${id}/attributes`).catch(() => [] as Attribute[]),
        apiGet<Evidence[]>(`/products/${id}/evidence`).catch(() => [] as Evidence[]),
        apiGet<ListingPackage[]>(`/listing-packages/product/${id}`).catch(
          () => [] as ListingPackage[],
        ),
      ]);
      setProduct(prod);
      setAttributes(attrs);
      setEvidences(evs);
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

  const handleGenerateListings = async () => {
    setGenerating(true);
    try {
      await apiPost("/listing-packages/generate", {
        productId: id,
        channels: ["AMAZON", "EBAY", "WALMART", "SHOPIFY", "ETSY"],
      });
      toast.success("Channel listings generated");
      await fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpcLookup = async () => {
    if (!upcInput.trim() || !id) return;
    setUpcLooking(true);
    try {
      const result = await apiPost<{ upc: string; title: string | null; brand: string | null }>(
        `/products/${id}/upc-lookup`,
        { upc: upcInput.trim() },
      );
      if (result) {
        toast.success(
          `UPC found: ${result.title || result.brand || upcInput}`,
        );
        setUpcInput("");
        await fetchData();
      } else {
        toast.error("No product data found for this UPC");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "UPC lookup failed");
    } finally {
      setUpcLooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
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

  const displayAttrs = (() => {
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

  const groupedAttrs = ATTR_GROUPS.map((g) => ({
    ...g,
    attrs: displayAttrs.filter((a) =>
      g.keys.some((k) => a.fieldName.toLowerCase() === k),
    ),
  }));

  const ungrouped = displayAttrs.filter(
    (a) =>
      !ATTR_GROUPS.some((g) =>
        g.keys.some((k) => a.fieldName.toLowerCase() === k),
      ),
  );

  const completenessPercent =
    product.completeness <= 1
      ? Math.round(product.completeness * 100)
      : Math.round(product.completeness);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {product.title ?? "Untitled Product"}
            </h1>
            <Badge
              variant={
                product.status === "PUBLISHED" || product.status === "APPROVED"
                  ? "success"
                  : product.status === "REVIEW_READY"
                    ? "warning"
                    : "outline"
              }
            >
              {product.status.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {product.reviewStatus.replace(/_/g, " ")}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-muted">
            {product.brand && <span>Brand: {product.brand}</span>}
            {product.upc && (
              <span className="font-mono text-xs">UPC: {product.upc}</span>
            )}
            {product.ean && (
              <span className="font-mono text-xs">EAN: {product.ean}</span>
            )}
            {product.asin && (
              <span className="font-mono text-xs">ASIN: {product.asin}</span>
            )}
            {product.modelNumber && (
              <span className="font-mono text-xs">
                Model: {product.modelNumber}
              </span>
            )}
          </div>

          <div className="mt-3 max-w-sm">
            <div className="mb-1 flex justify-between text-xs text-foreground-muted">
              <span>Completeness</span>
              <span>{completenessPercent}%</span>
            </div>
            <Progress value={completenessPercent} className="h-2" />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
            <span>{displayAttrs.length} attributes extracted</span>
            <span>{evidences.length} evidence records</span>
            <span>{packages.length} channel listings</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
          <Button asChild className="gap-2">
            <Link href={`/products/${id}/preview`}>
              <Eye className="h-4 w-4" />
              Preview Listing
            </Link>
          </Button>
          <Button variant="secondary" asChild className="gap-2">
            <Link href={`/products/${id}/review`}>
              <Pencil className="h-4 w-4" />
              Review & Edit
            </Link>
          </Button>
          {packages.length === 0 ? (
            <Button
              variant="secondary"
              onClick={() => void handleGenerateListings()}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate Channel Listings"}
            </Button>
          ) : (
            <Button variant="secondary" asChild>
              <Link href={`/products/${id}/channels`} className="gap-2">
                View Channel Packages
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/products/${id}/publish`} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Publish Center
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Barcode className="h-4 w-4" />
            UPC / Barcode Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-foreground-muted">
            Enter a UPC, EAN, or barcode number to auto-populate product details from the database.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. 829576019311"
              value={upcInput}
              onChange={(e) => setUpcInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleUpcLookup();
              }}
              className="font-mono"
              disabled={upcLooking}
            />
            <Button
              onClick={() => void handleUpcLookup()}
              disabled={upcLooking || !upcInput.trim()}
              className="gap-2 shrink-0"
            >
              {upcLooking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {upcLooking ? "Looking up..." : "Lookup UPC"}
            </Button>
          </div>
          {product.upc && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 p-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              UPC: <span className="font-mono font-medium">{product.upc}</span>
              {product.ean && (
                <span className="text-foreground-muted">
                  | EAN: <span className="font-mono">{product.ean}</span>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {packages.length > 0 && (
        <Card className="border-border bg-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Channel Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/products/${id}/channels`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 transition-colors hover:bg-background/80"
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      pkg.status === "VALIDATED"
                        ? "text-green-400"
                        : pkg.status === "FAILED"
                          ? "text-red-400"
                          : "text-amber-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {CHANNEL_LABEL[pkg.channel] ?? pkg.channel}
                    </p>
                    <p className="truncate text-xs text-foreground-muted">
                      {pkg.title ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-foreground-muted">
                    {pkg.qualityScore != null
                      ? `${Math.round((pkg.qualityScore <= 1 ? pkg.qualityScore * 100 : pkg.qualityScore))}%`
                      : "—"}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="attributes" className="space-y-4">
        <TabsList className="bg-surface">
          <TabsTrigger value="attributes">
            Attributes ({displayAttrs.length})
          </TabsTrigger>
          <TabsTrigger value="evidence">
            Evidence ({evidences.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attributes" className="space-y-6">
          {displayAttrs.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              No attributes extracted yet.
            </p>
          ) : (
            <>
              {groupedAttrs
                .filter((g) => g.attrs.length > 0)
                .map((group) => (
                  <Card key={group.label} className="border-border bg-surface">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {group.icon}
                        {group.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {group.attrs.map((attr) => (
                          <AttrCard key={attr.id} attr={attr} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {ungrouped.length > 0 && (
                <Card className="border-border bg-surface">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Other Attributes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ungrouped.map((attr) => (
                        <AttrCard key={attr.id} attr={attr} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          {evidences.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              No evidence records yet.
            </p>
          ) : (
            evidences.map((ev) => (
              <Card key={ev.id} className="border-border bg-surface">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm leading-snug">
                    {ev.explanation}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ev.snippet && (
                    <pre className="max-h-40 overflow-auto rounded bg-background/60 p-2 font-mono text-xs text-foreground-muted">
                      {ev.snippet.length > 500
                        ? `${ev.snippet.slice(0, 500)}…`
                        : ev.snippet}
                    </pre>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">
                      Confidence: {(ev.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function AttrCard({ attr }: { attr: Attribute }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {attr.fieldName.replace(/_/g, " ")}
        </span>
        <div className="flex items-center gap-1.5">
          {attr.requiresReview && (
            <Badge variant="warning" className="text-[10px]">
              Review
            </Badge>
          )}
          <span
            className={`text-[10px] font-medium ${confidenceColor(attr.confidence)}`}
          >
            {confidenceLabel(attr.confidence)} (
            {(attr.confidence * 100).toFixed(0)}%)
          </span>
        </div>
      </div>
      <p className="mt-1.5 text-sm text-foreground">
        {attr.value || "—"}
      </p>
      <p className="mt-1 text-[10px] text-foreground-muted">
        via {methodLabel(attr.method)}
      </p>
    </div>
  );
}
