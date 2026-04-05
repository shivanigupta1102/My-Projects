"use client";

import { motion } from "framer-motion";
import { Check, Plug, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const accounts = [
  { id: "1", channel: "Amazon", account: "Northwind — Seller Central", status: "Connected", lastSync: "2 min ago" },
  { id: "2", channel: "eBay", account: "northwind.shop (EB-88421)", status: "Connected", lastSync: "12 min ago" },
  { id: "3", channel: "Walmart", account: "Walmart Seller — pending WFS", status: "Needs action", lastSync: "—" },
  { id: "4", channel: "Shopify", account: "northwind.myshopify.com", status: "Connected", lastSync: "1 hr ago" },
  { id: "5", channel: "Etsy", account: "NorthwindGoods", status: "Connected", lastSync: "3 hr ago" },
];

export default function SettingsChannelsPage() {
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h2 className="text-xl font-semibold">Channel accounts</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          OAuth connections used to validate and publish listings.
        </p>
      </div>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-base">Connected marketplaces</CardTitle>
          <CardDescription>
            Remove a connection to revoke tokens. Reconnect anytime from this screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.channel}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-foreground-muted">{a.account}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "Connected" ? "success" : "warning"}>
                      {a.status === "Connected" && <Check className="mr-1 inline h-3 w-3" />}
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground-muted">{a.lastSync}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-error">
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button className="gap-2">
        <Plug className="h-4 w-4" />
        Add channel connection
      </Button>
    </motion.div>
  );
}
