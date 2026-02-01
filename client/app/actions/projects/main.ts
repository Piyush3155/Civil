"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:7008";

export async function fetchProjects() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
}

/**
 * Fetch only projects assigned to the current user
 * Used for roles like LABOUR, CONTRACTOR, CLIENT that should only see their assigned projects
 */
export async function fetchMyProjects() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/my-projects`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch my projects");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching my projects:", error);
    throw error;
  }
}

export async function fetchProjectById(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch project");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
}

export async function createProject(data: {
  name: string;
  code: string;
  location?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create project");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    location?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update project");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

export async function deleteProject(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete project");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

export async function fetchUsers() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/users?limit=100`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function fetchRoles() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/roles`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch roles");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  roleId: string
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ userId, roleId }),
    });

    if (!response.ok) {
      throw new Error("Failed to add project member");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding project member:", error);
    throw error;
  }
}

export async function fetchOwnerDashboard(projectId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/owner-dashboard`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch owner dashboard");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching owner dashboard:", error);
    throw error;
  }
}

export async function addProjectOwner(projectId: string, userId: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/owners`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to add project owner");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding project owner:", error);
    throw error;
  }
}

export async function updateProjectProgress(projectId: string, progress: number, nextMilestone?: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ progress, nextMilestone }),
    });

    if (!response.ok) {
      throw new Error("Failed to update project progress");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating project progress:", error);
    throw error;
  }
}

/**
 * Send a notification to all contractors associated with a project
 * @param projectId - The project ID
 * @param title - Notification title
 * @param message - Notification message body
 */
export async function notifyProjectContractors(
  projectId: string,
  title: string,
  message: string
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/notify-contractors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ title, message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send notification");
    }

    return await response.json();
  } catch (error) {
    console.error("Error notifying contractors:", error);
    throw error;
  }
}
