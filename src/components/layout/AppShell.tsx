"use client";

import { Header } from "@/components/layout/Header";
import { JobProgressBanner } from "@/components/layout/JobProgressBanner";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <JobProgressBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="min-h-0 flex-1 overflow-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
