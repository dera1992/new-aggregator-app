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
      const errors =
        'errors' in data && Array.isArray((data as { errors: unknown }).errors)
          ? (data as { errors: Array<{ msg?: string; loc?: Array<string | number> }> }).errors
          : [];
      const formattedErrors = errors
        .map((error) => {
          const detail = error.msg?.trim();
          if (!detail) {
            return '';
          }
          const fieldPath = Array.isArray(error.loc)
            ? error.loc.filter((part) => typeof part === 'string').join('.')
            : '';
          return fieldPath ? `${fieldPath}: ${detail}` : detail;
        })
        .filter(Boolean);

      if ('message' in data) {
        message = String((data as { message: string }).message);
        if (formattedErrors.length && message.toLowerCase().includes('invalid request payload')) {
          message = `${message} ${formattedErrors.join(' ')}`;
        }
      } else if (formattedErrors.length) {
        message = formattedErrors.join(' ');
      }
    }

    if (response.status === 401) {
      const hadToken = Boolean(getToken());
      clearToken();
      if (hadToken && typeof window !== 'undefined') {
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
