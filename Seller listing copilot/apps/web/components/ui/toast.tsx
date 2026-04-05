"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-foreground-muted",
          actionButton:
            "group-[.toast]:bg-accent group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-surface-hover group-[.toast]:text-foreground-muted",
        },
      }}
      {...props}
    />
  );
}
