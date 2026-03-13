"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import ActivityLog from "@/components/ActivityLog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/", label: "Todo App" },
  { href: "/api", label: "API Spec" },
  { href: "/test", label: "Test Backend" },
];

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <main className="mx-auto max-w-2xl px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen((p) => !p)}
              aria-label="Toggle activity log"
              title="Toggle activity log"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              ✅ Todo List
            </h1>
            <ThemeToggle />
          </div>

          {/* Tab navigation */}
          <nav className="mb-6">
            <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${
                      isActive
                        ? "bg-background text-foreground shadow"
                        : "hover:bg-background/50 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {children}
        </main>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <Separator orientation="vertical" className="h-auto" />
          <aside className="w-80 shrink-0 border-l border-border bg-card">
            <div className="sticky top-0 h-screen overflow-hidden">
              <ActivityLog />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
