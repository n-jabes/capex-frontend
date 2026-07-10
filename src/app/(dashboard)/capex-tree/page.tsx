"use client";

import { TreeView } from "@/components/capex/TreeView";
import { SummaryPanel } from "@/components/capex/SummaryPanel";
import { ResizableSplitPane } from "@/components/layout/ResizableSplitPane";

export default function CapexTreePage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
      <ResizableSplitPane
        className="hidden lg:flex"
        defaultLeftPercent={40}
        left={<TreeView />}
        right={<SummaryPanel />}
      />
      <div className="flex h-full flex-col lg:hidden">
        <div className="min-h-[45%] border-b bg-card">
          <TreeView />
        </div>
        <div className="min-h-0 flex-1 bg-background">
          <SummaryPanel />
        </div>
      </div>
    </div>
  );
}
