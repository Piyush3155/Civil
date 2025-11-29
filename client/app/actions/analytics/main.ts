"use server";

import { apiRequest } from "@/lib/api";

export async function getProjectOverview(projectId: string) {
  try {
    const data = await apiRequest(`/analytics/project/${projectId}/overview`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching project overview:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch project overview" 
    };
  }
}

export async function getProgressAnalytics(projectId: string, days: number = 30) {
  try {
    const data = await apiRequest(`/analytics/project/${projectId}/progress?days=${days}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching progress analytics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch progress analytics" 
    };
  }
}

export async function getMaterialAnalytics(projectId: string) {
  try {
    const data = await apiRequest(`/analytics/project/${projectId}/material`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching material analytics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch material analytics" 
    };
  }
}

export async function getProcurementAnalytics(projectId: string) {
  try {
    const data = await apiRequest(`/analytics/project/${projectId}/procurement`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching procurement analytics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch procurement analytics" 
    };
  }
}

export async function getBillingAnalytics(projectId: string) {
  try {
    const data = await apiRequest(`/analytics/project/${projectId}/billing`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching billing analytics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch billing analytics" 
    };
  }
}

export async function getQCAnalytics(projectId: string) {
  try {
    const data = await apiRequest(`/analytics/project/${projectId}/qc`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching QC analytics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch QC analytics" 
    };
  }
}

export async function getLabourAnalytics(projectId: string, days: number = 30) {
  try {
    const data = await apiRequest(`/analytics/project/${projectId}/labour?days=${days}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching labour analytics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch labour analytics" 
    };
  }
}

export async function getSiteDiaryAnalytics(projectId: string, days: number = 30) {
  try {
    const data = await apiRequest(`/analytics/project/${projectId}/diary?days=${days}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching site diary analytics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch site diary analytics" 
    };
  }
}

export async function getCompleteAnalytics(projectId: string) {
  try {
    const data = await apiRequest(`/analytics/project/${projectId}/complete`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching complete analytics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch complete analytics" 
    };
  }
}

export async function getAllProjects() {
  try {
    const data = await apiRequest("/projects");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch projects" 
    };
  }
}
