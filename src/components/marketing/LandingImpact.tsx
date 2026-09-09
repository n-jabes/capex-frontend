const stats = [
  { value: "Tree-wide", label: "CAPEX rollups from package to country" },
  { value: "Multi-market", label: "Portfolios across operating countries" },
  { value: "License years", label: "Expansion planning with utilization" },
  { value: "Vendor sites", label: "Site-level capacity and redundancy cues" },
];

export function LandingImpact() {
  return (
    <section className="border-t border-white/10 bg-[#07161a] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h2
          className="text-2xl font-semibold tracking-tight text-white md:text-3xl"
          style={{ fontFamily: "var(--font-landing-display), sans-serif" }}
        >
          CAPEX impact you can operate on
        </h2>
        <p className="mt-3 max-w-2xl text-[#9bb4bb]">
          From packet core to circuit switch, keep deliveries, domains, and
          license packages in one governed workspace—ready for every planning
          cycle.
        </p>
        <dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="landing-stat">
              <dt
                className="text-2xl font-semibold text-[#f0b429]"
                style={{ fontFamily: "var(--font-landing-display), sans-serif" }}
              >
                {stat.value}
              </dt>
              <dd className="mt-2 text-sm text-[#9bb4bb]">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
