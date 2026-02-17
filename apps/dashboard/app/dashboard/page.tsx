"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

const PLAN_LIMITS: Record<string, number> = {
  free: 100,
  starter: 1000,
  growth: 5000,
  enterprise: Infinity,
};

export default function DashboardPage() {
  const user = getUser();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any[]>("/projects/me").then((res) => {
      if (res.success && res.data) setProjects(res.data);
      setLoading(false);
    });
  }, []);

  const planLimit = PLAN_LIMITS[user?.plan || "free"] || 100;
  const usedMinutes = 0; // Wired to real data in Sprint 5
  const usagePercent = planLimit === Infinity ? 0 : Math.round((usedMinutes / planLimit) * 100);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 capitalize">
            {user?.plan || "free"} plan
          </span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Usage this month</p>
          <p className="mt-1 text-2xl font-bold">{usedMinutes} min</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {planLimit === Infinity ? "Unlimited" : `${usedMinutes} / ${planLimit} minutes`}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Projects</p>
          <p className="mt-1 text-2xl font-bold">{loading ? "-" : projects.length}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Active rooms</p>
          <p className="mt-1 text-2xl font-bold">0</p>
          <p className="mt-1 text-xs text-gray-400">Real-time tracking coming soon</p>
        </div>
      </div>

      {!loading && projects.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <h3 className="text-lg font-medium">No projects yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first project to get an API key and start embedding video calls.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create Project
          </Link>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Projects</h2>
            <Link
              href="/dashboard/projects"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 3).map((project: any) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-gray-400">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/projects/${project.id}/setup`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Setup Guide
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
