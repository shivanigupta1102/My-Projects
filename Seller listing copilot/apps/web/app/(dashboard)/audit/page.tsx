"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
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
import { apiGet } from "@/lib/api";

const PAGE_SIZE = 20;
const FETCH_PAGE_SIZE = 100;

/** Matches API / Prisma; `details` is an alternate key some gateways may use. */
interface AuditLogDto {
  id: string;
  organizationId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  detailsJson?: unknown;
  details?: unknown;
  createdAt: string;
}

function getDetailsPayload(log: AuditLogDto): unknown {
  return log.detailsJson ?? log.details ?? null;
}

function detailsSummary(details: unknown): string {
  if (details == null) return "—";
  if (typeof details === "string") return details;
  try {
    const s = JSON.stringify(details);
    return s.length > 120 ? `${s.slice(0, 117)}…` : s;
  } catch {
    return "—";
  }
}

function isBeforeAfterDetails(
  d: unknown,
): d is { before?: unknown; after?: unknown } {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  return "before" in d || "after" in d;
}

/** After apiGet unwraps `{ success, data }`, body may be paginated object or a bare array. */
function appendPageFromPayload(
  merged: AuditLogDto[],
  payload: unknown,
): { totalPages: number; stop: boolean } {
  if (Array.isArray(payload)) {
    merged.push(...payload);
    return { totalPages: 1, stop: true };
  }
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    const list = p.entries ?? p.data;
    if (Array.isArray(list)) {
      merged.push(...(list as AuditLogDto[]));
      const totalPages = Math.max(1, Number(p.totalPages ?? 1));
      return { totalPages, stop: false };
    }
  }
  return { totalPages: 1, stop: true };
}

export default function AuditPage() {
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        let apiPage = 1;
        const merged: AuditLogDto[] = [];
        let totalPages = 1;

        do {
          const raw = await apiGet<unknown>(
            `/audit-logs?page=${apiPage}&limit=${FETCH_PAGE_SIZE}`,
          );
          if (cancelled) return;

          const { totalPages: tp, stop } = appendPageFromPayload(merged, raw);
          totalPages = tp;
          if (stop) break;
          apiPage += 1;
        } while (apiPage <= totalPages);

        if (!cancelled) setEntries(merged);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load audit log");
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const actionTypes = useMemo(() => {
    const s = new Set(entries.map((e) => e.action));
    return [...s].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return entries.filter((e) => {
      const details = getDetailsPayload(e);
      const detailsStr =
        details == null
          ? ""
          : typeof details === "string"
            ? details
            : JSON.stringify(details);
      const matchQ =
        !query ||
        [
          e.action,
          e.entityType,
          e.entityId ?? "",
          e.userId ?? "",
          e.organizationId,
          detailsStr,
        ].some((x) => x.toLowerCase().includes(query));
      const matchA = actionFilter === "all" || e.action === actionFilter;
      return matchQ && matchA;
    });
  }, [q, actionFilter, entries]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search action, entity type, entity ID, user…"
            className="bg-surface"
            disabled={loading}
          />
        </div>
        <Select
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v);
            setPage(1);
          }}
          disabled={loading}
        >
          <SelectTrigger className="w-full lg:w-[220px] bg-surface">
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
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-border bg-surface">
        {loading ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
            <span className="text-sm text-foreground-muted">Loading audit log…</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-foreground-muted"
                  >
                    No audit entries match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((row) => {
                  const open = expanded[row.id];
                  const details = getDetailsPayload(row);
                  const beforeAfter = isBeforeAfterDetails(details)
                    ? details
                    : null;

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
                          {row.createdAt.replace("T", " ").replace("Z", " UTC")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {row.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">
                          {row.entityType}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate font-mono text-xs text-foreground-muted">
                          {row.entityId ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate text-sm text-foreground-muted">
                          {detailsSummary(details)}
                        </TableCell>
                      </TableRow>
                      {open && (
                        <TableRow className="bg-background/40 hover:bg-background/40">
                          <TableCell colSpan={6} className="p-4">
                            {beforeAfter ? (
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className="mb-1 text-[10px] font-semibold uppercase text-foreground-muted">
                                    Before
                                  </p>
                                  <pre className="max-h-48 overflow-auto rounded border border-border bg-background p-3 font-mono text-[11px] text-foreground">
                                    {JSON.stringify(beforeAfter.before ?? null, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="mb-1 text-[10px] font-semibold uppercase text-foreground-muted">
                                    After
                                  </p>
                                  <pre className="max-h-48 overflow-auto rounded border border-border bg-background p-3 font-mono text-[11px] text-foreground">
                                    {JSON.stringify(beforeAfter.after ?? null, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="mb-1 text-[10px] font-semibold uppercase text-foreground-muted">
                                  Details
                                </p>
                                <pre className="max-h-48 overflow-auto rounded border border-border bg-background p-3 font-mono text-[11px] text-foreground">
                                  {details == null
                                    ? "—"
                                    : JSON.stringify(details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-foreground-muted">
        <span>
          Page {Math.min(page, totalPages)} of {totalPages} · {filtered.length}{" "}
          {filtered.length === 1 ? "entry" : "entries"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
