"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Eye,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPatch } from "@/lib/api";

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

interface EditState {
  [attrId: string]: string;
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return "text-green-400";
  if (c >= 0.6) return "text-amber-400";
  return "text-red-400";
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

const FIELD_ORDER = [
  "title",
  "brand",
  "manufacturer",
  "category",
  "subcategory",
  "certification_company",
  "certification_number",
  "grade",
  "authentication_details",
  "player_name",
  "team",
  "card_number",
  "card_set",
  "card_year",
  "serial_number",
  "edition",
  "variant",
  "rarity",
  "autograph",
  "memorabilia_type",
  "human_description",
  "description",
  "notable_features",
  "color",
  "material",
  "size",
  "condition",
  "year",
  "country_of_origin",
  "model",
  "model_number",
  "certifications",
  "visible_labels",
  "logos_visible",
  "barcodes_visible",
  "text_on_product",
];

function fieldSortKey(fieldName: string): number {
  const idx = FIELD_ORDER.indexOf(fieldName.toLowerCase());
  return idx >= 0 ? idx : FIELD_ORDER.length;
}

function isLongField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return (
    lower === "description" ||
    lower === "human_description" ||
    lower === "notable_features" ||
    lower === "text_on_product"
  );
}

function fieldDisplayName(fieldName: string): string {
  return fieldName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReviewListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditState>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editTitle, setEditTitle] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [prod, attrs, imgs] = await Promise.all([
        apiGet<Product>(`/products/${id}`),
        apiGet<Attribute[]>(`/products/${id}/attributes`),
        apiGet<ProductImage[]>(`/products/${id}/images`).catch(
          () => [] as ProductImage[],
        ),
      ]);
      setProduct(prod);
      setAttributes(attrs);
      setImages(imgs);
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
  })().sort((a, b) => fieldSortKey(a.fieldName) - fieldSortKey(b.fieldName));

  const startEdit = (attrId: string, currentValue: string) => {
    setEditing((prev) => ({ ...prev, [attrId]: currentValue }));
  };

  const cancelEdit = (attrId: string) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[attrId];
      return next;
    });
  };

  const saveEdit = async (attr: Attribute) => {
    const newValue = editing[attr.id];
    if (newValue === undefined || newValue === attr.value) {
      cancelEdit(attr.id);
      return;
    }
    setSaving(attr.id);
    try {
      await apiPatch(`/products/${id}/attributes/${attr.id}`, {
        value: newValue,
      });
      setAttributes((prev) =>
        prev.map((a) => (a.id === attr.id ? { ...a, value: newValue } : a)),
      );
      cancelEdit(attr.id);
      toast.success(`${fieldDisplayName(attr.fieldName)} updated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const saveTitle = async () => {
    if (!product || editTitle === null || editTitle === product.title) {
      setEditTitle(null);
      return;
    }
    setSavingProduct(true);
    try {
      await apiPatch(`/products/${id}`, { title: editTitle });
      setProduct((prev) => (prev ? { ...prev, title: editTitle } : prev));
      setEditTitle(null);
      toast.success("Title updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save title");
    } finally {
      setSavingProduct(false);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Review Completed Listing
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Review all extracted data, edit if needed, then proceed to channel
            packages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/products/${id}`}>Back to product</Link>
          </Button>
          <Button variant="secondary" asChild className="gap-2">
            <Link href={`/products/${id}/preview`}>
              <Eye className="h-4 w-4" />
              Preview Listing
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href={`/products/${id}/channels`}>
              View Channel Packages
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left: Image */}
        <div className="space-y-4">
          <Card className="border-border bg-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Source Image</CardTitle>
            </CardHeader>
            <CardContent>
              {images.length > 0 ? (
                <div className="space-y-3">
                  {images.map((img) => (
                    <div key={img.id} className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.filename}
                        className="w-full rounded-lg border border-border object-contain"
                        style={{ maxHeight: 400 }}
                      />
                      <p className="truncate text-xs text-foreground-muted">
                        {img.filename}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-background/40">
                  <p className="text-sm text-foreground-muted">
                    No source image available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Product Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">Status</span>
                <Badge
                  variant={
                    product.status === "PUBLISHED" ||
                    product.status === "APPROVED"
                      ? "success"
                      : "warning"
                  }
                >
                  {product.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">Review</span>
                <Badge variant="outline">
                  {product.reviewStatus.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">
                  Attributes
                </span>
                <span className="text-sm font-medium text-foreground">
                  {displayAttrs.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: All extracted data */}
        <div className="space-y-4">
          {/* Product Title */}
          <Card className="border-border bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Product Title</CardTitle>
                {editTitle === null ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => setEditTitle(product.title ?? "")}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={() => void saveTitle()}
                      disabled={savingProduct}
                    >
                      {savingProduct ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={() => setEditTitle(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editTitle !== null ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-background/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveTitle();
                    if (e.key === "Escape") setEditTitle(null);
                  }}
                />
              ) : (
                <p className="text-base font-medium text-foreground">
                  {product.title ?? "Untitled Product"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* All Attributes */}
          {displayAttrs.length === 0 ? (
            <Card className="border-border bg-surface">
              <CardContent className="py-8 text-center text-sm text-foreground-muted">
                No attributes extracted yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayAttrs.map((attr) => {
                const isEditing = attr.id in editing;
                const isSaving = saving === attr.id;
                const longField = isLongField(attr.fieldName);

                return (
                  <Card
                    key={attr.id}
                    className="border-border bg-surface transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                              {fieldDisplayName(attr.fieldName)}
                            </span>
                            <span
                              className={`text-[10px] font-medium ${confidenceColor(attr.confidence)}`}
                            >
                              {(attr.confidence * 100).toFixed(0)}% confidence
                            </span>
                            <span className="text-[10px] text-foreground-muted">
                              via {methodLabel(attr.method)}
                            </span>
                            {attr.requiresReview && (
                              <Badge
                                variant="warning"
                                className="text-[10px]"
                              >
                                Needs Review
                              </Badge>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="mt-2">
                              {longField ? (
                                <Textarea
                                  value={editing[attr.id] ?? ""}
                                  onChange={(e) =>
                                    setEditing((prev) => ({
                                      ...prev,
                                      [attr.id]: e.target.value,
                                    }))
                                  }
                                  className="min-h-[80px] bg-background/60"
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") cancelEdit(attr.id);
                                  }}
                                />
                              ) : (
                                <Input
                                  value={editing[attr.id] ?? ""}
                                  onChange={(e) =>
                                    setEditing((prev) => ({
                                      ...prev,
                                      [attr.id]: e.target.value,
                                    }))
                                  }
                                  className="bg-background/60"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      void saveEdit(attr);
                                    if (e.key === "Escape")
                                      cancelEdit(attr.id);
                                  }}
                                />
                              )}
                            </div>
                          ) : (
                            <p
                              className={`mt-1.5 text-sm text-foreground ${longField ? "whitespace-pre-wrap" : ""}`}
                            >
                              {attr.value || "—"}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => void saveEdit(attr)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3 text-green-400" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => cancelEdit(attr.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => startEdit(attr.id, attr.value)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2"
              onClick={() => router.push(`/products/${id}/preview`)}
            >
              <Eye className="h-4 w-4" />
              Preview Listing
            </Button>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => router.push(`/products/${id}/channels`)}
            >
              Proceed to Channel Packages
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={`/products/${id}`}>Back to product</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
