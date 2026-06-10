/** Extrae mensaje legible de respuestas JSON de error (REST, validación, etc.). */
export function errorMessageFromResponseBody(
  responseData: unknown,
  status: number
): string {
  if (responseData == null) {
    return `Error ${status}`;
  }
  if (typeof responseData === 'string') {
    return responseData || `Error ${status}`;
  }
  if (typeof responseData !== 'object') {
    return `Error ${status}`;
  }
  const d = responseData as Record<string, unknown>;
  if (typeof d.error === 'string' && d.error) return d.error;
  if (typeof d.message === 'string' && d.message) return d.message;
  if (Array.isArray(d.errors)) {
    const parts = d.errors
      .map((e) => {
        if (typeof e === 'string') return e;
        if (e && typeof e === 'object' && 'message' in e) {
          return String((e as { message: unknown }).message);
        }
        return '';
      })
      .filter(Boolean);
    if (parts.length) return parts.join(', ');
  }
  return `Error ${status}`;
}

/**
 * Options for making HTTP requests.
 */
export interface HttpRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export interface HttpResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

/**
 * Interface abstracting the HTTP client (DIP).
 */
export interface IHttpClient {
  baseURL: string;
  get<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
  post<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  put<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  patch<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  download(url: string, headers?: Record<string, string>): Promise<Blob>;
}

import type { LogService } from "../LogService";

/**
 * Fetch-based concrete implementation of the HTTP client (SRP).
 */
export class FetchHttpClient implements IHttpClient {
  baseURL: string;
  private logger?: LogService;
  private apiKey?: string;

  constructor(baseURL: string = '', logger?: LogService, apiKey?: string) {
    this.baseURL = baseURL;
    this.logger = logger;
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<HttpResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Inject API Key if present
    if (this.apiKey) {
      options.headers = {
        ...options.headers,
        'x-api-key': this.apiKey
      };
    }

    // Default credentials if not specified (more CORS friendly)
    if (!options.credentials) {
      options.credentials = 'same-origin';
    }

    try {
      const response = await fetch(url, options);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const responseData = isJson ? await response.json() : null;

      if (!response.ok) {
        // ── Auto-logout on 401/403 (except known business-logic codes) ──
        const isAuthError = response.status === 401
          || (response.status === 403 && !responseData?.code?.startsWith?.('BUSINESS_'));
        if (isAuthError && !endpoint.includes('/auth/login')) {
          localStorage.removeItem('kiora_token');
          localStorage.removeItem('kiora_user');
          window.location.href = '/login/';
          return {
            data: null,
            error: 'Sesión expirada. Redirigiendo al login...',
            status: response.status,
            ok: false,
          };
        }

        const errorMsg = errorMessageFromResponseBody(responseData, response.status);
        this.logger?.error(`API Error: ${response.status} on ${endpoint}`, {
          status: response.status,
          endpoint,
          responseData
        });
        return {
          data: null,
          error: errorMsg,
          status: response.status,
          ok: false,
        };
      }

      return {
        data: responseData as T,
        error: null,
        status: response.status,
        ok: true,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger?.error(`Network Error on ${endpoint}`, { 
        endpoint, 
        message: err.message,
        stack: err.stack 
      });
      return {
        data: null,
        error: err.message || 'Error de conexión',
        status: 0,
        ok: false,
      };
    }
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  async post<T>(url: string, body?: unknown, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const { headers, ...rest } = options;
    const isFormData = body instanceof FormData;
    const finalHeaders: Record<string, string> = { ...headers };
    if (!isFormData) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    return this.request<T>(url, {
      method: 'POST',
      headers: finalHeaders,
      body: isFormData ? (body as any) : (body ? JSON.stringify(body) : undefined),
      ...rest,
    });
  }

  async put<T>(url: string, body?: unknown, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const { headers, ...rest } = options;
    const isFormData = body instanceof FormData;
    const finalHeaders: Record<string, string> = { ...headers };
    if (!isFormData) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    return this.request<T>(url, {
      method: 'PUT',
      headers: finalHeaders,
      body: isFormData ? (body as any) : (body ? JSON.stringify(body) : undefined),
      ...rest,
    });
  }

  async patch<T>(url: string, body?: unknown, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const { headers, ...rest } = options;
    const isFormData = body instanceof FormData;
    const finalHeaders: Record<string, string> = { ...headers };
    if (!isFormData) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    return this.request<T>(url, {
      method: 'PATCH',
      headers: finalHeaders,
      body: isFormData ? (body as any) : (body ? JSON.stringify(body) : undefined),
      ...rest,
    });
  }

  async delete<T>(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const { headers, ...rest } = options;
    return this.request<T>(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...rest,
    });
  }
  async download(url: string, headers?: Record<string, string>): Promise<Blob> {
    const fullUrl = `${this.baseURL}${url}`;
    const reqHeaders: Record<string, string> = {
      ...headers,
      ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
    };
    const response = await fetch(fullUrl, { headers: reqHeaders, credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Error al descargar: ${response.status}`);
    return response.blob();
  }
}
