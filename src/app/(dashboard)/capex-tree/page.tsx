import { TreeView } from "@/components/capex/TreeView";
import { SummaryPanel } from "@/components/capex/SummaryPanel";

export default function CapexTreePage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="w-[40%] min-w-[280px] border-r bg-card">
        <TreeView />
      </div>
      <div className="w-[60%] min-w-0 bg-background">
        <SummaryPanel />
      </div>
    </div>
  );
}
