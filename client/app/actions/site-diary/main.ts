"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

export async function createDiary(projectId: string, data: {
  date: string;
  weather?: string;
  location?: string;
  notes?: string;
  issues?: string;
  photos?: any;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/diary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create diary");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating diary:", error);
    throw error;
  }
}

export async function fetchDiariesByProject(projectId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/diary`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch diaries");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching diaries:", error);
    throw error;
  }
}

export async function fetchDiaryById(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/diary/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch diary");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching diary:", error);
    throw error;
  }
}

export async function addLabourLog(diaryId: string, data: {
  contractorId?: string;
  labourId?: string;
  count: number;
  workDone?: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/diary/${diaryId}/labour`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add labour log");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding labour log:", error);
    throw error;
  }
}

export async function addMaterialLog(diaryId: string, data: {
  materialId: string;
  quantityUsed: number;
  notes?: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/diary/${diaryId}/material`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add material log");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding material log:", error);
    throw error;
  }
}

export async function addEquipmentLog(diaryId: string, data: {
  equipmentName: string;
  hoursUsed: number;
  operatorName?: string;
  notes?: string;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/diary/${diaryId}/equipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add equipment log");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding equipment log:", error);
    throw error;
  }
}

export async function approveDiary(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/diary/${id}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to approve diary");
    }

    return await response.json();
  } catch (error) {
    console.error("Error approving diary:", error);
    throw error;
  }
}