//
// const API_BASE_URL =
//   (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";

const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_BASE_URL = RAW_BASE.replace(/\/$/, "") + "/api";
class API {
  token: string | null = localStorage.getItem("token");

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("token");
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async request(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);

    // Defaults
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Auth
    const authHeaders = this.getAuthHeaders();
    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    // Handle Unauthorized
    if (res.status === 401) {
      this.clearToken();
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    // Read body once
    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data;
  }

  get(path: string) {
    return this.request(path, { method: "GET" });
  }

  post(path: string, body?: any) {
    return this.request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put(path: string, body?: any) {
    return this.request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  patch(path: string, body?: any) {
    return this.request(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  delete(path: string) {
    return this.request(path, { method: "DELETE" });
  }
}

export const api = new API();
