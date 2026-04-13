import Link from "next/link";

const features = [
  {
    icon: "⏱",
    title: "Sound Countdown",
    description: "Audio countdown gets you ready. 3... 2... 1... Jump!",
  },
  {
    icon: "📱",
    title: "Phone Sensor",
    description: "Use your phone's accelerometer to estimate jump height automatically.",
  },
  {
    icon: "📊",
    title: "Track Progress",
    description: "View your history, personal bests, and see your improvements over time.",
  },
  {
    icon: "🏐",
    title: "Volleyball-Specific",
    description: "Track vertical jumps, approach jumps, block jumps, broad jumps, and more.",
  },
  {
    icon: "📵",
    title: "Fully Offline",
    description: "All data stored locally on your device. No account needed.",
  },
  {
    icon: "⚡",
    title: "Quick Entry",
    description: "Record jumps manually or with sensors. Multi-jump sessions made easy.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 text-center sm:py-32">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-6xl">🏐</p>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Track Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Explosive Power
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-md text-lg text-default-500">
            Record, measure, and analyze your volleyball jumps. See your vertical leap improve over
            time.
          </p>
          <Link
            href="/tracker"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-100"
          >
            Start Tracking
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Everything you need</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-default-200 bg-default-50 p-5"
              >
                <span className="mb-2 block text-3xl">{feature.icon}</span>
                <h3 className="mb-1 font-semibold">{feature.title}</h3>
                <p className="text-sm text-default-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 text-center">
        <div className="mx-auto max-w-md rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-8 text-white">
          <h2 className="mb-2 text-2xl font-bold">Ready to jump higher?</h2>
          <p className="mb-6 text-white/80">
            No sign-up required. Start recording your first session now.
          </p>
          <Link
            href="/tracker"
            className="inline-block rounded-xl bg-white px-6 py-3 font-bold text-blue-600 transition-transform hover:scale-105 active:scale-100"
          >
            Open ProMove
          </Link>
        </div>
      </section>
    </div>
  );
}
