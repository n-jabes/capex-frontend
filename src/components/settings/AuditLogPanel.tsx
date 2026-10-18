"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CapexApiError } from "@/lib/api/client";
import { listOrgAudit, type AuditEventRow } from "@/lib/api/capex-api";

const PAGE_SIZE = 10;

export function AuditLogPanel() {
  const [items, setItems] = useState<AuditEventRow[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  /** Cursor to request for each page index (0 = start). */
  const cursorsRef = useRef<Array<string | undefined>>([undefined]);

  const loadPage = useCallback(async (pageIndex: number) => {
    setLoading(true);
    try {
      const cursor = cursorsRef.current[pageIndex];
      const result = await listOrgAudit({
        cursor,
        take: PAGE_SIZE,
      });
      setItems(result.items);
      setHasNext(Boolean(result.nextCursor));
      if (result.nextCursor) {
        cursorsRef.current[pageIndex + 1] = result.nextCursor;
      }
      setPage(pageIndex);
    } catch (error) {
      toast.error("Could not load audit log", {
        description:
          error instanceof CapexApiError ? error.message : "Request failed",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(0);
  }, [loadPage]);

  const onExportCsv = () => {
    const header = ["createdAt", "action", "user", "entityType", "entityId"];
    const rows = items.map((row) =>
      [
        row.createdAt,
        row.action,
        row.user?.email ?? "",
        row.entityType,
        row.entityId ?? "",
      ]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `capex-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rangeStart = items.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = page * PAGE_SIZE + items.length;
  const showPager = page > 0 || hasNext;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Recent workspace changes (owners/admins).
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={items.length === 0 || loading}
          onClick={onExportCsv}
        >
          Export CSV
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading audit history…
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No audit events yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(row.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.action}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.user?.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.entityType}
                    {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ""}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {showPager ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {items.length === 0
              ? "No entries"
              : `Showing ${rangeStart}–${rangeEnd}`}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || page === 0}
              onClick={() => void loadPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !hasNext}
              onClick={() => void loadPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : items.length > 0 && !loading ? (
        <p className="text-xs text-muted-foreground">
          {items.length} entr{items.length === 1 ? "y" : "ies"}
        </p>
      ) : null}
    </div>
  );
}
