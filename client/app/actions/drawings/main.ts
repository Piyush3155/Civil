"use server";

import { getSession } from "@/lib/sessionAction";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:7008';


export async function uploadDrawingAttachment(formData: FormData): Promise<{ success: boolean; data?: { attachmentUrls: string[] }; message?: string; error?: string }> {
  try {
    console.log("Upload function called")
    const session = await getSession();
    const accessToken = session.accessToken;
    const userId = session.userId;

    console.log("Session data:", { userId: !!userId, accessToken: !!accessToken })

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!accessToken) {
      return { success: false, error: 'No access token' };
    }

    const cdnUrl = `${process.env.CDN_API || process.env.NEXT_PUBLIC_CDN_URL}/drawings/attachments`
    console.log("CDN URL:", cdnUrl)

    // Upload files to CDN
    const cdnResponse = await fetch(cdnUrl, {
      method: 'POST',
      body: formData,
    });

    console.log("CDN response status:", cdnResponse.status)
    console.log("CDN response headers:", Object.fromEntries(cdnResponse.headers.entries()))

    let cdnResult: any = {};
    try {
      const responseText = await cdnResponse.text()
      console.log("CDN response text:", responseText)
      cdnResult = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse CDN response:', e);
    }

    console.log("Parsed CDN result:", cdnResult)

    if (!cdnResponse.ok) {
      return { success: false, error: cdnResult.message || 'Failed to upload file' };
    }

    // Expecting cdnResult.data.attachmentUrls
    const uploadedUrls: string[] = cdnResult?.data?.attachmentUrls || cdnResult?.attachmentUrls || [];

    console.log("Uploaded URLs:", uploadedUrls)

    if (!uploadedUrls || uploadedUrls.length === 0) {
      return { success: false, error: 'No URLs returned from CDN' };
    }

    return { success: true, data: { attachmentUrls: uploadedUrls }, message: 'File uploaded successfully' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while uploading the file';
    console.error('Error in uploadDrawingAttachment:', error);
    return { success: false, error: errorMessage };
  }
}

export async function fetchDrawings(projectId?: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error("User not authenticated");
  }

  try {
    const url = projectId
      ? `${BACKEND_URL}/drawings?projectId=${projectId}`
      : `${BACKEND_URL}/drawings`;

    console.log("Fetching drawings from:", url)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    console.log("Fetch response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("Fetch error:", errorText)
      throw new Error("Failed to fetch drawings");
    }

    const result = await response.json()
    console.log("Fetched drawings:", result)
    return result
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

  console.log("Creating drawing with data:", data)
  console.log("Backend URL:", BACKEND_URL)
  console.log("Access token:", !!session.accessToken)

  try {
    const response = await fetch(`${BACKEND_URL}/drawings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    console.log("Create response status:", response.status)
    console.log("Create response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log("Create error response:", errorText)
      const error = JSON.parse(errorText)
      throw new Error(error.message || "Failed to create drawing");
    }

    const result = await response.json()
    console.log("Create success result:", result)
    return result
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
