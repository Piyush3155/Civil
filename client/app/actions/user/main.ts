'use server';

import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ironSessionOptions } from '../../../lib/sessionLib';
import * as jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:7008';

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

export async function getCurrentUserProfile() {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await response.json();
    
    return {
      id: profile.id || session.userId,
      name: profile.name || session.name || '',
      username: profile.username || session.username || '',
      email: profile.email || session.email || '',
      phone: profile.phone || '',
      isAdmin: profile.isAdmin || false,
      roles: session.roles || [],
      createdAt: profile.createdAt,
    };
  } catch (error) {
    console.error('Fetch profile error:', error);
    // Return session data as fallback
    return {
      id: session.userId || '',
      name: session.name || '',
      username: session.username || '',
      email: session.email || '',
      phone: '',
      isAdmin: false,
      roles: session.roles || [],
    };
  }
}

export async function createUser(userData: {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}) {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  const authToken = session.accessToken;

  if (!authToken) {
    throw new Error('Not authenticated');
  }

  // Check if user has permission (PROJECT_MANAGER or admin)
  const isAdmin = session.roles?.includes('PROJECT_MANAGER') || 
                  session.roles?.includes('ADMIN') ||
                  session.roles?.some(r => r.toLowerCase() === 'admin');

  if (!isAdmin) {
    throw new Error('You do not have permission to create users');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user');
    }

    return await response.json();
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

export async function checkUserPermissions() {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  
  if (!session.isLoggedIn) {
    return { canManageUsers: false, isAdmin: false, roles: [] };
  }

  const roles = session.roles || [];
  const isAdmin = roles.includes('PROJECT_MANAGER') || 
                  roles.includes('ADMIN') ||
                  roles.some(r => r.toLowerCase() === 'admin');

  return {
    canManageUsers: isAdmin,
    isAdmin,
    roles,
  };
}
