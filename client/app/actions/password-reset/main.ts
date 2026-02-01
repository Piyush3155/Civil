'use server';

import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ironSessionOptions } from '../../../lib/sessionLib';

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

// Request password reset (public - for login page)
export async function requestPasswordReset(email: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/password-reset/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to request password reset');
    }

    return await response.json();
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
}

// Get all password reset requests (admin)
export async function getPasswordResetRequests(status?: string) {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  const authToken = session.accessToken;

  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const url = status ? `${BACKEND_URL}/password-reset?status=${status}` : `${BACKEND_URL}/password-reset`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch password reset requests');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch password reset requests error:', error);
    throw error;
  }
}

// Get password reset statistics (admin)
export async function getPasswordResetStats() {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  const authToken = session.accessToken;

  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/password-reset/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch password reset stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch password reset stats error:', error);
    throw error;
  }
}

// Approve password reset request (admin)
export async function approvePasswordReset(requestId: string, newPassword: string) {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  const authToken = session.accessToken;

  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/password-reset/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve password reset');
    }

    return await response.json();
  } catch (error) {
    console.error('Approve password reset error:', error);
    throw error;
  }
}

// Reject password reset request (admin)
export async function rejectPasswordReset(requestId: string, reason?: string) {
  const session = await getIronSession<SessionData>(await cookies(), ironSessionOptions);
  const authToken = session.accessToken;

  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/password-reset/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reject password reset');
    }

    return await response.json();
  } catch (error) {
    console.error('Reject password reset error:', error);
    throw error;
  }
}
