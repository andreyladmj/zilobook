// "" (empty string) is a valid value: same-origin requests, routed to the backend by Caddy in prod.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface AuthUser {
  id: string;
  role: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_self_employed: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

// --- Token storage ---

export function saveTokens(data: AuthResponse) {
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

// --- API calls ---

export async function register(body: {
  full_name: string;
  role: "PROFESSIONAL" | "CLIENT";
  phone: string;
  email?: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
}

export async function login(body: {
  phone: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function refreshTokens(): Promise<AuthResponse | null> {
  const token = getRefreshToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: token }),
  });

  if (!res.ok) {
    clearAuth();
    return null;
  }

  const data: AuthResponse = await res.json();
  saveTokens(data);
  return data;
}

export async function logout() {
  const token = getRefreshToken();
  if (token) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token }),
    }).catch(() => {});
  }
  clearAuth();
}

// --- Authenticated fetch helper ---

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(`${API_URL}${url}`, { ...options, headers });

  // If 401, try refreshing
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed.access_token}`);
      res = await fetch(`${API_URL}${url}`, { ...options, headers });
    }
  }

  return res;
}
