'use server';

import { getSession } from '@/lib/sessionAction';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

export async function createBill(data: {
  projectId: string;
  contractorId: string;
  periodFrom: string;
  periodTo: string;
  createdBy: string;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const response = await fetch(`${BACKEND_URL}/billing/bill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Failed to create bill');
  }

  return response.json();
}

export async function updateBillStatus(id: string, status: string, approvedBy?: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const response = await fetch(`${BACKEND_URL}/billing/bill/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ status, approvedBy }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Failed to update bill status');
  }

  return response.json();
}

export async function getBills(projectId?: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const url = projectId ? `${BACKEND_URL}/billing/bill?projectId=${projectId}` : `${BACKEND_URL}/billing/bill`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch bills');
  }

  return response.json();
}

export async function recordPayment(data: {
  billId: string;
  amountPaid: number;
  paymentMode?: string;
  remarks?: string;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('User not authenticated');

  const response = await fetch(`${BACKEND_URL}/billing/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Failed to record payment');
  }

  return response.json();
}