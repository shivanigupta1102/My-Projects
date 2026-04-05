"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const plans = [
  { name: "Growth", price: "$49", desc: "500 SKUs · 3 channel connections · email support" },
  { name: "Pro", price: "$149", desc: "5k SKUs · all channels · SSO · priority queue", current: true },
  { name: "Team", price: "$399", desc: "Unlimited SKUs · audit exports · dedicated CSM" },
];

export default function SettingsBillingPage() {
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h2 className="text-xl font-semibold">Billing</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Usage meters reset on the 1st of each month (UTC).
        </p>
      </div>

      <Card className="border-border bg-surface">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Current plan</CardTitle>
            <Badge>Pro</Badge>
          </div>
          <CardDescription>Renews April 1, 2026 · Visa •••• 4242</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-foreground-muted">SKU catalog</span>
              <span className="font-mono text-foreground">3,240 / 5,000</span>
            </div>
            <Progress value={(3240 / 5000) * 100} className="h-2" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-foreground-muted">Ingestion minutes</span>
              <span className="font-mono text-foreground">842 / 2,000</span>
            </div>
            <Progress value={(842 / 2000) * 100} className="h-2" indicatorClassName="bg-warning" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-foreground-muted">LLM extraction credits</span>
              <span className="font-mono text-foreground">118k / 250k</span>
            </div>
            <Progress value={(118000 / 250000) * 100} className="h-2" indicatorClassName="bg-success" />
          </div>
          <Button variant="outline">Update payment method</Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Compare plans
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={`border-border ${p.current ? "bg-accent/10 ring-1 ring-accent/40" : "bg-surface"}`}
            >
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <p className="text-2xl font-bold text-foreground">{p.price}</p>
                <CardDescription className="text-foreground-muted">{p.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant={p.current ? "secondary" : "default"} disabled={p.current}>
                  {p.current ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Current plan
                    </>
                  ) : (
                    "Switch plan"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
