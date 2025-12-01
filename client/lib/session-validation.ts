// lib/session-validation.ts
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

export interface ValidationResult {
  isValid: boolean;
  session?: SessionData;
  error?: string;
  shouldRedirect?: boolean;
}

/**
 * Safely decodes a JWT token without throwing errors
 */
function safeDecodeToken(token: string): jwt.JwtPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
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
 * Checks if a token is expired with a buffer time (default 30 seconds)
 */
function isTokenExpired(exp: number | undefined, bufferSeconds: number = 30): boolean {
  if (!exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return exp < (currentTime + bufferSeconds);
}

/**
 * Clears the session data safely
 */
async function clearSession(session: Awaited<ReturnType<typeof getIronSession<SessionData>>>): Promise<void> {
  try {
    session.isLoggedIn = false;
    session.userId = undefined;
    session.accessToken = undefined;
    session.username = undefined;
    session.name = undefined;
    session.email = undefined;
    session.roles = undefined;
    await session.save();
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

export async function validateSession(): Promise<ValidationResult> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, ironSessionOptions);

    // Check if session exists and user is logged in
    if (!session || !session.isLoggedIn) {
      return { isValid: false, error: 'Not logged in', shouldRedirect: true };
    }

    // Check if access token exists
    if (!session.accessToken) {
      await clearSession(session);
      return { isValid: false, error: 'No access token', shouldRedirect: true };
    }

    // Decode and validate JWT token
    const decoded = safeDecodeToken(session.accessToken);

    if (!decoded) {
      await clearSession(session);
      return { isValid: false, error: 'Invalid token format', shouldRedirect: true };
    }

    // Check if token is expired (with 30 second buffer)
    if (isTokenExpired(decoded.exp)) {
      await clearSession(session);
      return { isValid: false, error: 'Token expired', shouldRedirect: true };
    }

    // Token is valid
    return { 
      isValid: true, 
      session: {
        isLoggedIn: session.isLoggedIn,
        userId: session.userId,
        accessToken: session.accessToken,
        username: session.username,
        name: session.name,
        email: session.email,
        roles: session.roles,
      },
      shouldRedirect: false 
    };
  } catch (error) {
    console.error('Session validation error:', error);
    // On error, don't crash - just indicate invalid session
    return { isValid: false, error: 'Session error', shouldRedirect: true };
  }
}

/**
 * Quick check if token is still valid without full session validation
 * Use this for lightweight checks
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const result = await validateSession();
    return result.isValid;
  } catch {
    return false;
  }
}

/**
 * Gets the access token if valid, returns null otherwise
 */
export async function getValidAccessToken(): Promise<string | null> {
  try {
    const result = await validateSession();
    if (result.isValid && result.session?.accessToken) {
      return result.session.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Attempts to refresh the token if it's about to expire
 * Returns true if refresh was successful or not needed
 */
export async function refreshTokenIfNeeded(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, ironSessionOptions);

    if (!session.accessToken) {
      return false;
    }

    const decoded = safeDecodeToken(session.accessToken);
    if (!decoded || !decoded.exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    const timeUntilExpiry = decoded.exp - currentTime;

    // If token is already expired, don't try to refresh
    if (timeUntilExpiry <= 0) {
      await clearSession(session);
      return false;
    }

    // Refresh if token expires within 5 minutes
    if (timeUntilExpiry < fiveMinutes) {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const newToken = data.access_token;

          if (newToken) {
            // Verify the new token is valid before saving
            const newDecoded = safeDecodeToken(newToken);
            if (newDecoded && newDecoded.exp && !isTokenExpired(newDecoded.exp)) {
              session.accessToken = newToken;
              await session.save();
              return true;
            }
          }
        }

        // If refresh failed and token is expired, clear session
        if (isTokenExpired(decoded.exp)) {
          await clearSession(session);
        }

        return false;
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh failed and token is expired, clear session
        if (isTokenExpired(decoded.exp)) {
          await clearSession(session);
        }
        return false;
      }
    }

    // Token doesn't need refresh yet
    return true;
  } catch (error) {
    console.error('Token refresh check error:', error);
    return false;
  }
}