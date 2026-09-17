import { Activity, Clock3 } from "lucide-react";

export default function InputCurrentTrafficPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16 md:px-6">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent"
        />
        <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Activity className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="relative mt-5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          Coming soon
        </p>
        <h2 className="relative mt-4 text-xl font-semibold tracking-tight">
          Input Current Traffic
        </h2>
        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
          Soon you will capture live traffic baselines per license package here,
          then feed utilization and expansion planning directly from those
          inputs—without editing the tree package-by-package.
        </p>
      </div>
    </div>
  );
}
