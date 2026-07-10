"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ResizableSplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  className?: string;
}

export function ResizableSplitPane({
  left,
  right,
  defaultLeftPercent = 40,
  minLeftPercent = 25,
  maxLeftPercent = 65,
  className,
}: ResizableSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const [dragging, setDragging] = useState(false);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const next = ((event.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(
        Math.min(maxLeftPercent, Math.max(minLeftPercent, next)),
      );
    },
    [maxLeftPercent, minLeftPercent],
  );

  const stopDragging = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [dragging, onPointerMove, stopDragging]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full overflow-hidden",
        dragging && "select-none",
        className,
      )}
    >
      <div
        className="min-w-[240px] shrink-0 overflow-hidden border-r bg-card"
        style={{ width: `${leftPercent}%` }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        className={cn(
          "relative z-10 w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/40",
          dragging && "bg-primary/50",
        )}
        onPointerDown={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
      />

      <div className="min-w-0 flex-1 overflow-hidden bg-background">{right}</div>
    </div>
  );
}
