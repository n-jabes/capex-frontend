export default function BenchmarkingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      <div className="shrink-0 border-b bg-background px-4 py-4 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Benchmarking</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Compare prices across your portfolio and catalogs.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
