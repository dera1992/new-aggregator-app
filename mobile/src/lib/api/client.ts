import axios from 'axios';
import { Platform } from 'react-native';

import { clearToken, getToken } from '../auth/token';
import { navigate } from '@/navigation/root-navigation';
import type { ErrorResponse } from '@/types/user';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT_MS = 12000;

function resolveApiUrl(rawApiUrl: string | undefined) {
  if (!rawApiUrl) {
    return rawApiUrl;
  }

  if (Platform.OS !== 'android') {
    return rawApiUrl;
  }

  return rawApiUrl.replace('://localhost', '://10.0.2.2').replace('://127.0.0.1', '://10.0.2.2');
}

const resolvedApiUrl = resolveApiUrl(apiUrl);

if (!apiUrl) {
  // eslint-disable-next-line no-console
  console.warn('EXPO_PUBLIC_API_URL is not set.');
} else if (resolvedApiUrl !== apiUrl) {
  // eslint-disable-next-line no-console
  console.warn(`Using Android emulator API URL rewrite: ${apiUrl} -> ${resolvedApiUrl}`);
}

export const apiClient = axios.create({
  baseURL: resolvedApiUrl,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url ?? '');
    const isAuthEndpoint = requestUrl.startsWith('/api/auth/');

    if ((status === 401 || status === 403) && !isAuthEndpoint) {
      await clearToken();
      navigate('Auth');
    }

    return Promise.reject(normalizeError(error));
  },
);

function normalizeError(error: any) {
  const data = error?.response?.data as ErrorResponse | undefined;
  const message = buildFriendlyNetworkError(error);
  if (message) {
    return new Error(message);
  }

  if (!data) {
    return new Error('Something went wrong.');
  }
  if (data.message) {
    return new Error(data.message);
  }
  if (data.errors) {
    const mergedMessage = Object.values(data.errors).flat().join(', ');
    return new Error(mergedMessage || 'Something went wrong.');
  }
  return new Error('Something went wrong.');
}

function buildFriendlyNetworkError(error: any) {
  const code = error?.code;
  const hasResponse = Boolean(error?.response);
  if (hasResponse) {
    return null;
  }

  if (code === 'ECONNABORTED') {
    return `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Verify backend URL, phone/computer network, and Flask server availability.`;
  }

  if (code !== 'ERR_NETWORK') {
    return null;
  }

  if (apiUrl?.includes('localhost') || apiUrl?.includes('127.0.0.1')) {
    if (Platform.OS === 'android') {
      return 'Cannot reach API from Android emulator using localhost. Use http://10.0.2.2:<port> (or your LAN IP for Expo Go on a physical phone).';
    }
    return 'Cannot reach API from Expo Go. On a physical phone, use your computer LAN IP (example: http://192.168.x.x:8080) instead of localhost.';
  }

  return 'Cannot reach API. Check that your backend is running and EXPO_PUBLIC_API_URL points to a reachable address.';
}
