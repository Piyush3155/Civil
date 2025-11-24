"use server";

import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

export async function fetchProgressTimeline(projectId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return apiRequest(`/project-progress/${projectId}/timeline`);
}

export async function updateProjectProgress(
  projectId: string,
  data: { progress: number; milestone?: string; notes?: string }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return apiRequest(`/project-progress/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}