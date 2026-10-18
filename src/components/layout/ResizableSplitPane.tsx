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

/**
 * Split pane that updates width via the DOM during drag so heavy children
 * (tree + summary) are not re-rendered on every pointer move.
 */
export function ResizableSplitPane({
  left,
  right,
  defaultLeftPercent = 40,
  minLeftPercent = 25,
  maxLeftPercent = 65,
  className,
}: ResizableSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef(defaultLeftPercent);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [ariaPercent, setAriaPercent] = useState(defaultLeftPercent);

  const applyWidth = useCallback((percent: number) => {
    const clamped = Math.min(maxLeftPercent, Math.max(minLeftPercent, percent));
    percentRef.current = clamped;
    setAriaPercent(clamped);
    if (leftPaneRef.current) {
      leftPaneRef.current.style.width = `${clamped}%`;
    }
  }, [maxLeftPercent, minLeftPercent]);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const next = ((event.clientX - rect.left) / rect.width) * 100;
      applyWidth(next);
    },
    [applyWidth],
  );

  const stopDragging = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [dragging, onPointerMove, stopDragging]);

  useEffect(() => {
    applyWidth(defaultLeftPercent);
  }, [applyWidth, defaultLeftPercent]);

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
        ref={leftPaneRef}
        className="flex min-h-0 min-w-[240px] shrink-0 flex-col overflow-hidden border-r bg-card"
        style={{ width: `${defaultLeftPercent}%` }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(ariaPercent)}
        aria-label="Resize panels"
        className={cn(
          "relative z-10 w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/40",
          dragging && "bg-primary/50",
        )}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          draggingRef.current = true;
          setDragging(true);
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
          try {
            (event.currentTarget as HTMLElement).setPointerCapture(
              event.pointerId,
            );
          } catch {
            // Pointer capture may fail in some environments; window listeners still work.
          }
        }}
      />

      <div className="min-w-0 flex-1 overflow-hidden bg-background">{right}</div>
    </div>
  );
}
