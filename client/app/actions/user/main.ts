'use server';

import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

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

    // Store token in httpOnly cookie for server-side use
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Also return the token so client can store it in localStorage
    return { success: true, token };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function storeFcmToken(token: string, deviceType: string = 'WEB') {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token')?.value;

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
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token')?.value;

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