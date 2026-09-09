import { AppShell } from "@/components/layout/AppShell";
import { CapexProvider } from "@/context/CapexContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CapexProvider>
      <AppShell>{children}</AppShell>
    </CapexProvider>
  );
}
