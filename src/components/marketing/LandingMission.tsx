const pillars = [
  {
    title: "Expand access with structured CAPEX",
    body: "Model fixed and mobile delivery lines so teams can see where license growth unlocks coverage and digitisation.",
  },
  {
    title: "Invest in telecom infrastructure with foresight",
    body: "Trace spend from domain and node through vendor sites, so backbone and core upgrades stay grounded in capacity data.",
  },
  {
    title: "Champion inclusive digital services growth",
    body: "Keep package utilization, discounts, and multi-year expansions readable for every market in the portfolio.",
  },
];

export function LandingMission() {
  return (
    <section className="border-t border-white/10 px-6 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h2
          className="max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-3xl"
          style={{ fontFamily: "var(--font-landing-display), sans-serif" }}
        >
          Built as a partner for Africa&apos;s digital transformation
        </h2>
        <p className="mt-3 max-w-2xl text-[#9bb4bb]">
          Inspired by the mission to expand connectivity—this platform focuses
          on making CAPEX decisions as clear as the networks they fund.
        </p>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <li key={pillar.title} className="landing-pillar">
              <span className="text-sm font-medium text-[#f0b429]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9bb4bb]">
                {pillar.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
