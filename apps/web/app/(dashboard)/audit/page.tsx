"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface AuditRow {
  id: string;
  at: string;
  user: string;
  action: string;
  entity: string;
  details: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
}

const ENTRIES: AuditRow[] = [
  {
    id: "1",
    at: "2026-03-31T15:22:11Z",
    user: "alex@northwind.shop",
    action: "ATTRIBUTE_OVERRIDE",
    entity: "Product prod-8842 / Color",
    details: "Operator override from review queue",
    before: { value: "Clear / Smoke Gray", confidence: 0.78 },
    after: { value: "Clear", confidence: 0.95 },
  },
  {
    id: "2",
    at: "2026-03-31T14:58:02Z",
    user: "jamie@northwind.shop",
    action: "PACKAGE_APPROVE",
    entity: "ListingPackage pkg-AMAZON-1",
    details: "Approved Amazon payload for publish",
    before: { status: "DRAFT" },
    after: { status: "APPROVED" },
  },
  {
    id: "3",
    at: "2026-03-31T14:12:44Z",
    user: "system",
    action: "INGEST_COMPLETE",
    entity: "IngestionJob job-901",
    details: "CSV + images normalized",
    before: { stage: "EXTRACTING" },
    after: { stage: "COMPLETE", rows: 240 },
  },
  {
    id: "4",
    at: "2026-03-31T13:40:19Z",
    user: "alex@northwind.shop",
    action: "PUBLISH",
    entity: "Channel AMAZON / prod-4408",
    details: "Live publish",
    before: { listingId: null },
    after: { listingId: "B0XXXXXXX", status: "SUCCESS" },
  },
  {
    id: "5",
    at: "2026-03-31T11:05:00Z",
    user: "jamie@northwind.shop",
    action: "ROLE_CHANGE",
    entity: "User morgan@northwind.shop",
    details: "Editor → Admin",
    before: { role: "EDITOR" },
    after: { role: "ADMIN" },
  },
  {
    id: "6",
    at: "2026-03-30T22:18:33Z",
    user: "alex@northwind.shop",
    action: "CHANNEL_CONNECT",
    entity: "Integration ebay",
    details: "OAuth refresh token stored",
    before: { connected: false },
    after: { connected: true, sellerId: "EB-88421" },
  },
  {
    id: "7",
    at: "2026-03-30T19:44:12Z",
    user: "system",
    action: "MONITOR_ALERT",
    entity: "Monitor mon-332",
    details: "Suppression detected",
    before: { alertCount: 4 },
    after: { alertCount: 5, severity: "HIGH" },
  },
  {
    id: "8",
    at: "2026-03-30T16:01:55Z",
    user: "jamie@northwind.shop",
    action: "BULK_APPROVE",
    entity: "Review queue",
    details: "12 attributes approved",
    before: { pending: 35 },
    after: { pending: 23 },
  },
  {
    id: "9",
    at: "2026-03-30T12:30:00Z",
    user: "alex@northwind.shop",
    action: "PRODUCT_ARCHIVE",
    entity: "Product prod-legacy-01",
    details: "End of life SKU",
    before: { status: "PUBLISHED" },
    after: { status: "ARCHIVED" },
  },
  {
    id: "10",
    at: "2026-03-29T18:22:41Z",
    user: "morgan@northwind.shop",
    action: "ATTRIBUTE_OVERRIDE",
    entity: "Product prod-7721 / Title",
    details: "Title suffix for SEO",
    before: { title: "Ceramic Pour-Over Set (Matte Black)" },
    after: { title: "Ceramic Pour-Over Set — Matte Black, 24oz" },
  },
  {
    id: "11",
    at: "2026-03-29T15:11:08Z",
    user: "system",
    action: "VALIDATION_FAIL",
    entity: "Package pkg-WALMART-1",
    details: "Blocking: short description",
    before: { blockingIssues: 0 },
    after: { blockingIssues: 1 },
  },
  {
    id: "12",
    at: "2026-03-29T10:00:00Z",
    user: "alex@northwind.shop",
    action: "INVITE_SENT",
    entity: "Org Northwind Trading",
    details: "Invite editor",
    before: { members: 4 },
    after: { members: 4, pendingInvites: 1 },
  },
  {
    id: "13",
    at: "2026-03-28T21:45:22Z",
    user: "jamie@northwind.shop",
    action: "BILLING_PLAN",
    entity: "Subscription",
    details: "Upgrade Growth → Pro",
    before: { plan: "GROWTH" },
    after: { plan: "PRO" },
  },
  {
    id: "14",
    at: "2026-03-28T14:30:00Z",
    user: "system",
    action: "SYNC_LISTING",
    entity: "Amazon / ASIN B0XXXXXXX",
    details: "Hourly crawl",
    before: { buyBox: true },
    after: { buyBox: false },
  },
  {
    id: "15",
    at: "2026-03-28T09:15:00Z",
    user: "alex@northwind.shop",
    action: "API_KEY_ROTATE",
    entity: "Integration shopify",
    details: "Rotated admin API token",
    before: { keyVersion: 1 },
    after: { keyVersion: 2 },
  },
  {
    id: "16",
    at: "2026-03-27T17:00:00Z",
    user: "morgan@northwind.shop",
    action: "COMMENT",
    entity: "Product prod-8842",
    details: "Internal note",
    before: { notes: [] },
    after: { notes: ["Check filter count before publish"] },
  },
  {
    id: "17",
    at: "2026-03-27T11:22:00Z",
    user: "system",
    action: "EXTRACTION_RETRY",
    entity: "Asset asset-992",
    details: "OCR low confidence",
    before: { attempts: 1 },
    after: { attempts: 2, engine: "tesseract+vision" },
  },
  {
    id: "18",
    at: "2026-03-26T20:01:00Z",
    user: "jamie@northwind.shop",
    action: "EXPORT",
    entity: "Audit CSV",
    details: "Filtered by ATTRIBUTE_OVERRIDE",
    before: null,
    after: { rows: 120 },
  },
  {
    id: "19",
    at: "2026-03-26T14:44:00Z",
    user: "alex@northwind.shop",
    action: "DELETE_DRAFT",
    entity: "Product prod-temp-22",
    details: "Accidental duplicate",
    before: { exists: true },
    after: { exists: false },
  },
  {
    id: "20",
    at: "2026-03-26T08:30:00Z",
    user: "system",
    action: "WEBHOOK_DELIVER",
    entity: "Endpoint ingest-complete",
    details: "200 OK",
    before: { deliveries: 1402 },
    after: { deliveries: 1403 },
  },
];

