'use server';

import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

interface SessionData {
  isLoggedIn: boolean;
  userId?: string;
  accessToken?: string;
  username?: string;
}

export async function getSession(): Promise<SessionData> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { isLoggedIn: false };
    }

    // Decode JWT token (without verification for client-side)
    const decoded = jwt.decode(token) as any;

    if (!decoded || !decoded.sub) {
      return { isLoggedIn: false };
    }

    return {
      isLoggedIn: true,
      userId: decoded.sub,
      accessToken: token,
      username: decoded.username,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return { isLoggedIn: false };
  }
}