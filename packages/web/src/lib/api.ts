/**
 * API Client
 *
 * Typed fetch wrapper for communicating with the Fastify server.
 * Unwraps ApiResponse<T> and handles errors.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
// API response types (matching server response.ts)
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    context?: unknown;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Custom API error with code and message
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Unwrap API response, throwing ApiError on failure
 */
function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiError(response.error.code, response.error.message, response.error.context);
  }
  return response.data;
}

/**
 * Get auth headers for API requests (Gemini API key from localStorage).
 */
function getAuthHeaders(): Record<string, string> {
  const key = localStorage.getItem('gemini-api-key');
  if (key) return { 'X-Gemini-Key': key };
  return {};
}

/**
 * GET request
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text();
    try {
      const errorJson = JSON.parse(text);
      throw new ApiError(
        errorJson.error?.code ?? 'HTTP_ERROR',
        errorJson.error?.message ?? `HTTP ${res.status}`
      );
    } catch {
      throw new ApiError('HTTP_ERROR', `HTTP ${res.status}: ${text}`);
    }
  }
  const json: ApiResponse<T> = await res.json();
  return unwrap(json);
}

/**
 * POST request
 */
export async function apiPost<T, B = unknown>(path: string, body: B): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const errorJson = JSON.parse(text);
      throw new ApiError(
        errorJson.error?.code ?? 'HTTP_ERROR',
        errorJson.error?.message ?? `HTTP ${res.status}`
      );
    } catch {
      throw new ApiError('HTTP_ERROR', `HTTP ${res.status}: ${text}`);
    }
  }
  const json: ApiResponse<T> = await res.json();
  return unwrap(json);
}

/**
 * PATCH request
 */
export async function apiPatch<T, B = unknown>(path: string, body: B): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const errorJson = JSON.parse(text);
      throw new ApiError(
        errorJson.error?.code ?? 'HTTP_ERROR',
        errorJson.error?.message ?? `HTTP ${res.status}`
      );
    } catch {
      throw new ApiError('HTTP_ERROR', `HTTP ${res.status}: ${text}`);
    }
  }
  const json: ApiResponse<T> = await res.json();
  return unwrap(json);
}

/**
 * PUT request
 */
export async function apiPut<T, B = unknown>(path: string, body: B): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const errorJson = JSON.parse(text);
      throw new ApiError(
        errorJson.error?.code ?? 'HTTP_ERROR',
        errorJson.error?.message ?? `HTTP ${res.status}`
      );
    } catch {
      throw new ApiError('HTTP_ERROR', `HTTP ${res.status}: ${text}`);
    }
  }
  const json: ApiResponse<T> = await res.json();
  return unwrap(json);
}

/**
 * DELETE request
 */
export async function apiDelete<T = void>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const errorJson = JSON.parse(text);
      throw new ApiError(
        errorJson.error?.code ?? 'HTTP_ERROR',
        errorJson.error?.message ?? `HTTP ${res.status}`
      );
    } catch {
      throw new ApiError('HTTP_ERROR', `HTTP ${res.status}: ${text}`);
    }
  }
  const json: ApiResponse<T> = await res.json();
  return unwrap(json);
}
