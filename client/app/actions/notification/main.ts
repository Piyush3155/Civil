"use server"
import { getSession } from "@/lib/sessionAction";


interface NotificationPayload {
  title: string;
  body: string;
  type: 'single' | 'multiple' | 'squad' | 'branch' | 'category';
  clickAction?: string; // Renamed from click_action
  userId?: string;
  userIds?: string[];
  roleIds?: number[];
  branchIds?: number[];
  categoryIds?: number[];
}

export async function updateUserToken(token: string, deviceId: string, deviceType: string) {
  console.log("updateUserToken called with:", { token: token.substring(0, 20) + "...", deviceId, deviceType });

  const session = await getSession();
  console.log("Session retrieved:", { isLoggedIn: session.isLoggedIn, userId: session.userId, hasToken: !!session.accessToken });

  if (!session.isLoggedIn || !session.userId) {
    console.error("User not authenticated or no userId");
    throw new Error("User not authenticated");
  }

  if (!session.accessToken) {
    console.error("No access token in session");
    throw new Error("No access token available");
  }

  try {
    const requestBody = {
      token,
      deviceId,
      deviceType,
      userId: session.userId,
    };
    console.log("Making request to:", `${process.env.NEXT_PUBLIC_BACKEND_URL}/fcm/upsert-token`);
    console.log("Request headers:", {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.accessToken.substring(0, 20)}...`
    });
    console.log("Request body:", { ...requestBody, token: token.substring(0, 20) + "..." });

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/fcm/upsert-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response text:", errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error("Error response parsed:", errorData);
      throw new Error(errorData.message || `Failed to update FCM token (${response.status})`);
    }

    const data = await response.json();
    console.log("Success response:", data);
    return data;
  } catch (error) {
    console.error("Error updating FCM token:", error);
    throw error;
  }
}

export async function sendCustomNotification(
  title: string,
  description: string,
  type: 'single' | 'multiple' | 'squad' | 'branch' | 'category',
  singleUserCardNumber?: string,
  multipleUserCardNumbers?: string,
  link?: string,
  squads?: { label: string; value: string }[],
  branchIds?: number[],
  categoryIds?: number[],
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const payload: NotificationPayload = {
      title,
      body: description,
      type,
    };

    if (link) payload.clickAction = link;
    if (singleUserCardNumber) payload.userId = singleUserCardNumber;
    if (multipleUserCardNumbers) payload.userIds = multipleUserCardNumbers.split(',').map((id: string) => id.trim());
    if (squads) payload.roleIds = squads.map(squad => parseInt(squad.value));
    if (branchIds) payload.branchIds = branchIds;
    if (categoryIds) payload.categoryIds = categoryIds;

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send notification");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}


export async function fetchPaginatedNotifications(
  page: number = 1,
  limit: number = 10,
  type?: string,
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) params.append('targetType', type);

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/history?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch notifications");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

export async function updateNotificationStatus(notificationIds: number[]) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/mark-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update notification status");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating notification status:", error);
    throw error;
  }
}