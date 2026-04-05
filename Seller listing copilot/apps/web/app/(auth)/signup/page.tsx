"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [name, setName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex@northwind.shop");
  const [password, setPassword] = useState("");
  const [team, setTeam] = useState("Northwind Trading");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    login("demo-token-lp", {
      id: "user-demo-1",
      email,
      name,
    }, { id: "org-new", name: team });
    router.push("/dashboard");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border bg-surface shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
            LP
          </div>
          <CardTitle className="text-xl">Create your workspace</CardTitle>
          <CardDescription className="text-foreground-muted">
            ListingPilot AI — start your free trial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background/80"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/80"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team / company</Label>
              <Input
                id="team"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="bg-background/80"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/80"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-foreground-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
