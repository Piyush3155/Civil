'use server';

import { getSession } from '@/lib/sessionAction';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:7008';

export async function createMeasurement(data: {
  boqItemId: string;
  projectId: string;
  contractorId?: string;
  measuredQty: number;
  description?: string;
  createdBy: string;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const res = await fetch(`${BACKEND_URL}/billing/measurement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to create measurement');
  }

  return res.json();
}

export async function approveMeasurement(id: string, approvedBy: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const res = await fetch(`${BACKEND_URL}/billing/measurement/${id}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ approvedBy }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to approve measurement');
  }

  return res.json();
}

export async function getMeasurements(projectId?: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const url = projectId
    ? `${BACKEND_URL}/billing/measurement?projectId=${projectId}`
    : `${BACKEND_URL}/billing/measurement`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch measurements');
  return res.json();
}
