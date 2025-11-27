'use server';

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

export async function getSession(): Promise<SessionData> {
  try {
    const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);

    if (!session.isLoggedIn) {
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

export async function logout(): Promise<void> {
  try {
    const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);

    // Clear all session data
    session.isLoggedIn = false;
    session.userId = undefined;
    session.accessToken = undefined;
    session.username = undefined;
    session.name = undefined;
    session.email = undefined;
    session.roles = undefined;

    await session.save();

    // Optional: Call backend logout endpoint to invalidate server-side token
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.warn('Backend logout failed:', error);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}