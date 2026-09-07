const DEFAULT_URLS = [
  process.env.NEXT_PUBLIC_API_BASE_URL,
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8001",
  "http://127.0.0.1:8001",
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

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let lastError: Error | null = null;

  for (const baseUrl of DEFAULT_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Essential for HTTP-only cookies
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorInfo = data?.error || {};
        throw new ApiError(
          errorInfo.message || "An unexpected error occurred",
          errorInfo.code || `HTTP_${response.status}`,
          errorInfo.field
        );
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      lastError = err;
    }
  }

  throw new ApiError(lastError?.message || "Failed to connect to backend API server", "NETWORK_ERROR");
}
