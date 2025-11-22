// lib/session.ts
// Note: Since token is in httpOnly cookie, client can't access it directly
// This file provides utilities for auth state management

export function isAuthenticated(): boolean {
  // Since we can't read the cookie, assume authenticated if not redirected by middleware
  // In a real app, you might have a separate non-httpOnly cookie for auth status
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth-status');
}

export function setAuthenticated(status: boolean): void {
  if (typeof window === 'undefined') return;
  if (status) {
    localStorage.setItem('auth-status', 'true');
  } else {
    localStorage.removeItem('auth-status');
  }
}

// Optional: store user info separately
export function getUserInfo(): unknown | null {
  if (typeof window === 'undefined') return null;
  const info = localStorage.getItem('user-info');
  return info ? JSON.parse(info) : null;
}

export function setUserInfo(info: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user-info', JSON.stringify(info));
}

export function clearUserInfo(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user-info');
  localStorage.removeItem('auth-status');
}