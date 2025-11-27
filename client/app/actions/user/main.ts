'use server';

import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ironSessionOptions } from '../../../lib/sessionLib';
import * as jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

interface SessionData {
  isLoggedIn: boolean;
  userId?: string;
  accessToken?: string;
  username?: string;
  name?: string;
  email?: string;
  roles?: string[];
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    const token = data.access_token;

    // Decode JWT to get user info
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    if (!decoded || !decoded.sub) {
      throw new Error('Invalid token');
    }

    // Set session using iron-session
    const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
    session.isLoggedIn = true;
    session.userId = decoded.sub as string;
    session.accessToken = token;
    session.username = decoded.username as string;
    session.name = decoded.name as string;
    session.email = decoded.email as string;
    session.roles = decoded.roles as string[] || [];
    await session.save();

    // Also return the token so client can store it in localStorage if needed
    return { success: true, token };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function storeFcmToken(token: string, deviceType: string = 'WEB') {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  const authToken = session.accessToken;

  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/users/store-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token, deviceType }),
    });

    if (!response.ok) {
      throw new Error('Failed to store FCM token');
    }

    return { success: true };
  } catch (error) {
    console.error('Store FCM token error:', error);
    throw error;
  }
}

export async function sendTestFcm() {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  const authToken = session.accessToken;

  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/fcm/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send test FCM');
    }

    return await response.json();
  } catch (error) {
    console.error('Test FCM error:', error);
    throw error;
  }
}

export async function fetchUsers() {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  const authToken = session.accessToken;

  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch users error:', error);
    throw error;
  }
}