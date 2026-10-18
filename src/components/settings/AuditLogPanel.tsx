"use client";

import { useCallback, useEffect, useState } from "react";
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

export function AuditLogPanel() {
  const [items, setItems] = useState<AuditEventRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (next?: string | null, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const page = await listOrgAudit({
        cursor: next ?? undefined,
        take: 40,
      });
      setItems((prev) => (append ? [...prev, ...page.items] : page.items));
      setCursor(page.nextCursor);
    } catch (error) {
      toast.error("Could not load audit log", {
        description:
          error instanceof CapexApiError ? error.message : "Request failed",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading audit history…
      </div>
    );
  }

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
          disabled={items.length === 0}
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
            {items.length === 0 ? (
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
                  <TableCell className="font-mono text-xs">{row.action}</TableCell>
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
      {cursor ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={loadingMore}
          onClick={() => void load(cursor, true)}
        >
          {loadingMore ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
