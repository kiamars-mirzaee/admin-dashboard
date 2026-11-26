export interface HttpRequestConfig extends RequestInit {
  url: string;
  timeoutMs?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
  headers: Headers;
}

export class HttpClientError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'HttpClientError';
    this.status = status;
    this.payload = payload;
  }
}

type RequestInterceptor = (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>;
type ResponseInterceptor = (res: HttpResponse) => HttpResponse | Promise<HttpResponse>;
type ErrorInterceptor = (err: HttpClientError) => unknown;

export function createHttpClient(baseUrl = '') {
  const requestInterceptors: RequestInterceptor[] = [];
  const responseInterceptors: ResponseInterceptor[] = [];
  const errorInterceptors: ErrorInterceptor[] = [];

  async function request<T = unknown>(inputConfig: HttpRequestConfig): Promise<HttpResponse<T>> {
    let config: HttpRequestConfig = {
      timeoutMs: 12000,
      ...inputConfig,
      headers: {
        'Content-Type': 'application/json',
        ...(inputConfig.headers ?? {}),
      },
    };

    for (const interceptor of requestInterceptors) {
      config = await interceptor(config);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 12000);

    try {
      const targetUrl = config.url.startsWith('http') ? config.url : `${baseUrl}${config.url}`;
      const raw = await fetch(targetUrl, {
        ...config,
        signal: config.signal ?? controller.signal,
      });

      const contentType = raw.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json')
        ? await raw.json().catch(() => null)
        : await raw.text().catch(() => null);

      if (!raw.ok) {
        throw new HttpClientError(
          (data && typeof data === 'object' && 'error' in data
            ? String((data as { error: unknown }).error)
            : raw.statusText) || `HTTP ${raw.status}`,
          raw.status,
          data
        );
      }

      let response: HttpResponse<T> = {
        status: raw.status,
        ok: raw.ok,
        data: data as T,
        headers: raw.headers,
      };

      for (const interceptor of responseInterceptors) {
        response = (await interceptor(response)) as HttpResponse<T>;
      }

      return response;
    } catch (err) {
      const normalized =
        err instanceof HttpClientError
          ? err
          : new HttpClientError(
              err instanceof Error ? err.message : 'Network error',
              0
            );
      for (const errHandler of errorInterceptors) {
        await errHandler(normalized);
      }
      throw normalized;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    request,
    get: <T = unknown>(url: string, init?: Omit<HttpRequestConfig, 'url' | 'method'>) =>
      request<T>({ ...init, url, method: 'GET' }),
    post: <T = unknown>(url: string, body?: unknown, init?: Omit<HttpRequestConfig, 'url' | 'method' | 'body'>) =>
      request<T>({ ...init, url, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
    patch: <T = unknown>(url: string, body?: unknown, init?: Omit<HttpRequestConfig, 'url' | 'method' | 'body'>) =>
      request<T>({ ...init, url, method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
    delete: <T = unknown>(url: string, init?: Omit<HttpRequestConfig, 'url' | 'method'>) =>
      request<T>({ ...init, url, method: 'DELETE' }),
    interceptors: {
      request: {
        use: (fn: RequestInterceptor) => {
          requestInterceptors.push(fn);
        },
      },
      response: {
        use: (fn: ResponseInterceptor, onError?: ErrorInterceptor) => {
          responseInterceptors.push(fn);
          if (onError) errorInterceptors.push(onError);
        },
      },
    },
  };
}

export const httpClient = createHttpClient('');
