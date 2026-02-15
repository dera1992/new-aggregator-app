import type { AuthResponse, MessageResponse } from '@/types/user';

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://169b-80-3-126-18.ngrok-free.app';

function pickTokenField(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const tokenFields = [candidate.token, candidate.access_token, candidate.authToken];

  for (const field of tokenFields) {
    if (typeof field === 'string' && field.trim().length > 0) {
      return field;
    }
  }

  return null;
}

function extractAuthToken(payload: unknown): string | null {
  return pickTokenField(payload) ??
    pickTokenField((payload as Record<string, unknown> | undefined)?.data) ??
    pickTokenField((payload as Record<string, unknown> | undefined)?.result);
}

const LOGIN_REQUEST_TIMEOUT_MS = 12000;

// Use XMLHttpRequest instead of fetch
function xhrRequest(url: string, method: string, data: any, timeout: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.timeout = timeout;

    // Add ALL possible event listeners to see what fires
    xhr.onloadstart = function() {
      console.log('📡 XHR loadstart');
    };

    xhr.onprogress = function(e) {
      console.log('📡 XHR progress:', e.loaded, '/', e.total);
    };

    xhr.onloadend = function() {
      console.log('📡 XHR loadend - readyState:', xhr.readyState, 'status:', xhr.status);
    };

    xhr.onreadystatechange = function() {
      console.log('📡 XHR readyState changed:', xhr.readyState);
      // 0: UNSENT, 1: OPENED, 2: HEADERS_RECEIVED, 3: LOADING, 4: DONE
      if (xhr.readyState === 2) {
        console.log('📡 Headers received');
      }
      if (xhr.readyState === 3) {
        console.log('📡 Loading response...');
      }
      if (xhr.readyState === 4) {
        console.log('📡 Response complete');
      }
    };

    xhr.onload = function() {
      console.log('✅ XHR onload triggered');
      console.log('✅ Status:', xhr.status);
      console.log('✅ Response length:', xhr.responseText?.length);
      console.log('✅ Response:', xhr.responseText?.substring(0, 200));

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (err) {
          console.error('❌ JSON parse error:', err);
          reject(new Error('Failed to parse response'));
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = function() {
      console.error('❌ XHR onerror triggered');
      console.error('❌ Status:', xhr.status);
      console.error('❌ ReadyState:', xhr.readyState);
      reject(new Error('Network request failed'));
    };

    xhr.ontimeout = function() {
      console.error('❌ XHR timeout after', timeout, 'ms');
      reject(new Error('Request timed out'));
    };

    console.log('🔵 Opening XHR:', method, url);
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    console.log('🔵 Sending XHR with data:', JSON.stringify(data));
    xhr.send(JSON.stringify(data));
  });
}

export async function login(payload: { email: string; password: string }) {
  console.log('🔵 Using XMLHttpRequest');
  console.log('🔵 URL:', `${apiUrl}/api/auth/login`);

  try {
    const data = await xhrRequest(
      `${apiUrl}/api/auth/login`,
      'POST',
      payload,
      LOGIN_REQUEST_TIMEOUT_MS
    );

    console.log('✅ XHR request completed');

    const token = extractAuthToken(data);
    if (!token) {
      throw new Error('Login succeeded but no auth token was returned by the API response. Check backend JSON shape for token/access_token/authToken.');
    }

    return { ...data, token };
  } catch (err) {
    console.error('❌ Login error:', err);
    throw err;
  }
}

export async function register(payload: { email: string; password: string; name?: string }) {
  const data = await xhrRequest(
    `${apiUrl}/api/auth/register`,
    'POST',
    payload,
    LOGIN_REQUEST_TIMEOUT_MS
  );
  return data;
}

export async function confirmEmail(payload: { email: string; token: string }) {
  const data = await xhrRequest(
    `${apiUrl}/api/auth/confirm`,
    'POST',
    payload,
    LOGIN_REQUEST_TIMEOUT_MS
  );
  return data;
}

export async function resendConfirmation(payload: { email: string }) {
  const data = await xhrRequest(
    `${apiUrl}/api/auth/resend-confirmation`,
    'POST',
    payload,
    LOGIN_REQUEST_TIMEOUT_MS
  );
  return data;
}

export async function forgotPassword(payload: { email: string }) {
  const data = await xhrRequest(
    `${apiUrl}/api/auth/forgot-password`,
    'POST',
    payload,
    LOGIN_REQUEST_TIMEOUT_MS
  );
  return data;
}

export async function resetPassword(payload: { email: string; token: string; new_password: string }) {
  const data = await xhrRequest(
    `${apiUrl}/api/auth/reset-password`,
    'POST',
    payload,
    LOGIN_REQUEST_TIMEOUT_MS
  );
  return data;
}

export async function changePassword(payload: { current_password: string; new_password: string }) {
  const data = await xhrRequest(
    `${apiUrl}/api/auth/change-password`,
    'POST',
    payload,
    LOGIN_REQUEST_TIMEOUT_MS
  );
  return data;
}