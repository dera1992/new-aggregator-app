import { clearToken, getToken } from '@/lib/auth/token';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

if (!baseUrl) {
  console.warn('NEXT_PUBLIC_API_URL is not set.');
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  let data: unknown = null;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    let message = response.statusText;
    if (typeof data === 'object' && data) {
      if ('message' in data) {
        message = String((data as { message: string }).message);
      } else if ('errors' in data && Array.isArray((data as { errors: unknown }).errors)) {
        const errors = (data as { errors: Array<{ msg?: string }> }).errors
          .map((error) => error.msg)
          .filter(Boolean);
        if (errors.length) {
          message = errors.join(' ');
        }
      }
    }

    if (response.status === 401 || response.status === 403) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  return handleResponse<T>(response);
}
