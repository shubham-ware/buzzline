export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("buzzline_token");
}

export function getUser(): { id: string; email: string; name: string; plan: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("buzzline_user");
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(token: string, user: { id: string; email: string; name: string; plan: string }) {
  localStorage.setItem("buzzline_token", token);
  localStorage.setItem("buzzline_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("buzzline_token");
  localStorage.removeItem("buzzline_user");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
