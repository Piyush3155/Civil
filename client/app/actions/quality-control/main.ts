"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:7008";

// Types for QC/NCR module
export type QCType = "QUALITY" | "SAFETY" | "DEFECT" | "REWORK";
export type NCRStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "FIXED" | "VERIFIED" | "CLOSED" | "REJECTED";
export type QCPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface QCIssue {
  id: string;
  projectId: string;
  taskId?: string;
  type: QCType;
  title: string;
  description?: string;
  priority: QCPriority;
  status: NCRStatus;
  createdBy: string;
  assignedTo?: string;
  verifiedBy?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  photos?: string[];
  location?: string;
  costImpact?: number;
  project?: {
    id: string;
    name: string;
    code: string;
  };
  task?: {
    id: string;
    title: string;
    category: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  contractor?: {
    id: string;
    name: string;
    type: string;
  };
  verifier?: {
    id: string;
    name: string;
    email: string;
  };
  closer?: {
    id: string;
    name: string;
    email: string;
  };
  updates?: QCUpdate[];
}

export interface QCUpdate {
  id: string;
  qcIssueId: string;
  updatedBy: string;
  status: NCRStatus;
  notes?: string;
  photos?: string[];
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface QCStats {
  byStatus: { status: NCRStatus; count: number }[];
  byType: { type: QCType; count: number }[];
  byPriority: { priority: QCPriority; count: number }[];
  openIssues: number;
  overdueIssues: number;
}

// Fetch all QC issues with optional filters
export async function fetchQCIssues(filters?: {
  projectId?: string;
  type?: QCType;
  status?: NCRStatus;
  priority?: QCPriority;
  assignedTo?: string;
}): Promise<QCIssue[]> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append("projectId", filters.projectId);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.assignedTo) params.append("assignedTo", filters.assignedTo);

    const url = `${BACKEND_URL}/qc${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch QC issues");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching QC issues:", error);
    throw error;
  }
}

// Fetch QC issues for a specific project
export async function fetchProjectQCIssues(projectId: string): Promise<QCIssue[]> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/project/${projectId}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch project QC issues");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching project QC issues:", error);
    throw error;
  }
}

// Fetch QC statistics for a project
export async function fetchQCStats(projectId: string): Promise<QCStats> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/project/${projectId}/stats`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch QC stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching QC stats:", error);
    throw error;
  }
}

// Fetch a single QC issue by ID
export async function fetchQCIssueById(id: string): Promise<QCIssue> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch QC issue");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching QC issue:", error);
    throw error;
  }
}

// Create a new QC issue (NCR)
export async function createQCIssue(data: {
  projectId: string;
  taskId?: string;
  type: QCType;
  title: string;
  description?: string;
  priority?: QCPriority;
  dueDate?: string;
  photos?: string[];
  location?: string;
  costImpact?: number;
}): Promise<QCIssue> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create QC issue");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating QC issue:", error);
    throw error;
  }
}

// Update a QC issue
export async function updateQCIssue(
  id: string,
  data: {
    taskId?: string;
    type?: QCType;
    title?: string;
    description?: string;
    priority?: QCPriority;
    status?: NCRStatus;
    dueDate?: string;
    photos?: string[];
    location?: string;
    costImpact?: number;
    notes?: string;
  }
): Promise<QCIssue> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update QC issue");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating QC issue:", error);
    throw error;
  }
}

// Assign contractor to QC issue
export async function assignContractor(
  id: string,
  data: {
    contractorId: string;
    dueDate?: string;
    notes?: string;
  }
): Promise<QCIssue> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/${id}/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to assign contractor");
    }

    return await response.json();
  } catch (error) {
    console.error("Error assigning contractor:", error);
    throw error;
  }
}

// Contractor updates QC issue status
export async function contractorUpdateQC(
  id: string,
  data: {
    status: "IN_PROGRESS" | "FIXED";
    notes?: string;
    photos?: string[];
  }
): Promise<QCIssue> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/${id}/contractor-update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update QC issue");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating QC issue:", error);
    throw error;
  }
}

// Engineer verifies the fix
export async function verifyQCIssue(
  id: string,
  data: {
    approved: boolean;
    notes?: string;
    photos?: string[];
  }
): Promise<QCIssue> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/${id}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to verify QC issue");
    }

    return await response.json();
  } catch (error) {
    console.error("Error verifying QC issue:", error);
    throw error;
  }
}

// PM closes the NCR
export async function closeQCIssue(
  id: string,
  data: {
    approved: boolean;
    notes?: string;
  }
): Promise<QCIssue> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/${id}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to close QC issue");
    }

    return await response.json();
  } catch (error) {
    console.error("Error closing QC issue:", error);
    throw error;
  }
}

// Reject an NCR
export async function rejectQCIssue(
  id: string,
  data: {
    notes: string;
  }
): Promise<QCIssue> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/${id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to reject QC issue");
    }

    return await response.json();
  } catch (error) {
    console.error("Error rejecting QC issue:", error);
    throw error;
  }
}

export async function deleteQCIssue(id: string): Promise<QCIssue> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/qc/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete QC issue");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting QC issue:", error);
    throw error;
  }
}
