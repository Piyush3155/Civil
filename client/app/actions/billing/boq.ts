'use server';

import { getSession } from '@/lib/sessionAction';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

export async function createBOQItem(data: {
  projectId: string;
  taskId?: string;
  name: string;
  unit: string;
  estimatedQty?: number;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const response = await fetch(`${BACKEND_URL}/billing/boq`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Failed to create BOQ item');
  }

  return response.json();
}

export async function getBOQItems(projectId?: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const url = projectId ? `${BACKEND_URL}/billing/boq?projectId=${projectId}` : `${BACKEND_URL}/billing/boq`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('Failed to fetch BOQ items');
  return response.json();
}

export async function createRateContract(data: {
  projectId: string;
  contractorId?: string;
  boqItemId: string;
  rate: number;
  unit: string;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const response = await fetch(`${BACKEND_URL}/billing/rate-contract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Failed to create rate contract');
  }

  return response.json();
}

export async function getRateContracts(projectId?: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const url = projectId
    ? `${BACKEND_URL}/billing/rate-contract?projectId=${projectId}`
    : `${BACKEND_URL}/billing/rate-contract`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('Failed to fetch rate contracts');
  return response.json();
}