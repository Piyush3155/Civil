"use server"
import { getSession } from "@/lib/sessionAction";

export interface NotificationHistoryItem {
  id: number;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  targetType: 'USER' | 'MULTIPLE_USERS' | 'ROLE';
  targetIds: number[];
  successCount: number;
  failureCount: number;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'PARTIALLY_SENT';
  sentAt: string;
  createdAt: string;
  updatedAt: string;
  sentBy?: {
    id: number;
    name: string;
    username: string;
    email: string;
    role: {
      id: number;
      name: string;
    };
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

interface FetchHistoryParams {
  page?: number;
  limit?: number;
  targetType?: string;
}

/**
 * Fetch paginated notification history
 */
export async function fetchNotificationHistory(params: FetchHistoryParams = {}): Promise<PaginatedResponse<NotificationHistoryItem>> {
  const session = await getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const { page = 1, limit = 10, targetType } = params;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  if (targetType) {
    queryParams.append('targetType', targetType);
  }

  try {
    const response = await fetch(`${process.env.SERVER_API}/notifications/history?${queryParams}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch notification history");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching notification history:", error);
    throw error;
  }
}

/**
 * Fetch details for a specific notification
 */
export async function fetchNotificationDetails(id: number): Promise<NotificationHistoryItem> {
  const session = await getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${process.env.SERVER_API}/notifications/history/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch notification details");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching notification details:", error);
    throw error;
  }
}

/**
 * Fetch notification system statistics
 */
export interface NotificationStats {
  totalNotifications: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  deliveryRate: number;
}

export async function fetchNotificationStats(): Promise<NotificationStats> {
  const session = await getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${process.env.SERVER_API}/notifications/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch notification stats");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    throw error;
  }
}
