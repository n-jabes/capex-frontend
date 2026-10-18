"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearTrackedJob,
  resumeTrackedJobFromStorage,
  subscribeJob,
  type TrackedJob,
} from "@/lib/job-tracker";

export function JobProgressBanner() {
  const [job, setJob] = useState<TrackedJob | null>(null);

  useEffect(() => {
    resumeTrackedJobFromStorage();
    return subscribeJob(setJob);
  }, []);

  if (!job) return null;

  const failed = job.status === "failed";
  const done = job.status === "succeeded";
  const pct = Math.max(0, Math.min(100, job.progress ?? 0));

  return (
    <div
      className={
        failed
          ? "border-b border-destructive/40 bg-destructive/10 px-6 py-2"
          : done
            ? "border-b border-emerald-500/30 bg-emerald-500/10 px-6 py-2"
            : "border-b border-primary/20 bg-primary/5 px-6 py-2"
      }
    >
      <div className="flex items-center gap-3">
        {!done && !failed ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {failed
              ? `Job failed: ${job.error || "Unknown error"}`
              : done
                ? "Job finished"
                : job.label}
          </p>
          {!done && !failed ? (
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          ) : null}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {done || failed ? job.status : `${pct}%`}
        </span>
        {(done || failed) && (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="Dismiss"
            onClick={() => clearTrackedJob()}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
