// lib/secure-api.ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { ironSessionOptions } from './sessionLib';
import * as jwt from 'jsonwebtoken';

interface SessionData {
  isLoggedIn: boolean;
  userId?: string;
  accessToken?: string;
  username?: string;
  name?: string;
  email?: string;
  roles?: string[];
}

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  isAuthError?: boolean;
}

/**
 * Safely decodes a JWT token
 */
function safeDecodeToken(token: string): jwt.JwtPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === 'object') {
      return decoded as jwt.JwtPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a token is expired
 */
function isTokenExpired(token: string): boolean {
  const decoded = safeDecodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Clears session data
 */
async function clearSessionData(session: Awaited<ReturnType<typeof getIronSession<SessionData>>>): Promise<void> {
  session.isLoggedIn = false;
  session.userId = undefined;
  session.accessToken = undefined;
  session.username = undefined;
  session.name = undefined;
  session.email = undefined;
  session.roles = undefined;
  await session.save();
}

class SecureApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getSession(): Promise<Awaited<ReturnType<typeof getIronSession<SessionData>>> | null> {
    try {
      const cookieStore = await cookies();
      const session = await getIronSession<SessionData>(cookieStore, ironSessionOptions);
      return session;
    } catch (error) {
      console.error('Session retrieval error:', error);
      return null;
    }
  }

  private async validateAndGetToken(): Promise<{ token: string; session: Awaited<ReturnType<typeof getIronSession<SessionData>>> } | null> {
    const session = await this.getSession();
    
    if (!session || !session.isLoggedIn || !session.accessToken) {
      return null;
    }

    // Check if token is expired
    if (isTokenExpired(session.accessToken)) {
      console.log('Token expired, clearing session');
      await clearSessionData(session);
      return null;
    }

    return { token: session.accessToken, session };
  }

  private async getAuthHeaders(): Promise<Record<string, string> | null> {
    const result = await this.validateAndGetToken();
    
    if (!result) {
      return null;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      'Authorization': `Bearer ${result.token}`,
      'X-Timestamp': Date.now().toString(),
    };

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status;

    // Handle token expiration
    if (status === 401) {
      // Clear session on auth failure
      const session = await this.getSession();
      if (session) {
        await clearSessionData(session);
      }

      return {
        error: 'Session expired. Please login again.',
        status: 401,
        isAuthError: true
      };
    }

    // Handle forbidden
    if (status === 403) {
      return {
        error: 'Access denied. Insufficient permissions.',
        status: 403,
        isAuthError: true
      };
    }

    // Handle rate limiting
    if (status === 429) {
      return {
        error: 'Too many requests. Please try again later.',
        status: 429
      };
    }

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return {
          data: data as T,
          status
        };
      } else {
        const text = await response.text();
        return {
          data: text as unknown as T,
          status
        };
      }
    } catch {
      return {
        error: 'Invalid response format',
        status
      };
    }
  }

  private async makeRequest<T>(method: string, endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      if (!headers) {
        return {
          error: 'Authentication required',
          status: 401,
          isAuthError: true
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);

      clearTimeout(timeoutId);

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API ${method} error:`, error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: 'Request timeout',
          status: 0
        };
      }
      
      return {
        error: 'Network error',
        status: 0
      };
    }
  }

  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('GET', endpoint);
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('POST', endpoint, data);
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', endpoint, data);
  }

  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PATCH', endpoint, data);
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('DELETE', endpoint);
  }
}

// Create and export a singleton instance
export const secureApiClient = new SecureApiClient(
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
);

// Utility function to check if user has required role
export async function hasRole(requiredRole: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, ironSessionOptions);
    
    if (!session.isLoggedIn || !session.accessToken) {
      return false;
    }
    
    // Check if token is expired
    if (isTokenExpired(session.accessToken)) {
      await clearSessionData(session);
      return false;
    }
    
    return session.roles?.includes(requiredRole) || false;
  } catch {
    return false;
  }
}

// Utility function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, ironSessionOptions);
    
    if (!session.isLoggedIn || !session.accessToken) {
      return false;
    }
    
    // Check if token is expired
    if (isTokenExpired(session.accessToken)) {
      await clearSessionData(session);
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}