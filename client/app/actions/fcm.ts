"use server"
import { getSession } from "@/lib/sessionAction";

interface FCMNotificationPayload {
  title: string;
  body: string;
  clickAction?: string; // Renamed from click_action
  data?: Record<string, string>;
}

export async function sendFCMToRole(roleId: string, payload: FCMNotificationPayload) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/fcm/send-to-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        roleId,
        title: payload.title,
        body: payload.body,
        clickAction: payload.clickAction,
        data: payload.data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send notification");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending FCM to role:", error);
    throw error;
  }
}

export async function sendFCMToUser(userId: string, payload: FCMNotificationPayload) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/fcm/send-to-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        userId,
        title: payload.title,
        body: payload.body,
        clickAction: payload.clickAction,
        data: payload.data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send notification");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending FCM to user:", error);
    throw error;
  }
}

export async function sendFCMToMultipleUsers(userIds: string[], payload: FCMNotificationPayload) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/fcm/send-to-multiple-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        userIds,
        title: payload.title,
        body: payload.body,
        clickAction: payload.clickAction,
        data: payload.data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send notification");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending FCM to multiple users:", error);
    throw error;
  }
}

export async function sendTestFCM() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/fcm/test`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send test notification");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending test FCM:", error);
    throw error;
  }
}
