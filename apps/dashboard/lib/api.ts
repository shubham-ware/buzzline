const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("buzzline_token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();

  // NestJS exceptions return { message, error, statusCode } — normalize to ApiResponse shape
  if (!res.ok && json.success === undefined) {
    return { success: false, error: { code: json.error || "ERROR", message: json.message || "Request failed" } };
  }

  return json;
}
