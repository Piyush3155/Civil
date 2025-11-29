import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // 1️⃣ PROJECT OVERVIEW ANALYTICS (Dashboard)
  // ==========================================
  async getProjectOverview(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        code: true,
        progress: true,
        status: true,
        startDate: true,
        endDate: true,
        nextMilestone: true,
        milestoneDate: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Tasks stats
    const tasksStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    });

    const totalTasks = tasksStats.reduce((sum, s) => sum + s._count, 0);
    const completedTasks = tasksStats.find((s) => s.status === 'COMPLETED')?._count || 0;

    // Material stats
    const materialConsumed = await this.prisma.materialUsage.aggregate({
      where: { projectId },
      _sum: { quantityUsed: true },
    });

    // PO stats
    const poStats = await this.prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    });

    const pendingPOs = poStats.filter(
      (s) => !['COMPLETED', 'CANCELLED'].includes(s.status)
    ).reduce((sum, s) => sum + s._count, 0);

    // QC issues
    const qcStats = await this.prisma.qCIssue.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    });

    const openQCIssues = qcStats.filter(
      (s) => s.status !== 'CLOSED'
    ).reduce((sum, s) => sum + s._count, 0);

    // Contractor bills
    const billsTotal = await this.prisma.contractorBill.aggregate({
      where: { projectId },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Calculate paid amount from payments
    const paymentsTotal = await this.prisma.contractorPayment.aggregate({
      where: {
        bill: {
          projectId,
        },
      },
      _sum: { amountPaid: true },
    });

    const totalBilled = Number(billsTotal._sum.totalAmount || 0);
    const totalPaid = Number(paymentsTotal._sum.amountPaid || 0);

    // Today's labour count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLabour = await this.prisma.diaryLabourLog.aggregate({
      where: {
        diary: {
          projectId,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      },
      _sum: { count: true },
    });

    return {
      project,
      overview: {
        overallProgress: Number(project.progress),
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: tasksStats.find((s) => s.status === 'IN_PROGRESS')?._count || 0,
          pending: tasksStats.find((s) => s.status === 'PENDING')?._count || 0,
        },
        materials: {
          totalConsumed: Number(materialConsumed._sum.quantityUsed || 0),
        },
        procurement: {
          pendingPOs,
          totalPOs: poStats.reduce((sum, s) => sum + s._count, 0),
        },
        qc: {
          openIssues: openQCIssues,
          totalIssues: qcStats.reduce((sum, s) => sum + s._count, 0),
        },
        billing: {
          totalBills: billsTotal._count,
          totalAmount: totalBilled,
          paidAmount: totalPaid,
          pendingAmount: totalBilled - totalPaid,
        },
        labour: {
          todayCount: Number(todayLabour._sum.count || 0),
        },
      },
    };
  }

  // ==========================================
  // 2️⃣ PROGRESS ANALYTICS
  // ==========================================
  async getProgressAnalytics(projectId: string, days: number = 30) {
    // Overall progress timeline
    const progressLogs = await this.prisma.projectProgressLog.findMany({
      where: { projectId },
      orderBy: { loggedAt: 'asc' },
      take: days,
      select: {
        loggedAt: true,
        progress: true,
        milestone: true,
        notes: true,
      },
    });

    // Task-level progress (WBS)
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        progressLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        contractor: {
          select: { name: true },
        },
      },
    });

    // Calculate overall metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    
    // Calculate average progress from latest progress logs
    const tasksWithProgress = tasks.filter(t => t.progressLogs.length > 0);
    const avgProgress = tasksWithProgress.length > 0
      ? tasksWithProgress.reduce((sum, t) => sum + Number(t.progressLogs[0].progress), 0) / tasksWithProgress.length
      : 0;

    return {
      progressTimeline: progressLogs.map((log) => ({
        date: log.loggedAt,
        progress: Number(log.progress),
        milestone: log.milestone,
        notes: log.notes,
      })),
      wbsProgress: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        category: task.category,
        status: task.status,
        progress: task.progressLogs[0] ? Number(task.progressLogs[0].progress) : 0,
        startDate: task.startDate,
        endDate: task.endDate,
        contractor: task.contractor?.name,
        latestUpdate: task.progressLogs[0] ? {
          date: task.progressLogs[0].createdAt,
          progress: Number(task.progressLogs[0].progress),
          notes: task.progressLogs[0].notes,
        } : null,
      })),
      summary: {
        totalTasks,
        completedTasks,
        averageProgress: avgProgress,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
    };
  }

  // ==========================================
  // 3️⃣ MATERIAL ANALYTICS
  // ==========================================
  async getMaterialAnalytics(projectId: string) {
    // Get all materials with deliveries and usage
    const materials = await this.prisma.material.findMany({
      include: {
        deliveries: {
          where: { projectId },
        },
        usages: {
          where: { projectId },
        },
        stock: {
          where: { projectId },
        },
      },
    });

    const analytics = materials.map((material) => {
      const delivered = material.deliveries.reduce(
        (sum, d) => sum + Number(d.quantity),
        0
      );
      const used = material.usages.reduce(
        (sum, u) => sum + Number(u.quantityUsed),
        0
      );
      const currentStock = material.stock[0]?.closingQty
        ? Number(material.stock[0].closingQty)
        : 0;

      const wastage = delivered - used - currentStock;

      // Cost calculations
      const deliveredCost = material.deliveries.reduce(
        (sum, d) => sum + Number(d.totalPrice || 0),
        0
      );
      const avgUnitCost = delivered > 0 ? deliveredCost / delivered : 0;

      return {
        id: material.id,
        name: material.name,
        unit: material.unit,
        delivered,
        used,
        currentStock,
        wastage,
        wastagePercent: delivered > 0 ? (wastage / delivered) * 100 : 0,
        deliveredCost,
        avgUnitCost,
        estimatedValue: currentStock * avgUnitCost,
      };
    });

    // Summary
    const totalDeliveredCost = analytics.reduce((sum, a) => sum + a.deliveredCost, 0);
    const totalStockValue = analytics.reduce((sum, a) => sum + a.estimatedValue, 0);
    const totalWastage = analytics.reduce((sum, a) => sum + a.wastage, 0);

    return {
      materials: analytics,
      summary: {
        totalMaterials: materials.length,
        totalDeliveredCost,
        totalStockValue,
        totalWastage,
        lowStockItems: analytics.filter((a) => a.currentStock <= 10).length,
        outOfStockItems: analytics.filter((a) => a.currentStock === 0).length,
      },
    };
  }

  // ==========================================
  // 4️⃣ PROCUREMENT ANALYTICS
  // ==========================================
  async getProcurementAnalytics(projectId: string) {
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: { projectId },
      include: {
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    // PO status breakdown
    const statusBreakdown = purchaseOrders.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Supplier performance
    const supplierStats = purchaseOrders.reduce((acc, po) => {
      const supplierId = po.supplierId;
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplier: po.supplier,
          poCount: 0,
          totalValue: 0,
          completedPOs: 0,
        };
      }
      acc[supplierId].poCount += 1;
      acc[supplierId].totalValue += Number(po.grandTotal);
      if (po.status === 'COMPLETED') {
        acc[supplierId].completedPOs += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    // Total values
    const totalPOValue = purchaseOrders.reduce(
      (sum, po) => sum + Number(po.grandTotal),
      0
    );
    const completedPOValue = purchaseOrders
      .filter((po) => po.status === 'COMPLETED')
      .reduce((sum, po) => sum + Number(po.grandTotal), 0);
    const pendingPOValue = purchaseOrders
      .filter((po) => !['COMPLETED', 'CANCELLED'].includes(po.status))
      .reduce((sum, po) => sum + Number(po.grandTotal), 0);

    return {
      purchaseOrders: purchaseOrders.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        supplier: po.supplier.name,
        status: po.status,
        createdAt: po.createdAt,
        totalValue: Number(po.grandTotal),
        itemCount: po.items.length,
      })),
      statusBreakdown,
      supplierPerformance: Object.values(supplierStats),
      summary: {
        totalPOs: purchaseOrders.length,
        totalPOValue,
        completedPOValue,
        pendingPOValue,
        avgPOValue: purchaseOrders.length > 0 ? totalPOValue / purchaseOrders.length : 0,
      },
    };
  }

  // ==========================================
  // 5️⃣ BILLING ANALYTICS
  // ==========================================
  async getBillingAnalytics(projectId: string) {
    const bills = await this.prisma.contractorBill.findMany({
      where: { projectId },
      include: {
        contractor: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Status breakdown
    const statusBreakdown = bills.reduce((acc, bill) => {
      acc[bill.status] = (acc[bill.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Contractor-wise summary
    const contractorStats = bills.reduce((acc, bill) => {
      const contractorId = bill.contractorId;
      if (!acc[contractorId]) {
        acc[contractorId] = {
          contractor: bill.contractor,
          billCount: 0,
          totalBilled: 0,
          totalPaid: 0,
          pending: 0,
        };
      }
      const paidAmount = bill.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      acc[contractorId].billCount += 1;
      acc[contractorId].totalBilled += Number(bill.totalAmount);
      acc[contractorId].totalPaid += paidAmount;
      acc[contractorId].pending += Number(bill.totalAmount) - paidAmount;
      return acc;
    }, {} as Record<string, any>);

    // Totals
    const totalBilled = bills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const totalPaid = bills.reduce((sum, b) => {
      return sum + b.payments.reduce((pSum, p) => pSum + Number(p.amountPaid), 0);
    }, 0);
    const totalPending = totalBilled - totalPaid;

    return {
      bills: bills.map((bill) => {
        const paidAmount = bill.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
        return {
          id: bill.id,
          billNumber: bill.billNumber,
          contractor: bill.contractor.name,
          createdAt: bill.createdAt,
          periodFrom: bill.periodFrom,
          periodTo: bill.periodTo,
          status: bill.status,
          totalAmount: Number(bill.totalAmount),
          paidAmount,
          pendingAmount: Number(bill.totalAmount) - paidAmount,
        };
      }),
      statusBreakdown,
      contractorPerformance: Object.values(contractorStats),
      summary: {
        totalBills: bills.length,
        totalBilled,
        totalPaid,
        totalPending,
        avgBillValue: bills.length > 0 ? totalBilled / bills.length : 0,
        paymentRate: totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0,
      },
    };
  }

  // ==========================================
  // 6️⃣ QC / SAFETY ANALYTICS
  // ==========================================
  async getQCAnalytics(projectId: string) {
    const qcIssues = await this.prisma.qCIssue.findMany({
      where: { projectId },
      include: {
        creator: { select: { name: true, email: true } },
        contractor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Status breakdown
    const statusBreakdown = qcIssues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Type breakdown
    const typeBreakdown = qcIssues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Priority breakdown
    const priorityBreakdown = qcIssues.reduce((acc, issue) => {
      acc[issue.priority] = (acc[issue.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Contractor-wise issues
    const contractorIssues = qcIssues.reduce((acc, issue) => {
      if (issue.assignedTo) {
        const name = issue.contractor?.name || 'Unknown';
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Average resolution time
    const resolvedIssues = qcIssues.filter((i) => i.status === 'CLOSED' && i.updatedAt);
    const avgResolutionTime = resolvedIssues.length > 0
      ? resolvedIssues.reduce((sum, issue) => {
          const duration = issue.updatedAt.getTime() - issue.createdAt.getTime();
          return sum + duration / (1000 * 60 * 60 * 24); // Convert to days
        }, 0) / resolvedIssues.length
      : 0;

    return {
      issues: qcIssues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        type: issue.type,
        priority: issue.priority,
        status: issue.status,
        createdAt: issue.createdAt,
        createdBy: issue.creator.name,
        contractor: issue.contractor?.name,
      })),
      statusBreakdown,
      typeBreakdown,
      priorityBreakdown,
      contractorIssues,
      summary: {
        totalIssues: qcIssues.length,
        openIssues: statusBreakdown['OPEN'] || 0,
        inProgressIssues: statusBreakdown['IN_PROGRESS'] || 0,
        closedIssues: statusBreakdown['CLOSED'] || 0,
        criticalIssues: priorityBreakdown['CRITICAL'] || 0,
        avgResolutionDays: avgResolutionTime,
      },
    };
  }

  // ==========================================
  // 7️⃣ LABOUR ANALYTICS
  // ==========================================
  async getLabourAnalytics(projectId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const labourLogs = await this.prisma.diaryLabourLog.findMany({
      where: {
        diary: {
          projectId,
          date: { gte: startDate },
        },
      },
      include: {
        diary: { select: { date: true } },
        contractor: { select: { name: true } },
        labour: { select: { name: true, skill: true } },
      },
      orderBy: { diary: { date: 'desc' } },
    });

    // Daily attendance
    const dailyAttendance = labourLogs.reduce((acc, log) => {
      const dateKey = log.diary.date.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + Number(log.count);
      return acc;
    }, {} as Record<string, number>);

    // Contractor-wise labour
    const contractorLabour = labourLogs.reduce((acc, log) => {
      if (log.contractor) {
        const name = log.contractor.name;
        acc[name] = (acc[name] || 0) + Number(log.count);
      }
      return acc;
    }, {} as Record<string, number>);

    // Skill-wise distribution
    const skillDistribution = labourLogs.reduce((acc, log) => {
      if (log.labour?.skill) {
        acc[log.labour.skill] = (acc[log.labour.skill] || 0) + Number(log.count);
      }
      return acc;
    }, {} as Record<string, number>);

    const totalLabourDays = Object.values(dailyAttendance).reduce((sum, count) => sum + count, 0);
    const avgDailyLabour = Object.keys(dailyAttendance).length > 0
      ? totalLabourDays / Object.keys(dailyAttendance).length
      : 0;

    return {
      dailyAttendance: Object.entries(dailyAttendance).map(([date, count]) => ({
        date,
        count,
      })),
      contractorDistribution: Object.entries(contractorLabour).map(([contractor, count]) => ({
        contractor,
        count,
      })),
      skillDistribution: Object.entries(skillDistribution).map(([skill, count]) => ({
        skill,
        count,
      })),
      summary: {
        totalLabourDays,
        avgDailyLabour,
        peakLabour: Math.max(...Object.values(dailyAttendance), 0),
        activeDays: Object.keys(dailyAttendance).length,
      },
    };
  }

  // ==========================================
  // 8️⃣ SITE DIARY ANALYTICS
  // ==========================================
  async getSiteDiaryAnalytics(projectId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const diaries = await this.prisma.siteDiary.findMany({
      where: {
        projectId,
        date: { gte: startDate },
      },
      include: {
        creator: { select: { name: true } },
        labourLogs: true,
        equipmentLogs: true,
      },
      orderBy: { date: 'desc' },
    });

    // Rain impact days
    const rainDays = diaries.filter((d) => d.weather?.toLowerCase().includes('rain')).length;

    // Issues trend
    const issuesByDate = diaries.reduce((acc, diary) => {
      const dateKey = diary.date.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + (diary.issues ? 1 : 0);
      return acc;
    }, {} as Record<string, number>);

    // Photos count
    const totalPhotos = diaries.reduce((sum, d) => {
      if (d.photos && Array.isArray(d.photos)) {
        return sum + d.photos.length;
      }
      return sum;
    }, 0);

    return {
      diaries: diaries.map((diary) => ({
        id: diary.id,
        date: diary.date,
        weather: diary.weather,
        issues: diary.issues,
        labourCount: diary.labourLogs.reduce((sum, l) => sum + Number(l.count), 0),
        equipmentCount: diary.equipmentLogs.length,
        photoCount: Array.isArray(diary.photos) ? diary.photos.length : 0,
        createdBy: diary.creator.name,
      })),
      summary: {
        totalDiaries: diaries.length,
        rainDays,
        totalPhotos,
        avgPhotosPerDay: diaries.length > 0 ? totalPhotos / diaries.length : 0,
        daysWithIssues: Object.values(issuesByDate).filter((count) => count > 0).length,
      },
    };
  }
}
