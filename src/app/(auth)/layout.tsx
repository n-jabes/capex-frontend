import Link from "next/link";
import { Syne, Manrope } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-auth-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-auth-sans",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${syne.variable} ${manrope.variable} relative flex min-h-full flex-1 flex-col overflow-hidden bg-[#0b1f24] text-[#e8f0f2]`}
      style={{ fontFamily: "var(--font-auth-sans), system-ui, sans-serif" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 landing-hero-glow opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 landing-hero-mesh opacity-40"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="text-sm font-semibold tracking-wide text-white md:text-base"
          style={{ fontFamily: "var(--font-auth-display), sans-serif" }}
        >
          Axian Telecom Capacity and Pricing
        </Link>
        <Link
          href="/"
          className="text-sm text-[#9bb4bb] transition hover:text-white"
        >
          Back to home
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        {children}
      </main>
    </div>
  );
}
