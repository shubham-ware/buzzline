"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

const tabs = ["HTML", "React", "Next.js"] as const;

export default function SetupPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("HTML");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<any>(`/projects/${id}`).then((res) => {
      if (res.success && res.data) setProject(res.data);
      setLoading(false);
    });
  }, [id]);

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-red-500">Project not found.</p>;
  }

  const apiKey = project.apiKey;
  const scriptTag = `<script src="https://cdn.buzzline.dev/v1/widget.js"></script>`;
  const scriptTagLocal = `<script src="http://localhost:3002/buzzline.js"></script>`;

  const snippets: Record<(typeof tabs)[number], string> = {
    HTML: `<!-- 1. Add the script tag before </body> -->
${scriptTagLocal}

<!-- 2. Initialize Buzzline -->
<script>
  Buzzline.init({
    apiKey: "${apiKey}",
    apiUrl: "http://localhost:4000",
    brandColor: "#6366f1",
    position: "bottom-right",
  });
</script>`,
    React: `// Install: npm install buzzline-widget (coming soon)
// For now, add the script tag to your index.html

// In your App component:
useEffect(() => {
  if (window.Buzzline) {
    window.Buzzline.init({
      apiKey: "${apiKey}",
      apiUrl: "http://localhost:4000",
      brandColor: "#6366f1",
      position: "bottom-right",
    });
  }
}, []);`,
    "Next.js": `// In your layout.tsx or _app.tsx:
import Script from "next/script";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Script
        src="http://localhost:3002/buzzline.js"
        onLoad={() => {
          window.Buzzline.init({
            apiKey: "${apiKey}",
            apiUrl: "http://localhost:4000",
            brandColor: "#6366f1",
            position: "bottom-right",
          });
        }}
      />
    </>
  );
}`,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/projects"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Projects
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Setup: {project.name}</h1>
      </div>

      {/* Step 1 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            1
          </span>
          Your API Key
        </h2>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-mono">
            {apiKey}
          </code>
          <button
            onClick={() => copy(apiKey, "apiKey")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            {copied === "apiKey" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Step 2 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            2
          </span>
          Add the Code
        </h2>

        <div className="mt-3 flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
            <code>{snippets[activeTab]}</code>
          </pre>
          <button
            onClick={() => copy(snippets[activeTab], "snippet")}
            className="absolute right-2 top-2 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
          >
            {copied === "snippet" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Step 3 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            3
          </span>
          Test It
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Open your app (or the test page) and click the floating video button in the bottom-right corner.
          Share the link with someone to start a video call.
        </p>
        <a
          href="http://localhost:3002/test-call.html"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Open Test Page &rarr;
        </a>
      </div>
    </div>
  );
}
