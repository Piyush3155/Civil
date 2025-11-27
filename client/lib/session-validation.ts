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

export async function validateSession(): Promise<{
  isValid: boolean;
  session?: SessionData;
  error?: string;
}> {
  try {
    const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);

    if (!session.isLoggedIn) {
      return { isValid: false, error: 'Not logged in' };
    }

    if (!session.accessToken) {
      return { isValid: false, error: 'No access token' };
    }

    // Validate JWT token (without verification for client-side)
    try {
      const decoded = jwt.decode(session.accessToken) as jwt.JwtPayload;

      if (!decoded || !decoded.exp) {
        return { isValid: false, error: 'Invalid token format' };
      }

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        // Token expired, clear session
        session.isLoggedIn = false;
        session.userId = undefined;
        session.accessToken = undefined;
        await session.save();

        return { isValid: false, error: 'Token expired' };
      }

      return { isValid: true, session };
    } catch (jwtError) {
      console.error('JWT validation error:', jwtError);
      return { isValid: false, error: 'Invalid token' };
    }
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, error: 'Session error' };
  }
}

export async function refreshTokenIfNeeded(): Promise<boolean> {
  try {
    const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);

    if (!session.accessToken) {
      return false;
    }

    const decoded = jwt.decode(session.accessToken) as jwt.JwtPayload;
    if (!decoded || !decoded.exp) {
      return false;
    }

    // Refresh if token expires within 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;

    if (decoded.exp - currentTime < fiveMinutes) {
      // Attempt to refresh token
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

      try {
        const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const newToken = data.access_token;

          // Update session with new token
          session.accessToken = newToken;
          await session.save();

          return true;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }

    return false;
  } catch (error) {
    console.error('Token refresh check error:', error);
    return false;
  }
}