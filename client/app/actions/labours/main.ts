"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

export async function fetchLabours() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/labours`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch labours");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching labours:", error);
    throw error;
  }
}

export async function fetchLabourById(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/labours/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch labour");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching labour:", error);
    throw error;
  }
}

export async function fetchLaboursByContractor(contractorId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/labours/contractor/${contractorId}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch labours");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching labours by contractor:", error);
    throw error;
  }
}

export async function createLabour(data: {
  contractorId: string;
  name: string;
  gender?: string;
  age?: number;
  skill: string;
  phone?: string;
  aadhaar?: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/labours`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create labour");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating labour:", error);
    throw error;
  }
}

export async function updateLabour(
  id: string,
  data: {
    name?: string;
    gender?: string;
    age?: number;
    skill?: string;
    phone?: string;
    aadhaar?: string;
  }
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/labours/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update labour");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating labour:", error);
    throw error;
  }
}

export async function deleteLabour(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/labours/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete labour");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting labour:", error);
    throw error;
  }
}
