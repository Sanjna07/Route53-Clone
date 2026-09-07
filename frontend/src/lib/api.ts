let activeBaseUrl: string | null = null;

const CANDIDATE_URLS = [
  process.env.NEXT_PUBLIC_API_BASE_URL,
  "http://localhost:8001",
  "http://127.0.0.1:8001",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
].filter(Boolean) as string[];

export class ApiError extends Error {
  code: string;
  field?: string;

  constructor(message: string, code: string = "UNKNOWN_ERROR", field?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.field = field;
  }
}

async function tryFetch<T>(baseUrl: string, endpoint: string, options: RequestInit): Promise<T> {
  const url = `${baseUrl}${endpoint}`;
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorInfo = data?.error || {};
    const msg = errorInfo.message || data?.detail || `HTTP Error ${response.status}`;
    const code = errorInfo.code || `HTTP_${response.status}`;
    const field = errorInfo.field || null;
    throw new ApiError(msg, code, field);
  }

  return data as T;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // If active backend URL is known, try it directly
  if (activeBaseUrl) {
    try {
      return await tryFetch<T>(activeBaseUrl, endpoint, options);
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      activeBaseUrl = null;
    }
  }

  let lastNetworkError: any = null;

  for (const baseUrl of CANDIDATE_URLS) {
    try {
      const result = await tryFetch<T>(baseUrl, endpoint, options);
      activeBaseUrl = baseUrl;
      return result;
    } catch (err: any) {
      if (err instanceof ApiError) {
        activeBaseUrl = baseUrl;
        throw err;
      }
      lastNetworkError = err;
    }
  }

  throw new ApiError(
    lastNetworkError?.message || "Failed to connect to backend server",
    "NETWORK_ERROR"
  );
}
