//
const API_BASE_URL = "http://localhost:5000/api";

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
      headers, // ✅ satisfies HeadersInit
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Request failed");
    }

    return res.json();
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
