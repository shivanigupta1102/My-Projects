"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCw,
  Sparkles,
  Store,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost } from "@/lib/api";

const CHANNEL_ORDER = ["AMAZON", "EBAY", "WALMART", "SHOPIFY", "ETSY"] as const;
type Channel = (typeof CHANNEL_ORDER)[number];

interface ChannelMeta {
  id: Channel;
  name: string;
  color: string;
  bg: string;
  border: string;
}

const CHANNEL_META: Record<Channel, ChannelMeta> = {
  AMAZON: { id: "AMAZON", name: "Amazon", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  EBAY: { id: "EBAY", name: "eBay", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  WALMART: { id: "WALMART", name: "Walmart", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30" },
  SHOPIFY: { id: "SHOPIFY", name: "Shopify", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  ETSY: { id: "ETSY", name: "Etsy", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
};

interface ValidationRow {
  id: string;
  field: string;
  rule: string;
  severity: string;
  message: string;
  suggestedFix: string | null;
}

interface ListingPackage {
  id: string;
  productId: string;
  channel: Channel;
  status: string;
  title: string | null;
  bulletsJson: unknown;
  description: string | null;
  attributesJson: unknown;
  keywordsJson: unknown;
  imagesJson: unknown;
  qualityScore: number | null;
  validations: ValidationRow[];
}

function isChannel(value: string): value is Channel {
  return (CHANNEL_ORDER as readonly string[]).includes(value);
}

function parseStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch { return []; }
  }
  return [];
}

function parseAttributes(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch { return {}; }
  }
  return {};
}

function formatQuality(score: number | null): string {
  if (score == null || Number.isNaN(score)) return "—";
  return score <= 1 ? `${Math.round(score * 100)}%` : String(score);
}

function severityBorderClass(severity: string): string {
  switch (severity) {
    case "BLOCKING": return "border-l-red-500";
    case "ERROR": return "border-l-orange-500";
    case "WARNING": return "border-l-amber-500";
    case "INFO": return "border-l-sky-500";
    default: return "border-l-border";
  }
}

export default function ChannelPackagesPage() {
  const params = useParams();
  const productId = typeof params.id === "string" ? params.id : "";

  const [packages, setPackages] = useState<ListingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<"all" | Channel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Channel>("EBAY");
  const [selectedChannels, setSelectedChannels] = useState<Set<Channel>>(new Set(CHANNEL_ORDER));

  const fetchPackages = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const data = await apiGet<ListingPackage[]>(`/listing-packages/product/${productId}`);
      setPackages(
        data.map((p) => ({ ...p, channel: isChannel(p.channel) ? p.channel : ("AMAZON" as Channel) })),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listing packages");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const channelsWithPackages = useMemo(() => {
    const set = new Set<Channel>();
    for (const p of packages) { if (isChannel(p.channel)) set.add(p.channel); }
    return CHANNEL_ORDER.filter((c) => set.has(c));
  }, [packages]);

  const packageByChannel = useMemo(() => {
    const m = new Map<Channel, ListingPackage>();
    for (const p of packages) { if (isChannel(p.channel)) m.set(p.channel, p); }
    return m;
  }, [packages]);

  useEffect(() => {
    if (channelsWithPackages.length > 0 && !channelsWithPackages.includes(tab)) {
      const first = channelsWithPackages[0];
      if (first) setTab(first);
    }
  }, [channelsWithPackages, tab]);

  const toggleChannel = (ch: Channel) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) { next.delete(ch); } else { next.add(ch); }
      return next;
    });
  };

  const selectAll = () => setSelectedChannels(new Set(CHANNEL_ORDER));
  const selectNone = () => setSelectedChannels(new Set());

  const generateForChannels = async (channels: Channel[]) => {
    if (!productId || channels.length === 0) return;
    const genKey: "all" | Channel = channels.length === CHANNEL_ORDER.length ? "all" : (channels[0] ?? "all");
    try {
      setGenerating(genKey);
      await apiPost<unknown, { productId: string; channels: Channel[] }>(
        "/listing-packages/generate",
        { productId, channels },
      );
      const firstName = channels[0] ? CHANNEL_META[channels[0]].name : "";
      toast.success(
        channels.length === 1
          ? `${firstName} listing generated`
          : `${channels.length} channel listings generated`,
      );
      await fetchPackages();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateSelected = () => {
    const channels = Array.from(selectedChannels);
    void generateForChannels(channels);
  };

  const handleGenerateSingle = (ch: Channel) => {
    void generateForChannels([ch]);
  };

  if (!productId) {
    return (
      <div className="mx-auto max-w-2xl pt-16 text-center">
        <p className="text-foreground-muted">Invalid product</p>
        <Button variant="outline" className="mt-4" asChild><Link href="/products">Back to products</Link></Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl pt-16 text-center">
        <p className="text-foreground-muted">{error}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => fetchPackages()}>Retry</Button>
          <Button variant="outline" asChild><Link href={`/products/${productId}`}>Back</Link></Button>
        </div>
      </div>
    );
  }

  const hasPackages = channelsWithPackages.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Channel Listings</h1>
          <p className="text-sm text-foreground-muted">
            Generate and manage marketplace-specific listings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href={`/products/${productId}/preview`}>
              <Eye className="h-3 w-3" /> Preview
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/products/${productId}`}>Back to Product</Link>
          </Button>
        </div>
      </div>

      {/* Channel Selector */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Select Channels to Generate</h2>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-accent hover:underline"
            >
              Select All
            </button>
            <span className="text-xs text-foreground-muted">|</span>
            <button
              onClick={selectNone}
              className="text-xs text-foreground-muted hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {CHANNEL_ORDER.map((ch) => {
            const meta = CHANNEL_META[ch];
            const isSelected = selectedChannels.has(ch);
            const pkg = packageByChannel.get(ch);
            const hasExisting = !!pkg;

            return (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className={`relative rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? `${meta.border} ${meta.bg} ring-1 ring-accent/30`
                    : "border-border bg-background/40 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                      isSelected
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-background"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <Store className={`h-4 w-4 ${isSelected ? meta.color : "text-foreground-muted"}`} />
                  <span className={`text-sm font-medium ${isSelected ? meta.color : "text-foreground-muted"}`}>
                    {meta.name}
                  </span>
                </div>
                {hasExisting && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{pkg.status}</Badge>
                    <span className="text-[10px] text-foreground-muted">
                      {formatQuality(pkg.qualityScore)}
                    </span>
                  </div>
                )}
                {!hasExisting && (
                  <p className="mt-2 text-[10px] text-foreground-muted">Not generated</p>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            disabled={generating !== null || selectedChannels.size === 0}
            onClick={handleGenerateSelected}
            className="gap-2"
          >
            {generating === "all" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {selectedChannels.size === CHANNEL_ORDER.length
                  ? "Generate All Channels"
                  : selectedChannels.size === 1
                    ? `Generate ${CHANNEL_META[Array.from(selectedChannels)[0] as Channel].name}`
                    : `Generate ${selectedChannels.size} Channels`}
              </>
            )}
          </Button>
          <span className="text-xs text-foreground-muted">
            {selectedChannels.size} of {CHANNEL_ORDER.length} selected
            {hasPackages && " · Existing listings will be regenerated"}
          </span>
        </div>
      </div>

      {/* Generated Listings */}
      {hasPackages && (
        <Tabs
          value={tab}
          onValueChange={(v) => { if (isChannel(v)) setTab(v); }}
          className="space-y-4"
        >
          <TabsList className="flex h-auto flex-wrap gap-1 bg-surface">
            {channelsWithPackages.map((c) => {
              const meta = CHANNEL_META[c];
              const pkg = packageByChannel.get(c);
              return (
                <TabsTrigger key={c} value={c} className="gap-2 text-xs">
                  <Store className={`h-3 w-3 ${tab === c ? meta.color : ""}`} />
                  {meta.name}
                  {pkg?.qualityScore != null && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      (pkg.qualityScore <= 1 ? pkg.qualityScore : pkg.qualityScore / 100) >= 0.7
                        ? "bg-green-500/20 text-green-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {formatQuality(pkg.qualityScore)}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {channelsWithPackages.map((c) => {
            const pkg = packageByChannel.get(c);
            if (!pkg) return null;
            const meta = CHANNEL_META[c];
            const bullets = parseStringArray(pkg.bulletsJson);
            const keywords = parseStringArray(pkg.keywordsJson);
            const attributes = parseAttributes(pkg.attributesJson);

            return (
              <TabsContent key={c} value={c} className="space-y-4">
                {/* Status bar */}
                <div className={`flex items-center justify-between rounded-lg border ${meta.border} ${meta.bg} p-3`}>
                  <div className="flex items-center gap-3">
                    <Store className={`h-5 w-5 ${meta.color}`} />
                    <span className={`text-sm font-bold ${meta.color}`}>{meta.name}</span>
                    <Badge variant="outline" className="text-xs">{pkg.status}</Badge>
                    <span className="text-sm text-foreground-muted">
                      Quality: <span className="font-medium text-foreground">{formatQuality(pkg.qualityScore)}</span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={generating === c}
                    onClick={() => handleGenerateSingle(c)}
                  >
                    {generating === c ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Regenerate
                  </Button>
                </div>

                {/* Title */}
                <Card className="border-border bg-surface">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Title</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-foreground">
                      {pkg.title?.trim() || <span className="text-foreground-muted">—</span>}
                    </p>
                    {pkg.title && (
                      <p className="mt-1 text-[10px] text-foreground-muted">{pkg.title.length} chars</p>
                    )}
                  </CardContent>
                </Card>

                {/* Bullets */}
                <Card className="border-border bg-surface">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Bullet Points</CardTitle></CardHeader>
                  <CardContent>
                    {bullets.length === 0 ? (
                      <p className="text-sm text-foreground-muted">No bullets</p>
                    ) : (
                      <ul className="list-inside list-disc space-y-1.5 text-sm text-foreground">
                        {bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="border-border bg-surface">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Description</CardTitle></CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {pkg.description?.trim() || <span className="text-foreground-muted">No description</span>}
                    </p>
                  </CardContent>
                </Card>

                {/* Attributes */}
                <Card className="border-border bg-surface">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Attributes</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(attributes).length === 0 ? (
                      <p className="text-sm text-foreground-muted">No attributes</p>
                    ) : (
                      <dl className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(attributes).map(([key, val]) => (
                          <div key={key} className="rounded-md border border-border bg-background/40 px-3 py-2">
                            <dt className="text-xs font-medium text-foreground-muted">{key.replace(/_/g, " ")}</dt>
                            <dd className="mt-0.5 text-sm text-foreground">
                              {val == null ? "—" : typeof val === "object" ? JSON.stringify(val) : String(val)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </CardContent>
                </Card>

                {/* Keywords */}
                <Card className="border-border bg-surface">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Keywords</CardTitle></CardHeader>
                  <CardContent>
                    {keywords.length === 0 ? (
                      <p className="text-sm text-foreground-muted">No keywords</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((k, i) => (
                          <span key={`${k}-${i}`} className="rounded-full border border-border bg-background/50 px-2.5 py-0.5 text-xs text-foreground">{k}</span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Validation */}
                <Card className="border-border bg-surface">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Validation</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {pkg.validations.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle2 className="h-4 w-4" /> No issues — ready to publish
                      </div>
                    ) : (
                      pkg.validations.map((v) => (
                        <div
                          key={v.id}
                          className={`rounded-md border border-border border-l-4 bg-background/40 p-3 ${severityBorderClass(v.severity)}`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px] uppercase">{v.severity}</Badge>
                            <span className="font-mono text-xs text-foreground-muted">{v.field} · {v.rule}</span>
                          </div>
                          <p className="mt-2 text-sm text-foreground">{v.message}</p>
                          {v.suggestedFix && (
                            <p className="mt-2 text-sm text-foreground-muted">
                              <span className="font-medium text-foreground">Fix: </span>{v.suggestedFix}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {!hasPackages && (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-accent/60" />
          <h2 className="text-lg font-semibold text-foreground">No listings generated yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground-muted">
            Select the channels above and click generate to create optimized listings for each marketplace.
          </p>
        </div>
      )}
    </motion.div>
  );
}
