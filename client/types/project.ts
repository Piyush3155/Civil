export type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export interface Project {
  id: string
  name: string
  code: string
  location?: string
  progress?: number
  nextMilestone?: string
  progressLastUpdated?: string
  status: string
  startDate?: string
  endDate?: string
  createdAt: string
  members?: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
    }
    role: {
      id: string
      name: string
    }
  }>
  owners?: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
  contractors?: Array<{
    contractor: {
      id: string
      name: string
      type: string
    }
  }>
  drawings?: Array<{
    id: string
    title: string
    version: string
    type: string
  }>
  labours?: Array<{
    id: string
    name: string
    contractorId: string
  }>
}



