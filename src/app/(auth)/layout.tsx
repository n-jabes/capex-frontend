import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/login" className="text-sm font-semibold tracking-tight">
          Axian Telecom Capacity and Pricing
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
