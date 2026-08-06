"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type ColumnWidthMap = Record<string, number>;

export function useColumnWidths(
  storageKey: string,
  defaults: ColumnWidthMap,
) {
  const [stored, setStored] = useLocalStorage<ColumnWidthMap>(
    storageKey,
    defaults,
  );

  const widths: ColumnWidthMap = { ...defaults };
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    for (const [key, value] of Object.entries(stored)) {
      if (key in defaults && typeof value === "number" && value > 0) {
        widths[key] = value;
      }
    }
  }

  const setWidth = useCallback(
    (columnId: string, width: number, minWidth = 48) => {
      const next = Math.max(minWidth, Math.round(width));
      setStored((prev) => ({
        ...(prev && typeof prev === "object" && !Array.isArray(prev)
          ? prev
          : defaults),
        [columnId]: next,
      }));
    },
    [defaults, setStored],
  );

  const totalWidth = Object.values(widths).reduce((sum, w) => sum + w, 0);

  return { widths, setWidth, totalWidth };
}

interface UseColumnResizeDragOptions {
  columnId: string;
  currentWidth: number;
  minWidth?: number;
  onWidthChange: (columnId: string, width: number, minWidth?: number) => void;
}

/** Excel-style column edge drag — updates width while dragging. */
export function useColumnResizeDrag({
  columnId,
  currentWidth,
  minWidth = 48,
  onWidthChange,
}: UseColumnResizeDragOptions) {
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const delta = event.clientX - startXRef.current;
      onWidthChange(columnId, startWidthRef.current + delta, minWidth);
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [columnId, minWidth, onWidthChange]);

  const onResizePointerDown = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    startXRef.current = event.clientX;
    startWidthRef.current = currentWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Window listeners still handle the drag.
    }
  };

  return { onResizePointerDown };
}
