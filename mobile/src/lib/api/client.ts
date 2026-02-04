import axios from 'axios';

import { clearToken, getToken } from '../auth/token';
import { navigate } from '@/navigation/root-navigation';
import type { ErrorResponse } from '@/types/user';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  // eslint-disable-next-line no-console
  console.warn('EXPO_PUBLIC_API_URL is not set.');
}

export const apiClient = axios.create({
  baseURL: apiUrl,
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
    if (status === 401 || status === 403) {
      await clearToken();
      navigate('Auth');
    }
    return Promise.reject(normalizeError(error?.response?.data));
  },
);

function normalizeError(data: ErrorResponse | undefined) {
  if (!data) {
    return new Error('Something went wrong.');
  }
  if (data.message) {
    return new Error(data.message);
  }
  if (data.errors) {
    const message = Object.values(data.errors).flat().join(', ');
    return new Error(message || 'Something went wrong.');
  }
  return new Error('Something went wrong.');
}
