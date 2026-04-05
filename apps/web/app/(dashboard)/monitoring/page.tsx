"use client";

import { motion } from "framer-motion";
import { HealthScoreCard } from "@/components/monitoring/HealthScoreCard";
import { RemediationCard } from "@/components/monitoring/RemediationCard";
import { SuppressionAlert } from "@/components/monitoring/SuppressionAlert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const suppressions = [
  {
    id: "s1",
    title: "Listing suppressed — policy: restricted claims",
    channelLabel: "Amazon",
    reason:
      "Automated scan flagged 'medical benefit' language in bullet 3. Listing removed from search until resolved.",
    urgency: "high" as const,
  },
  {
    id: "s2",
    title: "Buy box lost — price parity drift",
    channelLabel: "Walmart",
    reason: "MAP enforcement detected 6% under authorized floor vs. last sync.",
    urgency: "medium" as const,
  },
];

const alerts = [
  {
    id: "a1",
    severity: "critical",
    channel: "Amazon",
    title: "Search suppression risk",
    body: "Browse node mismatch vs. competitor set — conversion down 18% WoW.",
  },
  {
    id: "a2",
    severity: "warning",
    channel: "eBay",
    title: "Item specifics incomplete",
    body: "Required field 'Type' missing for category 20696.",
  },
  {
    id: "a3",
    severity: "warning",
    channel: "Shopify",
    title: "Structured data warning",
    body: "Product JSON-LD missing offers.priceValidUntil.",
  },
];

const remediations = [
  {
    id: "r1",
    title: "Replace restricted phrasing in bullets",
    description:
      "Swap wellness claims for functional descriptors. Template LP-BULLET-SAFE-01 matches your category.",
    type: "CONTENT_DRIFT" as const,
    impactScore: 0.92,
  },
  {
    id: "r2",
    title: "Align Walmart short description length",
    description:
      "Expand generated short description to 640 characters with feature-led sentences.",
    type: "MISSING_REQUIRED" as const,
    impactScore: 0.78,
  },
  {
    id: "r3",
    title: "Refresh main image — aspect ratio",
    description:
      "Amazon detail page prefers 1:1 main image min 1000px. Crop packshot to safe frame.",
    type: "DISCOVERABILITY" as const,
    impactScore: 0.65,
  },
];

export default function MonitoringPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-7xl space-y-8"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Monitoring</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Live listing health, suppressions, and ranked remediation paths.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active monitors", value: "23" },
          { label: "Alerts", value: "7" },
          { label: "Suppressed", value: "2" },
          { label: "Health score avg", value: "87%" },
        ].map((s) => (
          <Card key={s.label} className="border-border bg-surface">
            <CardHeader className="pb-2">
              <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {s.label}
              </span>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold text-accent">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {suppressions.map((s) => (
          <SuppressionAlert
            key={s.id}
            title={s.title}
            channelLabel={s.channelLabel}
            reason={s.reason}
            urgency={s.urgency}
            onViewListing={() => undefined}
          />
        ))}
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="bg-surface">
          <TabsTrigger value="alerts">Active alerts</TabsTrigger>
          <TabsTrigger value="remediations">Remediations</TabsTrigger>
          <TabsTrigger value="health">Health overview</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id} className="border-border bg-surface">
              <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0">
                <Badge variant={a.severity === "critical" ? "error" : "warning"}>
                  {a.severity}
                </Badge>
                <Badge variant="outline">{a.channel}</Badge>
                <CardTitle className="text-base">{a.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground-muted">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="remediations" className="space-y-4">
          {remediations.map((r) => (
            <RemediationCard
              key={r.id}
              title={r.title}
              description={r.description}
              type={r.type}
              impactScore={r.impactScore}
              onApply={() => undefined}
              onDismiss={() => undefined}
            />
          ))}
        </TabsContent>

        <TabsContent value="health">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(
              [
                {
                  channel: "AMAZON" as const,
                  score: 0.91,
                  dimensions: [
                    { label: "Visibility", value: 88 },
                    { label: "Content", value: 92 },
                    { label: "Policy", value: 90 },
                    { label: "Conversion", value: 85 },
                    { label: "Ops", value: 94 },
                  ],
                },
                {
                  channel: "EBAY" as const,
                  score: 0.85,
                  dimensions: [
                    { label: "Visibility", value: 82 },
                    { label: "Content", value: 86 },
                    { label: "Policy", value: 88 },
                    { label: "Conversion", value: 80 },
                    { label: "Ops", value: 87 },
                  ],
                },
                {
                  channel: "WALMART" as const,
                  score: 0.72,
                  dimensions: [
                    { label: "Visibility", value: 70 },
                    { label: "Content", value: 74 },
                    { label: "Policy", value: 78 },
                    { label: "Conversion", value: 68 },
                    { label: "Ops", value: 71 },
                  ],
                },
                {
                  channel: "SHOPIFY" as const,
                  score: 0.88,
                  dimensions: [
                    { label: "Visibility", value: 90 },
                    { label: "Content", value: 87 },
                    { label: "Policy", value: 92 },
                    { label: "Conversion", value: 84 },
                    { label: "Ops", value: 89 },
                  ],
                },
                {
                  channel: "ETSY" as const,
                  score: 0.8,
                  dimensions: [
                    { label: "Visibility", value: 78 },
                    { label: "Content", value: 84 },
                    { label: "Policy", value: 86 },
                    { label: "Conversion", value: 79 },
                    { label: "Ops", value: 81 },
                  ],
                },
              ] as const
            ).map((h) => (
              <HealthScoreCard
                key={h.channel}
                channel={h.channel}
                score={h.score}
                dimensions={[...h.dimensions]}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
