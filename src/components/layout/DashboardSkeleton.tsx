import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted-foreground/15", className)}
    />
  );
}

/** Chrome-matching placeholder for route transitions and workspace hydrate. */
export function DashboardSkeleton({
  includeShell = false,
  message = "Loading…",
}: {
  includeShell?: boolean;
  message?: string;
}) {
  const content = (
    <div className="flex h-full min-h-[50vh] flex-col gap-4 p-6">
      <div className="space-y-2">
        <Bone className="h-5 w-40" />
        <Bone className="h-3 w-64" />
      </div>
      <div className="grid flex-1 gap-3 md:grid-cols-2">
        <Bone className="min-h-[180px] w-full" />
        <Bone className="min-h-[180px] w-full" />
        <Bone className="min-h-[120px] w-full md:col-span-2" />
      </div>
      <p className="text-center text-xs text-muted-foreground">{message}</p>
    </div>
  );

  if (!includeShell) return content;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-3">
          <Bone className="h-8 w-8 rounded-md" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-56" />
            <Bone className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-7 w-24" />
          <Bone className="h-7 w-16" />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-56 shrink-0 flex-col gap-2 border-r bg-sidebar p-3">
          <Bone className="mb-2 ml-auto h-7 w-7" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-9 w-full" />
          ))}
        </aside>
        <main className="min-h-0 flex-1 overflow-auto bg-muted/30">{content}</main>
      </div>
    </div>
  );
}
