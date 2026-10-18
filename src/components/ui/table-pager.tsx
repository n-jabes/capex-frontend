"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export function useClientPager<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const slice = useMemo(
    () =>
      items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, pageSize, safePage],
  );

  return {
    page: safePage,
    setPage,
    slice,
    totalPages,
    pageSize,
    total: items.length,
    showPager: items.length > pageSize,
  };
}

export function TablePager({
  page,
  totalPages,
  total,
  pageSize,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (total === 0) return null;
  if (total <= pageSize) {
    return (
      <p className="text-xs text-muted-foreground">
        {total} entr{total === 1 ? "y" : "ies"}
      </p>
    );
  }

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
