"use server";

import { getSession } from "@/lib/sessionAction";
import { apiRequest } from "@/lib/api";

export async function fetchProgressTimeline(projectId: string) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  return apiRequest(`/project-progress/${projectId}/timeline`);
}

export async function updateProjectProgress(
  projectId: string,
  data: { progress: number; milestone?: string; notes?: string }
) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  return apiRequest(`/project-progress/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
