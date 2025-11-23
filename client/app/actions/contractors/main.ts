"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

export async function fetchContractors() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/contractors`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch contractors");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching contractors:", error);
    throw error;
  }
}

export async function fetchContractorById(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/contractors/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch contractor");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching contractor:", error);
    throw error;
  }
}

export async function createContractor(data: {
  name: string;
  phone?: string;
  type: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/contractors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create contractor");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating contractor:", error);
    throw error;
  }
}

export async function updateContractor(
  id: string,
  data: {
    name?: string;
    phone?: string;
    type?: string;
  }
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/contractors/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update contractor");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating contractor:", error);
    throw error;
  }
}

export async function deleteContractor(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/contractors/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete contractor");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting contractor:", error);
    throw error;
  }
}
