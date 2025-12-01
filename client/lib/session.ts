// lib/session.ts
// Client-side utilities for auth state management
// Note: Since token is in httpOnly cookie, client can't access it directly

const AUTH_STATUS_KEY = 'auth-status';
const USER_INFO_KEY = 'user-info';
const TOKEN_KEY = 'accessToken';

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const status = localStorage.getItem(AUTH_STATUS_KEY);
  const token = localStorage.getItem(TOKEN_KEY);
  
  // If we have a token, check if it's expired
  if (token) {
    if (isTokenExpired(token)) {
      // Token expired, clear auth state
      clearUserInfo();
      return false;
    }
  }
  
  return status === 'true';
}

export function setAuthenticated(status: boolean): void {
  if (typeof window === 'undefined') return;
  if (status) {
    localStorage.setItem(AUTH_STATUS_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_STATUS_KEY);
  }
}

export function getUserInfo(): unknown | null {
  if (typeof window === 'undefined') return null;
  try {
    const info = localStorage.getItem(USER_INFO_KEY);
    return info ? JSON.parse(info) : null;
  } catch {
    return null;
  }
}

export function setUserInfo(info: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
  } catch (error) {
    console.error('Failed to set user info:', error);
  }
}

export function clearUserInfo(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem(AUTH_STATUS_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Checks if the stored access token is expired
 */
export function isTokenExpired(token?: string): boolean {
  if (typeof window === 'undefined') return true;
  
  const accessToken = token || localStorage.getItem(TOKEN_KEY);
  if (!accessToken) return true;
  
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return true;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    // Add 30 second buffer
    return payload.exp < (currentTime + 30);
  } catch {
    return true;
  }
}

/**
 * Gets time until token expiry in seconds
 * Returns -1 if token is invalid or expired
 */
export function getTokenExpiryTime(): number {
  if (typeof window === 'undefined') return -1;
  
  const accessToken = localStorage.getItem(TOKEN_KEY);
  if (!accessToken) return -1;
  
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return -1;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return -1;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  } catch {
    return -1;
  }
}

/**
 * Redirects to login page with optional redirect URL
 */
export function redirectToLogin(redirectUrl?: string): void {
  if (typeof window === 'undefined') return;
  
  clearUserInfo();
  
  const loginUrl = new URL('/login', window.location.origin);
  if (redirectUrl) {
    loginUrl.searchParams.set('redirect', redirectUrl);
  }
  
  window.location.href = loginUrl.toString();
}

/**
 * Handles auth errors - clears session and redirects to login
 */
export function handleAuthError(error?: Error): void {
  if (typeof window === 'undefined') return;
  
  console.error('Auth error:', error?.message);
  redirectToLogin(window.location.pathname);
}