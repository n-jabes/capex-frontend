import Link from "next/link";
import { Syne, Manrope } from "next/font/google";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingMission } from "@/components/marketing/LandingMission";
import { LandingImpact } from "@/components/marketing/LandingImpact";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-landing-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-landing-sans",
});

export default function LandingPage() {
  return (
    <div
      className={`${syne.variable} ${manrope.variable} min-h-full bg-[#0b1f24] text-[#e8f0f2]`}
      style={{
        fontFamily: "var(--font-landing-sans), system-ui, sans-serif",
      }}
    >
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <p
          className="text-sm font-semibold tracking-wide text-[#e8f0f2] md:text-base"
          style={{ fontFamily: "var(--font-landing-display), sans-serif" }}
        >
          Axian Telecom Capacity and Pricing
        </p>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-[#c5d6db] transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-[#f0b429] px-3 py-2 font-medium text-[#1a1205] transition hover:bg-[#f7c856]"
          >
            Get started
          </Link>
        </nav>
      </header>

      <LandingHero />
      <LandingMission />
      <LandingImpact />

      <footer className="border-t border-white/10 px-6 py-8 text-sm text-[#9bb4bb] md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>Built for telecom CAPEX visibility across African markets.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-white">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
