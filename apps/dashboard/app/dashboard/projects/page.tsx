"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [rotating, setRotating] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const res = await apiFetch<any[]>("/projects/me");
    if (res.success && res.data) setProjects(res.data);
    setLoading(false);
  }

  function toggleReveal(id: string) {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function copyKey(apiKey: string) {
    navigator.clipboard.writeText(apiKey);
  }

  async function rotateKey(projectId: string) {
    if (!confirm("Are you sure? The old API key will stop working immediately.")) return;
    setRotating(projectId);
    const res = await apiFetch<{ apiKey: string }>(`/projects/${projectId}/rotate-key`, {
      method: "POST",
    });
    if (res.success && res.data) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, apiKey: res.data!.apiKey } : p)),
      );
    }
    setRotating(null);
  }

  function maskKey(key: string) {
    return key.slice(0, 7) + "•".repeat(20) + key.slice(-4);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">No projects yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
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

              <div className="mt-4">
                <label className="text-xs font-medium text-gray-500">API Key</label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-mono">
                    {revealedKeys.has(project.id) ? project.apiKey : maskKey(project.apiKey)}
                  </code>
                  <button
                    onClick={() => toggleReveal(project.id)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {revealedKeys.has(project.id) ? "Hide" : "Reveal"}
                  </button>
                  <button
                    onClick={() => copyKey(project.apiKey)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => rotateKey(project.id)}
                    disabled={rotating === project.id}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {rotating === project.id ? "Rotating..." : "Rotate"}
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs font-medium text-gray-500">Allowed Origins</label>
                <p className="mt-1 text-sm text-gray-700">
                  {(project.allowedOrigins as string[])?.join(", ") || "*"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
