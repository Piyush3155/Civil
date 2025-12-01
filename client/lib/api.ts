import { getSession, forceLogout } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

export interface ApiError {
  message: string;
  status: number;
  isAuthError: boolean;
}

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class TokenExpiredError extends Error {
  constructor(message: string = "Token expired") {
    super(message);
    this.name = "TokenExpiredError";
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new AuthenticationError("User not authenticated");
  }

  if (!session.accessToken) {
    await forceLogout();
    throw new TokenExpiredError("No access token available");
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle authentication errors
    if (response.status === 401) {
      // Token is invalid or expired - clear session
      await forceLogout();
      throw new TokenExpiredError("Session expired. Please login again.");
    }

    if (response.status === 403) {
      throw new AuthenticationError("Access denied. Insufficient permissions.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    // Re-throw auth errors as-is
    if (error instanceof AuthenticationError || error instanceof TokenExpiredError) {
      throw error;
    }

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }

    throw error;
  }
}

/**
 * Wrapper for API requests that handles auth errors gracefully
 * Returns null instead of throwing on auth errors
 */
export async function safeApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const data = await apiRequest(endpoint, options);
    return { data: data as T, error: null };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return { 
        data: null, 
        error: { message: error.message, status: 401, isAuthError: true } 
      };
    }
    if (error instanceof AuthenticationError) {
      return { 
        data: null, 
        error: { message: error.message, status: 403, isAuthError: true } 
      };
    }
    return { 
      data: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Unknown error', 
        status: 500, 
        isAuthError: false 
      } 
    };
  }
}