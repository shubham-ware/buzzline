"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  PLAN_LIMITS,
  PLAN_PRICES,
  PlanName,
  UsageCurrentResponse,
  UsageDailyItem,
  UsageByProjectItem,
} from "@buzzline/shared";

export default function UsagePage() {
  const user = getUser();
  const plan = (user?.plan || "free") as PlanName;
  const limit = PLAN_LIMITS[plan]?.minutesPerMonth || 100;

  const [used, setUsed] = useState(0);
  const [days, setDays] = useState<UsageDailyItem[]>([]);
  const [projectUsage, setProjectUsage] = useState<UsageByProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<UsageCurrentResponse>("/usage/current"),
      apiFetch<UsageDailyItem[]>("/usage/daily?days=30"),
      apiFetch<UsageByProjectItem[]>("/usage/by-project"),
    ]).then(([currentRes, dailyRes, projectRes]) => {
      if (currentRes.success && currentRes.data) setUsed(currentRes.data.totalMinutes);
      if (dailyRes.success && dailyRes.data) setDays(dailyRes.data);
      if (projectRes.success && projectRes.data) setProjectUsage(projectRes.data);
      setLoading(false);
    });
  }, []);

  const percent = limit === Infinity ? 0 : Math.round((used / limit) * 100);
  const maxDayMinutes = Math.max(...days.map((d) => d.totalMinutes), 1);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Usage</h1>

      {/* Current usage */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current month</p>
            <p className="mt-1 text-3xl font-bold">{loading ? "-" : used} min</p>
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

      {/* Daily chart */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Daily Usage (Last 30 Days)</h2>
        <div className="flex h-40 items-end gap-1">
          {days.map((day, i) => (
            <div key={i} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-indigo-200 transition-colors hover:bg-indigo-400"
                style={{
                  height: `${Math.max(day.totalMinutes > 0 ? (day.totalMinutes / maxDayMinutes) * 100 : 2, 2)}%`,
                }}
              />
              <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                {day.date}: {day.totalMinutes} min
              </div>
            </div>
          ))}
        </div>
        {days.length === 0 && !loading && (
          <p className="mt-3 text-center text-sm text-gray-400">No usage data yet</p>
        )}
      </div>

      {/* Usage by project */}
      {projectUsage.length > 0 && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Usage by Project</h2>
          <div className="space-y-3">
            {projectUsage.map((p) => (
              <div key={p.projectId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.projectName}</p>
                  <p className="text-xs text-gray-400">{p.roomCount} rooms</p>
                </div>
                <p className="text-sm font-semibold">{p.totalMinutes} min</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                {PLAN_LIMITS[p].minutesPerMonth === Infinity ? "Unlimited" : `${PLAN_LIMITS[p].minutesPerMonth} min/mo`}
              </p>
              {p === plan && (
                <span className="mt-2 inline-block text-xs font-medium text-indigo-600">
                  Current plan
                </span>
              )}
              {p !== plan && p !== "free" && p !== "enterprise" && (
                <button
                  onClick={async () => {
                    const res = await apiFetch<{ url: string }>("/billing/create-checkout", {
                      method: "POST",
                      body: JSON.stringify({ plan: p }),
                    });
                    if (res.success && res.data?.url) {
                      window.location.href = res.data.url;
                    }
                  }}
                  className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </div>

        {plan !== "free" && (
          <button
            onClick={async () => {
              const res = await apiFetch<{ url: string }>("/billing/portal", { method: "POST" });
              if (res.success && res.data?.url) {
                window.location.href = res.data.url;
              }
            }}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Manage Subscription
          </button>
        )}
      </div>
    </div>
  );
}
