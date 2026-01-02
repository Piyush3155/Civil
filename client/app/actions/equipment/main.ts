"use server";

import { getSession } from "@/lib/sessionAction";
import { CreateEquipmentData } from "@/types/equipment";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

export async function fetchEquipments(projectId?: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const url = projectId
      ? `${BACKEND_URL}/equipment?projectId=${projectId}`
      : `${BACKEND_URL}/equipment`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch equipment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching equipment:", error);
    throw error;
  }
}

export async function fetchEquipmentById(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/equipment/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch equipment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching equipment:", error);
    throw error;
  }
}

export async function createEquipment(data: CreateEquipmentData & { projectId?: string }) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const payload = {
      ...data,
      createdById: session.userId,
      purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : undefined,
      rentalRate: data.rentalRate ? parseFloat(data.rentalRate) : undefined,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
    };

    const response = await fetch(`${BACKEND_URL}/equipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create equipment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating equipment:", error);
    throw error;
  }
}

export async function updateEquipment(id: string, data: Partial<CreateEquipmentData>) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const payload = {
      ...data,
      purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : undefined,
      rentalRate: data.rentalRate ? parseFloat(data.rentalRate) : undefined,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate!) : undefined,
    };

    const response = await fetch(`${BACKEND_URL}/equipment/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update equipment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating equipment:", error);
    throw error;
  }
}

export async function deleteEquipment(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/equipment/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete equipment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting equipment:", error);
    throw error;
  }
}