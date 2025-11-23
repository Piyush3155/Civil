"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

async function getAuthToken() {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("User not authenticated");
  return session.accessToken;
}

export async function createMaterial(data: {
  name: string;
  description?: string;
  unit: string;
}) {
  const token = await getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${BACKEND_URL}/materials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to create material");
  }

  return response.json();
}

export async function fetchMaterials() {
  const token = await getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${BACKEND_URL}/materials`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to fetch materials");
  }

  return response.json();
}

export async function createMaterialDelivery(
  projectId: string,
  data: {
    materialId: string;
    contractorId?: string;
    supplierName: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    deliveryDate: string;
    challanNumber?: string;
    notes?: string;
    photos?: string[];
    qcStatus?: string;
  }
) {
  const token = await getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${BACKEND_URL}/materials/projects/${projectId}/delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to create delivery");
  }

  return response.json();
}

export async function createMaterialUsage(
  projectId: string,
  data: {
    materialId: string;
    contractorId?: string;
    labourId?: string;
    quantityUsed: number;
    usageDate: string;
    usedFor?: string;
    notes?: string;
  }
) {
  const token = await getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${BACKEND_URL}/materials/projects/${projectId}/usage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to create usage");
  }

  return response.json();
}

export async function fetchMaterialLedger(projectId: string) {
  const token = await getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${BACKEND_URL}/materials/projects/${projectId}/ledger`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to fetch ledger");
  }

  return response.json();
}