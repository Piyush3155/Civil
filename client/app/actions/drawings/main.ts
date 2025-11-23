"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7001";

export async function fetchDrawings(projectId?: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const url = projectId
      ? `${BACKEND_URL}/drawings?projectId=${projectId}`
      : `${BACKEND_URL}/drawings`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch drawings");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching drawings:", error);
    throw error;
  }
}

export async function fetchDrawingById(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/drawings/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch drawing");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching drawing:", error);
    throw error;
  }
}

export async function fetchDrawingsByProject(projectId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/drawings/project/${projectId}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch drawings");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching drawings by project:", error);
    throw error;
  }
}

export async function createDrawing(data: {
  projectId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  version?: number;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/drawings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create drawing");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating drawing:", error);
    throw error;
  }
}

export async function updateDrawing(
  id: string,
  data: {
    title?: string;
    description?: string;
  }
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/drawings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update drawing");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating drawing:", error);
    throw error;
  }
}

export async function deleteDrawing(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/drawings/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete drawing");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting drawing:", error);
    throw error;
  }
}

export async function grantDrawingAccess(
  drawingId: string,
  roleId?: string,
  userId?: string
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/drawings/${drawingId}/access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ roleId, userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to grant drawing access");
    }

    return await response.json();
  } catch (error) {
    console.error("Error granting drawing access:", error);
    throw error;
  }
}
