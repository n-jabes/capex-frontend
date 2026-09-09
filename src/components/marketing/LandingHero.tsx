import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden px-6 pb-16 pt-28 md:items-center md:px-10 md:pb-24 md:pt-20">
      <div
        aria-hidden
        className="landing-hero-glow pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="landing-hero-mesh pointer-events-none absolute inset-0 opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1f24] via-[#0b1f24]/55 to-transparent md:bg-gradient-to-r md:from-[#0b1f24] md:via-[#0b1f24]/70 md:to-transparent"
      />

      <div className="landing-hero-copy relative z-10 max-w-2xl">
        <h1
          className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl"
          style={{ fontFamily: "var(--font-landing-display), sans-serif" }}
        >
          Axian Telecom Capacity and Pricing
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[#d5e4e8] sm:text-xl">
          Plan network CAPEX with clarity—from delivery to license—across every
          market you operate.
        </p>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#9bb4bb] sm:text-base">
          A partner for Africa&apos;s digital transformation: structure
          software, hardware, and services spend so capacity decisions stay
          visible and accountable.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="landing-cta-primary inline-flex items-center rounded-md bg-[#f0b429] px-5 py-2.5 text-sm font-semibold text-[#1a1205] transition hover:bg-[#f7c856]"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="landing-cta-secondary inline-flex items-center rounded-md border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/50 hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            href="/capex-tree"
            className="landing-cta-secondary inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium text-[#9bb4bb] transition hover:text-white"
          >
            Open workspace
          </Link>
        </div>
      </div>
    </section>
  );
}
