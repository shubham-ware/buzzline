import Link from "next/link";
import { PLAN_LIMITS, PLAN_PRICES, PlanName } from "@buzzline/shared";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-indigo-600">Buzzline</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
          Add video calls to your app
          <br />
          <span className="text-indigo-600">in 3 lines of code</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
          Buzzline is an embeddable video calling widget. Your customers get seamless video calls
          without ever leaving your app. No WebRTC knowledge required.
        </p>

        <div className="mx-auto mt-10 max-w-xl rounded-xl bg-gray-900 p-6 text-left">
          <p className="mb-2 text-xs font-medium text-gray-400">Add to your HTML</p>
          <pre className="overflow-x-auto text-sm leading-relaxed text-green-400">
{`<script src="https://cdn.buzzline.dev/v1/widget.js"></script>
<script>
  Buzzline.init({ apiKey: "bz_your_key" });
</script>`}
          </pre>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">Why Buzzline?</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg">
                &lt;/&gt;
              </div>
              <h3 className="text-lg font-semibold">Easy Integration</h3>
              <p className="mt-2 text-sm text-gray-500">
                Drop in a script tag and initialize with your API key. Works with any framework
                — React, Vue, vanilla HTML. Under 50KB.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg">
                #
              </div>
              <h3 className="text-lg font-semibold">Customizable</h3>
              <p className="mt-2 text-sm text-gray-500">
                Match your brand with custom colors and positioning. The widget blends into your
                app&apos;s design. CSS-scoped to avoid conflicts.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg">
                ~
              </div>
              <h3 className="text-lg font-semibold">Usage Dashboard</h3>
              <p className="mt-2 text-sm text-gray-500">
                Track call minutes, manage API keys, and monitor usage across all your projects
                from a single dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
          <p className="mt-3 text-center text-gray-500">Start free, upgrade when you need more.</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-4">
            {(["free", "starter", "growth", "enterprise"] as const).map((plan) => (
              <div
                key={plan}
                className={`rounded-xl border p-6 ${
                  plan === "starter" ? "border-indigo-500 shadow-lg" : "border-gray-200"
                }`}
              >
                {plan === "starter" && (
                  <span className="mb-3 inline-block rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                    Most popular
                  </span>
                )}
                <p className="text-sm font-semibold capitalize text-gray-900">{plan}</p>
                <p className="mt-1 text-3xl font-bold">{PLAN_PRICES[plan]}</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li>
                    {PLAN_LIMITS[plan].minutesPerMonth === Infinity
                      ? "Unlimited minutes"
                      : `${PLAN_LIMITS[plan].minutesPerMonth.toLocaleString()} min/mo`}
                  </li>
                  <li>
                    {PLAN_LIMITS[plan].maxProjects === Infinity
                      ? "Unlimited projects"
                      : `${PLAN_LIMITS[plan].maxProjects} project${PLAN_LIMITS[plan].maxProjects > 1 ? "s" : ""}`}
                  </li>
                  <li>Up to {PLAN_LIMITS[plan].maxParticipants} participants</li>
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 block rounded-lg px-4 py-2 text-center text-sm font-medium ${
                    plan === "starter"
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {plan === "enterprise" ? "Contact us" : "Get started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Buzzline. Built for developers.
        </div>
      </footer>
    </div>
  );
}
