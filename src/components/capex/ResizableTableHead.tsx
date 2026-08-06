"use client";

import type { ReactNode } from "react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useColumnResizeDrag } from "@/hooks/useColumnWidths";

interface ResizableTableHeadProps {
  columnId: string;
  width: number;
  onWidthChange: (columnId: string, width: number, minWidth?: number) => void;
  minWidth?: number;
  className?: string;
  children?: ReactNode;
  align?: "left" | "right";
}

/** Table header cell with an Excel-style right-edge drag handle to resize width. */
export function ResizableTableHead({
  columnId,
  width,
  onWidthChange,
  minWidth = 48,
  className,
  children,
  align = "left",
}: ResizableTableHeadProps) {
  const { onResizePointerDown } = useColumnResizeDrag({
    columnId,
    currentWidth: width,
    minWidth,
    onWidthChange,
  });

  return (
    <TableHead
      className={cn(
        "relative overflow-hidden",
        align === "right" && "text-right",
        className,
      )}
      style={{ width, minWidth: width, maxWidth: width }}
    >
      <span className="block truncate pr-2">{children}</span>
      <span
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${columnId} column`}
        title="Drag to resize"
        className="absolute inset-y-0 right-0 z-20 w-2 cursor-col-resize touch-none hover:bg-primary/25 active:bg-primary/40"
        onPointerDown={onResizePointerDown}
        onClick={(event) => event.stopPropagation()}
      />
    </TableHead>
  );
}
