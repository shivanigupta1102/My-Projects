"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuthStore } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setReady(true);
    });
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true);
    }
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/login");
    }
  }, [ready, token, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-foreground-muted">
        Loading…
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
