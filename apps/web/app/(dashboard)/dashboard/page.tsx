"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/auth";

const completenessData = [
  { name: "Amazon", value: 92 },
  { name: "eBay", value: 85 },
  { name: "Shopify", value: 78 },
  { name: "Walmart", value: 65 },
  { name: "Etsy", value: 70 },
];

const publishEvents = [
  {
    id: "pe1",
    product: "AeroPress Clear Brewer",
    channel: "Amazon",
    status: "Live",
    at: "2026-03-31T14:22:00Z",
  },
  {
    id: "pe2",
    product: "Ceramic Pour-Over Set",
    channel: "Shopify",
    status: "Live",
    at: "2026-03-31T11:05:00Z",
  },
  {
    id: "pe3",
    product: "Stainless Milk Frother",
    channel: "eBay",
    status: "Pending",
    at: "2026-03-30T18:40:00Z",
  },
  {
    id: "pe4",
    product: "Glass Storage Canisters (3pk)",
    channel: "Walmart",
    status: "Failed",
    at: "2026-03-30T09:12:00Z",
  },
  {
    id: "pe5",
    product: "Bamboo Cutting Board",
    channel: "Etsy",
    status: "Live",
    at: "2026-03-29T16:55:00Z",
  },
];

function greetingHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHomePage() {
  const name = useAuthStore((s) => s.user?.name ?? "Operator");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-7xl space-y-8"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greetingHour()}, {name.split(" ")[0] ?? name}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Workspace overview — ingestion, review depth, and publish readiness at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total products" value={47} trend="up" trendLabel="+6 this week" />
        <StatCard label="Needing review" value={12} trend="flat" trendLabel="Queue depth" />
        <StatCard label="Ready to publish" value={8} trend="up" trendLabel="Packages validated" />
        <StatCard label="Active alerts" value={3} trend="down" trendLabel="vs last week" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActionQueue
          items={[
            {
              id: "a1",
              kind: "review",
              title: "12 attributes need review",
              subtitle: "Open Review Queue",
              href: "/review",
            },
            {
              id: "a2",
              kind: "publish",
              title: "8 packages ready to publish",
              subtitle: "Products → Publish center",
              href: "/products",
            },
            {
              id: "a3",
              kind: "remediate",
              title: "3 suppression alerts",
              subtitle: "Monitoring → Remediations",
              href: "/monitoring",
            },
          ]}
        />
        <RecentActivity
          events={[
            {
              id: "e1",
              title: "Ingestion completed — SKU NW-2044",
              detail: "CSV + 6 images · 94% median confidence",
              at: "2026-03-31T15:01:00Z",
              tone: "success",
            },
            {
              id: "e2",
              title: "Amazon package validated",
              detail: "AeroPress Clear Brewer · 0 blocking issues",
              at: "2026-03-31T14:58:00Z",
            },
            {
              id: "e3",
              title: "Review suggested: Color",
              detail: "Ceramic Pour-Over Set · vision vs supplier sheet",
              at: "2026-03-31T13:20:00Z",
              tone: "warning",
            },
            {
              id: "e4",
              title: "Publish dry run — Walmart",
              detail: "Glass Storage Canisters — 2 warnings",
              at: "2026-03-31T11:44:00Z",
            },
            {
              id: "e5",
              title: "Team invite accepted",
              detail: "jamie@northwind.shop joined as Editor",
              at: "2026-03-30T22:10:00Z",
            },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Channel completeness</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={completenessData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#71717A", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={72}
                  tick={{ fill: "#A1A1AA", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#12121A",
                    border: "1px solid #1E1E2E",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#E4E4E7" }}
                />
                <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} name="Completeness %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Recent publish events</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishEvents.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[180px] truncate font-medium">{row.product}</TableCell>
                    <TableCell className="text-foreground-muted">{row.channel}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "Live"
                            ? "success"
                            : row.status === "Failed"
                              ? "error"
                              : "warning"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
