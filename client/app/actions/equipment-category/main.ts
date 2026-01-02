"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

export async function fetchEquipmentCategories() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/equipment-category`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch equipment categories");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching equipment categories:", error);
    throw error;
  }
}

export async function fetchEquipmentCategoryById(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/equipment-category/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch equipment category");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching equipment category:", error);
    throw error;
  }
}

export async function createEquipmentCategory(data: { name: string; description?: string }) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/equipment-category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create equipment category");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating equipment category:", error);
    throw error;
  }
}

export async function updateEquipmentCategory(id: string, data: { name?: string; description?: string }) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/equipment-category/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update equipment category");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating equipment category:", error);
    throw error;
  }
}

export async function deleteEquipmentCategory(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/equipment-category/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete equipment category");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting equipment category:", error);
    throw error;
  }
}