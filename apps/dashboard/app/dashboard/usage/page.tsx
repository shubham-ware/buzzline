"use client";

import { getUser } from "@/lib/auth";

const PLAN_LIMITS: Record<string, number> = {
  free: 100,
  starter: 1000,
  growth: 5000,
  enterprise: Infinity,
};

const PLAN_PRICES: Record<string, string> = {
  free: "Free",
  starter: "$29/mo",
  growth: "$79/mo",
  enterprise: "Custom",
};

export default function UsagePage() {
  const user = getUser();
  const plan = user?.plan || "free";
  const limit = PLAN_LIMITS[plan] || 100;
  const used = 0; // Wired to real data in Sprint 5
  const percent = limit === Infinity ? 0 : Math.round((used / limit) * 100);

  // Mock daily data for chart visualization
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), minutes: 0 };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Usage</h1>

      {/* Current usage */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current month</p>
            <p className="mt-1 text-3xl font-bold">{used} min</p>
            <p className="mt-1 text-sm text-gray-400">
              of {limit === Infinity ? "unlimited" : `${limit} minutes`} ({PLAN_PRICES[plan]})
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800 capitalize">
              {plan} plan
            </span>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${percent > 80 ? "bg-red-500" : "bg-indigo-500"}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">{percent}% used</p>

        {plan === "free" && (
          <div className="mt-4 rounded-lg bg-indigo-50 p-3">
            <p className="text-sm text-indigo-800">
              <strong>Need more minutes?</strong> Upgrade to Starter for 1,000 min/mo at $29/mo.
            </p>
          </div>
        )}
      </div>

      {/* Daily chart (placeholder) */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Daily Usage (Last 30 Days)</h2>
        <div className="flex h-40 items-end gap-1">
          {days.map((day, i) => (
            <div key={i} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-indigo-200 transition-colors hover:bg-indigo-400"
                style={{ height: `${Math.max(day.minutes > 0 ? (day.minutes / Math.max(...days.map((d) => d.minutes), 1)) * 100 : 2, 2)}%` }}
              />
              <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                {day.date}: {day.minutes} min
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-gray-400">
          Usage tracking will be activated in Sprint 5
        </p>
      </div>

      {/* Plan comparison */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Plans</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {(["free", "starter", "growth", "enterprise"] as const).map((p) => (
            <div
              key={p}
              className={`rounded-lg border p-4 ${p === plan ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
            >
              <p className="text-sm font-semibold capitalize">{p}</p>
              <p className="text-lg font-bold">{PLAN_PRICES[p]}</p>
              <p className="mt-1 text-xs text-gray-500">
                {PLAN_LIMITS[p] === Infinity ? "Unlimited" : `${PLAN_LIMITS[p]} min/mo`}
              </p>
              {p === plan && (
                <span className="mt-2 inline-block text-xs font-medium text-indigo-600">
                  Current plan
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
