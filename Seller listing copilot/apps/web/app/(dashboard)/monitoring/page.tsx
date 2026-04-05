"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api";

type Monitor = {
  id: string;
  productId: string;
  channel: string;
  channelListingId: string;
  status: string;
  healthScore: number;
  lastCheckedAt: string;
  createdAt: string;
  product?: { title: string };
};

type Remediation = {
  id: string;
  monitorId: string;
  type: string;
  title: string;
  description: string;
  impactScore: number;
  suggestedFixJson: Record<string, unknown>;
  status: string;
  createdAt: string;
  rankedImpact?: number;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Normalize to 0–1 for averaging when API uses either fraction or 0–100. */
function normalizeHealthFraction(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score >= 0 && score <= 1) return score;
  if (score > 1 && score <= 100) return score / 100;
  return Math.min(1, Math.max(0, score / 100));
}

function formatHealthScore(score: number): string {
  if (Number.isNaN(score)) return "—";
  if (score >= 0 && score <= 1) {
    return `${Math.round(score * 100)}%`;
  }
  return `${Math.round(score)}%`;
}

function severityBadgeVariant(
  severity: string,
): "error" | "warning" | "default" | "outline" {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "high" || s === "error") return "error";
  if (s === "warning" || s === "medium") return "warning";
  if (s === "low" || s === "info") return "default";
  return "outline";
}

function monitorStatusBadgeVariant(
  status: string,
): "success" | "warning" | "error" | "outline" {
  const u = status.toUpperCase();
  if (u.includes("OK") || u === "HEALTHY" || u === "ACTIVE") return "success";
  if (u.includes("WARN") || u === "DEGRADED") return "warning";
  if (u.includes("FAIL") || u.includes("ERROR") || u === "DOWN") return "error";
  return "outline";
}

export default function MonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [remediations, setRemediations] = useState<Remediation[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [monitorsRes, remediationsRes] = await Promise.all([
        apiGet<Monitor[]>("/monitors"),
        apiGet<Remediation[]>("/remediations"),
      ]);
      setMonitors(monitorsRes);
      setRemediations(remediationsRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load monitoring data");
      setMonitors([]);
      setRemediations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const n = monitors.length;
    const avgHealth =
      n > 0
        ? monitors.reduce((acc, m) => acc + normalizeHealthFraction(m.healthScore), 0) / n
        : null;
    const highSeverityRemediations = remediations.filter((r) => r.impactScore >= 80).length;
    return {
      monitorCount: n,
      remediationCount: remediations.length,
      avgHealth,
      highSeverityRemediations,
    };
  }, [monitors, remediations]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-7xl space-y-8"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Monitoring
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Live listing health and remediation recommendations from your monitors.
        </p>
      </div>

      {loading ? (
        <div
          className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface py-16"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
          <p className="text-sm text-foreground-muted">Loading monitoring data…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-surface">
              <CardHeader className="pb-2">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Active monitors
                </span>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold text-accent tabular-nums">
                  {summary.monitorCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-surface">
              <CardHeader className="pb-2">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Remediations
                </span>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold text-accent tabular-nums">
                  {summary.remediationCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-surface">
              <CardHeader className="pb-2">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  High / critical
                </span>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold text-accent tabular-nums">
                  {summary.highSeverityRemediations}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-surface">
              <CardHeader className="pb-2">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Health score avg
                </span>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold text-accent tabular-nums">
                  {summary.avgHealth != null ? formatHealthScore(summary.avgHealth) : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Monitors
            </h2>
            {monitors.length === 0 ? (
              <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-foreground-muted">
                No monitors yet.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {monitors.map((m) => (
                  <Card
                    key={m.id}
                    className="border-border bg-surface transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{m.channel}</Badge>
                        <Badge variant={monitorStatusBadgeVariant(m.status)}>
                          {m.status.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-medium text-foreground">
                        {m.product?.title ?? "Untitled Product"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-foreground-muted">
                      <p>
                        <span className="text-foreground-muted">Health: </span>
                        <span className="font-semibold text-foreground">{formatHealthScore(m.healthScore)}</span>
                      </p>
                      <p>
                        <span className="text-foreground-muted">Last checked: </span>
                        {formatDate(m.lastCheckedAt)}
                      </p>
                      <p className="truncate font-mono text-xs" title={m.channelListingId}>
                        Listing: {m.channelListingId}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Remediation recommendations
            </h2>
            {remediations.length === 0 ? (
              <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-foreground-muted">
                No remediations.
              </p>
            ) : (
              <div className="space-y-3">
                {remediations.map((r) => {
                  const impactSeverity = r.impactScore >= 80 ? "critical" : r.impactScore >= 50 ? "medium" : "low";
                  const suggestedAction = r.suggestedFixJson
                    ? Object.entries(r.suggestedFixJson).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")
                    : "No suggested fix available";
                  return (
                    <Card key={r.id} className="border-border bg-surface">
                      <CardHeader className="space-y-1 pb-2">
                        <div className="flex flex-row flex-wrap items-center gap-2">
                          <Badge variant={severityBadgeVariant(impactSeverity)}>
                            Impact: {r.impactScore}
                          </Badge>
                          <Badge variant="outline">{r.type.replaceAll("_", " ")}</Badge>
                          <Badge variant="outline">{r.status.replaceAll("_", " ")}</Badge>
                        </div>
                        {r.title && (
                          <p className="text-sm font-medium text-foreground">{r.title}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-foreground">{r.description}</p>
                        <div className="rounded-md border border-border bg-background/50 px-3 py-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                            Suggested fix
                          </p>
                          <p className="mt-1 text-sm text-foreground">{suggestedAction}</p>
                        </div>
                        <p className="text-xs text-foreground-muted">
                          Monitor {r.monitorId} · {formatDate(r.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
}
