"use client";

import { motion } from "framer-motion";
import { Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const members = [
  { id: "1", name: "Alex Rivera", email: "alex@northwind.shop", role: "Admin", lastActive: "Now" },
  { id: "2", name: "Jamie Chen", email: "jamie@northwind.shop", role: "Editor", lastActive: "2h ago" },
  { id: "3", name: "Morgan Ellis", email: "morgan@northwind.shop", role: "Editor", lastActive: "1d ago" },
  { id: "4", name: "Sam Okonkwo", email: "sam@northwind.shop", role: "Viewer", lastActive: "3d ago" },
];

export default function SettingsTeamPage() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Roles control ingestion, review approval, publish, and billing visibility.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite member
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-surface sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite teammate</DialogTitle>
              <DialogDescription>
                They&apos;ll receive an email with a secure link to join Northwind Trading.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="bg-background/80"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select defaultValue="EDITOR">
                  <SelectTrigger className="bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                <Mail className="mr-2 h-4 w-4" />
                Send invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
          <CardDescription>Four seats in use on the Pro plan.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-foreground-muted">{m.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.role}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground-muted">{m.lastActive}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
