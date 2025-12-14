export type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export interface Project {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  progress: number;
  area?: string | null;
  nextMilestone?: string | null;
  milestoneDate?: string | Date | null;
  status: ProjectStatus;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  progressLastUpdated?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
