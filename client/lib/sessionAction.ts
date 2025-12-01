'use server';

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
 * Checks if a token is expired
 */
function isTokenExpired(token: string): boolean {
  const decoded = safeDecodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Clears the session data safely
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

export async function getSession(): Promise<SessionData> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, ironSessionOptions);

    if (!session.isLoggedIn) {
      return { isLoggedIn: false };
    }

    // Check if token exists and is valid
    if (!session.accessToken) {
      await clearSessionData(session);
      return { isLoggedIn: false };
    }

    // Check if token is expired
    if (isTokenExpired(session.accessToken)) {
      console.log('Session token expired, clearing session');
      await clearSessionData(session);
      return { isLoggedIn: false };
    }

    return {
      isLoggedIn: session.isLoggedIn,
      userId: session.userId,
      accessToken: session.accessToken,
      username: session.username,
      name: session.name,
      email: session.email,
      roles: session.roles,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return { isLoggedIn: false };
  }
}

/**
 * Gets session with validation - throws if invalid
 * Use this when you need to ensure user is authenticated
 */
export async function getValidSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error('Session invalid or expired');
  }
  return session;
}

export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, ironSessionOptions);

    // Store token before clearing for backend logout
    const accessToken = session.accessToken;

    // Clear all session data
    await clearSessionData(session);

    // Optional: Call backend logout endpoint to invalidate server-side token
    if (accessToken) {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (error) {
        console.warn('Backend logout failed (non-critical):', error);
      }
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Force clears the session - use when token is definitely invalid
 */
export async function forceLogout(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, ironSessionOptions);
    await clearSessionData(session);
  } catch (error) {
    console.error('Force logout error:', error);
  }
}