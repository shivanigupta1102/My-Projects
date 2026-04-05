"use client";

import { Bell, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function TopBar({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <TooltipProvider>
      <header
        className={cn(
          "flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur",
          className,
        )}
      >
        <div className="relative max-w-md flex-1">
          <Input
            type="search"
            placeholder="Search products, SKUs, listings…"
            className="h-9 bg-surface pl-3 pr-3 text-sm"
            aria-label="Global search"
          />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-foreground-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="relative h-9 gap-2 rounded-full px-1"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent/20 text-xs font-medium text-accent">
                    {(user?.name ?? user?.email ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name ?? "Operator"}
                  </p>
                  <p className="text-xs leading-none text-foreground-muted">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-error focus:text-error"
                onSelect={() => logout()}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
