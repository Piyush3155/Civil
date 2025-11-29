export interface Project {
  id: string;
  name: string;
  code: string;
  progress: number;
  status: string;
  startDate: string;
  endDate: string;
  nextMilestone: string;
  milestoneDate: string;
  location?: string;
  createdAt: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  code: string;
  status: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface Contractor {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  type?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: Supplier;
  status: string;
  createdAt: string;
  totalValue: number;
  itemCount: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  contractor: Contractor;
  createdAt: string;
  periodFrom: string;
  periodTo: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface ProgressAnalytics {
  progressTimeline: Array<{
    date: string;
    progress: number;
    milestone?: string;
    notes?: string;
  }>;
  wbsProgress: Array<{
    id: string;
    title: string;
    category?: string;
    status: string;
    progress: number;
    startDate?: string;
    endDate?: string;
    contractor?: string;
    latestUpdate?: {
      date: string;
      progress: number;
      notes?: string;
    };
  }>;
  summary: {
    totalTasks: number;
    completedTasks: number;
    averageProgress: number;
    completionRate: number;
  };
}

export interface MaterialAnalytics {
  materials: Array<{
    id: string;
    name: string;
    unit: string;
    delivered: number;
    used: number;
    currentStock: number;
    wastage: number;
    wastagePercent: number;
    deliveredCost: number;
    avgUnitCost: number;
    estimatedValue: number;
  }>;
  summary: {
    totalMaterials: number;
    totalDeliveredCost: number;
    totalStockValue: number;
    totalWastage: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
}

export interface ProcurementAnalytics {
  purchaseOrders: PurchaseOrder[];
  statusBreakdown: Record<string, number>;
  supplierPerformance: Array<{
    supplier: Supplier;
    poCount: number;
    totalValue: number;
    completedPOs: number;
  }>;
  summary: {
    totalPOs: number;
    totalPOValue: number;
    completedPOValue: number;
    pendingPOValue: number;
    avgPOValue: number;
  };
}

export interface BillingAnalytics {
  bills: Bill[];
  statusBreakdown: Record<string, number>;
  contractorPerformance: Array<{
    contractor: Contractor;
    billCount: number;
    totalBilled: number;
    totalPaid: number;
    pending: number;
  }>;
  summary: {
    totalBills: number;
    totalBilled: number;
    totalPaid: number;
    totalPending: number;
    avgBillValue: number;
    paymentRate: number;
  };
}

export interface QCAnalytics {
  issues: Array<{
    id: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    createdAt: string;
    createdBy: string;
    contractor?: string;
  }>;
  statusBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  contractorIssues: Record<string, number>;
  summary: {
    totalIssues: number;
    openIssues: number;
    inProgressIssues: number;
    closedIssues: number;
    criticalIssues: number;
    avgResolutionDays: number;
  };
}

export interface LabourAnalytics {
  dailyAttendance: Array<{
    date: string;
    count: number;
  }>;
  contractorDistribution: Array<{
    contractor: string;
    count: number;
  }>;
  skillDistribution: Array<{
    skill: string;
    count: number;
  }>;
  summary: {
    totalLabourDays: number;
    avgDailyLabour: number;
    peakLabour: number;
    activeDays: number;
  };
}

export interface SiteDiaryAnalytics {
  diaries: Array<{
    id: string;
    date: string;
    weather?: string;
    issues?: string;
    labourCount: number;
    equipmentCount: number;
    photoCount: number;
    createdBy: string;
  }>;
  summary: {
    totalDiaries: number;
    rainDays: number;
    totalPhotos: number;
    avgPhotosPerDay: number;
    daysWithIssues: number;
  };
}
