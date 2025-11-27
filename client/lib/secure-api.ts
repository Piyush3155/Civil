// lib/secure-api.ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { ironSessionOptions } from './sessionLib';

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
}

class SecureApiClient {
  private baseUrl: string;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getSession() {
    try {
      const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
      return session;
    } catch (error) {
      console.error('Session retrieval error:', error);
      return null;
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await this.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    };

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    // Add timestamp for request freshness
    headers['X-Timestamp'] = Date.now().toString();

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status;

    // Handle token expiration
    if (status === 401) {
      // Clear session on auth failure
      const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
      session.isLoggedIn = false;
      session.userId = undefined;
      session.accessToken = undefined;
      await session.save();

      return {
        error: 'Authentication required',
        status: 401
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
      const data = await response.json();
      return {
        data: data as T,
        status
      };
    } catch {
      return {
        error: 'Invalid response format',
        status
      };
    }
  }

  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        // Add timeout
        signal: AbortSignal.timeout(30000), // 30 seconds
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API GET error:', error);
      return {
        error: 'Network error',
        status: 0
      };
    }
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(30000),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API POST error:', error);
      return {
        error: 'Network error',
        status: 0
      };
    }
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(30000),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API PUT error:', error);
      return {
        error: 'Network error',
        status: 0
      };
    }
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
        signal: AbortSignal.timeout(30000),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API DELETE error:', error);
      return {
        error: 'Network error',
        status: 0
      };
    }
  }
}

// Create and export a singleton instance
export const secureApiClient = new SecureApiClient(
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
);

// Utility function to check if user has required role
export async function hasRole(requiredRole: string): Promise<boolean> {
  try {
    const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
    return session.roles?.includes(requiredRole) || false;
  } catch {
    return false;
  }
}

// Utility function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
    return session.isLoggedIn || false;
  } catch {
    return false;
  }
}