export default function AuditPage() {
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const actionTypes = useMemo(() => {
    const s = new Set(ENTRIES.map((e) => e.action));
    return [...s].sort();
  }, []);

  const users = useMemo(() => {
    const s = new Set(ENTRIES.map((e) => e.user));
    return [...s].sort();
  }, []);

  const rows = useMemo(() => {
    return ENTRIES.filter((e) => {
      const matchQ =
        !q.trim() ||
        [e.action, e.entity, e.details, e.user].some((x) =>
          x.toLowerCase().includes(q.toLowerCase()),
        );
      const matchA = actionFilter === "all" || e.action === actionFilter;
      const matchU = userFilter === "all" || e.user === userFilter;
      return matchQ && matchA && matchU;
    });
  }, [q, actionFilter, userFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-7xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Immutable trail of operator and system actions.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative max-w-md flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search action, entity, user…"
            className="bg-surface"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full lg:w-[200px] bg-surface">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actionTypes.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-full lg:w-[220px] bg-surface">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const open = expanded[row.id];
              return (
                <Fragment key={row.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setExpanded((s) => ({ ...s, [row.id]: !s[row.id] }))
                        }
                        aria-expanded={open}
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground-muted">
                      {row.at.replace("T", " ").replace("Z", " UTC")}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate text-sm">{row.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {row.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{row.entity}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-sm text-foreground-muted">
                      {row.details}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="bg-background/40 hover:bg-background/40">
                      <TableCell colSpan={6} className="p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="mb-1 text-[10px] font-semibold uppercase text-foreground-muted">
                              Before
                            </p>
                            <pre className="max-h-48 overflow-auto rounded border border-border bg-background p-3 font-mono text-[11px] text-foreground">
                              {JSON.stringify(row.before, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] font-semibold uppercase text-foreground-muted">
                              After
                            </p>
                            <pre className="max-h-48 overflow-auto rounded border border-border bg-background p-3 font-mono text-[11px] text-foreground">
                              {JSON.stringify(row.after, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
