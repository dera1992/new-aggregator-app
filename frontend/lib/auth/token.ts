/**
 * Access token stored in memory only (not localStorage) to prevent XSS theft.
 * The httpOnly refresh cookie (set by backend) keeps the session alive across
 * page reloads via /api/auth/refresh.
 */

let _accessToken: string | null = null;

export function getToken(): string | null {
  return _accessToken;
}

export function setToken(token: string) {
  _accessToken = token;
}

export function clearToken() {
  _accessToken = null;
}

// Kept for any legacy references
export const TOKEN_KEY = 'access_token';
