// hooks/use-auth.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  isAuthenticated, 
  isTokenExpired, 
  clearUserInfo, 
  getTokenExpiryTime,
  redirectToLogin 
} from '@/lib/session';

interface UseAuthOptions {
  redirectOnExpiry?: boolean;
  checkInterval?: number; // in milliseconds
}

interface UseAuthReturn {
  isLoggedIn: boolean;
  isLoading: boolean;
  checkAuth: () => boolean;
  logout: () => void;
  handleAuthError: (error?: Error) => void;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { 
    redirectOnExpiry = true, 
    checkInterval = 60000 // Check every minute by default
  } = options;
  
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Initialize with actual auth status on client
    if (typeof window !== 'undefined') {
      return isAuthenticated();
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback((): boolean => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);
    return authenticated;
  }, []);

  const logout = useCallback(() => {
    clearUserInfo();
    setIsLoggedIn(false);
    router.push('/login');
  }, [router]);

  const handleAuthError = useCallback((error?: Error) => {
    console.error('Auth error:', error?.message);
    clearUserInfo();
    setIsLoggedIn(false);
    
    if (redirectOnExpiry) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      redirectToLogin(currentPath);
    }
  }, [redirectOnExpiry]);

  // Initial auth check - runs once on mount
  useEffect(() => {
    // Use a microtask to avoid synchronous setState warning
    queueMicrotask(() => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      setIsLoading(false);

      if (!authenticated && redirectOnExpiry) {
        // Don't redirect if we're already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          redirectToLogin(window.location.pathname);
        }
      }
    });
  }, [redirectOnExpiry]);

  // Periodic token expiry check
  useEffect(() => {
    if (!checkInterval || checkInterval <= 0) return;

    const intervalId = setInterval(() => {
      const expiryTime = getTokenExpiryTime();
      
      // If token expires in less than 2 minutes, show warning or redirect
      if (expiryTime >= 0 && expiryTime < 120) {
        console.log(`Token expires in ${expiryTime} seconds`);
        
        if (expiryTime <= 0) {
          handleAuthError(new Error('Token expired'));
        }
      }
      
      // Also check if token is actually expired
      if (isTokenExpired()) {
        handleAuthError(new Error('Token expired'));
      }
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [checkInterval, handleAuthError]);

  // Listen for storage changes (e.g., logout in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'auth-status') {
        checkAuth();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [checkAuth]);

  return {
    isLoggedIn,
    isLoading,
    checkAuth,
    logout,
    handleAuthError,
  };
}

/**
 * Hook that checks auth status and redirects if not authenticated
 * Use this in protected pages/components
 */
export function useRequireAuth(): UseAuthReturn {
  return useAuth({ redirectOnExpiry: true, checkInterval: 30000 });
}

/**
 * Utility to wrap async operations with auth error handling
 */
export function withAuthErrorHandling<T>(
  operation: () => Promise<T>,
  onAuthError: () => void
): Promise<T> {
  return operation().catch((error) => {
    if (
      error?.message?.toLowerCase().includes('auth') ||
      error?.message?.toLowerCase().includes('token') ||
      error?.message?.toLowerCase().includes('expired') ||
      error?.message?.toLowerCase().includes('unauthorized')
    ) {
      onAuthError();
    }
    throw error;
  });
}
