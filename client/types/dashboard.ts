import { LucideIcon } from "lucide-react";


export interface MetricCardProps {
  title: string
  value: number | string
  icon: LucideIcon;
  description?: string
  trend?: string
  colorClass: string
  href?: string
}

// --- Types ---
export interface Project {
  id?: string
  name?: string
  location?: string
  status?: "ACTIVE" | "PAUSED" | "COMPLETED" | "PLANNING"
  startDate?: string
  endDate?: string
  progress?: number
}

export interface ProjectStats {
  total: number
  active: number
  paused: number
  completed: number
}

export interface DashboardStats {
  projects: ProjectStats
  contractors: number
  labours: number
  drawings: number
  loading: boolean
  recentProjects?: Project[]
}

