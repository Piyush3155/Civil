"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

export async function fetchEstimates() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/estimation`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch estimates");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching estimates:", error);
    throw error;
  }
}

export async function fetchEstimateById(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/estimation/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch estimate");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching estimate:", error);
    throw error;
  }
}

export async function createEstimate(data: {
  title: string;
  projectId: string;
  description?: string;
  type?: string;
  status?: string;
  overheadPercentage?: number;
  profitPercentage?: number;
  contingencyPercentage?: number;
}) {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/estimation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        ...data,
        createdBy: session.userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create estimate");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating estimate:", error);
    throw error;
  }
}

export async function createEstimateSection(data: {
  name: string;
  order: number;
  estimateId: string;
  category?: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/estimation/section`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create section");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating section:", error);
    throw error;
  }
}

export async function createEstimateItem(data: {
  description: string;
  unit: string;
  quantity: number;
  estimateId: string;
  sectionId?: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/estimation/item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create item");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating item:", error);
    throw error;
  }
}

export async function createEstimateComponent(data: {
  type: "MATERIAL" | "LABOUR" | "EQUIPMENT" | "OVERHEAD";
  name: string;
  unit: string;
  quantity: number;
  rate: number;
  itemId: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/estimation/component`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create component");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating component:", error);
    throw error;
  }
}

export async function downloadEstimatePdf(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/estimation/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download PDF");
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
}