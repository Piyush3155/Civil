import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==========================================
  // PROJECT OVERVIEW
  // ==========================================
  @Get('project/:projectId/overview')
  async getProjectOverview(@Param('projectId') projectId: string) {
    return this.analyticsService.getProjectOverview(projectId);
  }

  // ==========================================
  // PROGRESS ANALYTICS
  // ==========================================
  @Get('project/:projectId/progress')
  async getProgressAnalytics(
    @Param('projectId') projectId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getProgressAnalytics(
      projectId,
      days ? parseInt(days) : 30,
    );
  }

  // ==========================================
  // MATERIAL ANALYTICS
  // ==========================================
  @Get('project/:projectId/material')
  async getMaterialAnalytics(@Param('projectId') projectId: string) {
    return this.analyticsService.getMaterialAnalytics(projectId);
  }

  // ==========================================
  // PROCUREMENT ANALYTICS
  // ==========================================
  @Get('project/:projectId/procurement')
  async getProcurementAnalytics(@Param('projectId') projectId: string) {
    return this.analyticsService.getProcurementAnalytics(projectId);
  }

  // ==========================================
  // BILLING ANALYTICS
  // ==========================================
  @Get('project/:projectId/billing')
  async getBillingAnalytics(@Param('projectId') projectId: string) {
    return this.analyticsService.getBillingAnalytics(projectId);
  }

  // ==========================================
  // QC / SAFETY ANALYTICS
  // ==========================================
  @Get('project/:projectId/qc')
  async getQCAnalytics(@Param('projectId') projectId: string) {
    return this.analyticsService.getQCAnalytics(projectId);
  }

  // ==========================================
  // LABOUR ANALYTICS
  // ==========================================
  @Get('project/:projectId/labour')
  async getLabourAnalytics(
    @Param('projectId') projectId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getLabourAnalytics(
      projectId,
      days ? parseInt(days) : 30,
    );
  }

  // ==========================================
  // SITE DIARY ANALYTICS
  // ==========================================
  @Get('project/:projectId/diary')
  async getSiteDiaryAnalytics(
    @Param('projectId') projectId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getSiteDiaryAnalytics(
      projectId,
      days ? parseInt(days) : 30,
    );
  }

  // ==========================================
  // COMPLETE ANALYTICS (ALL-IN-ONE)
  // ==========================================
  @Get('project/:projectId/complete')
  async getCompleteAnalytics(@Param('projectId') projectId: string) {
    const [overview, progress, materials, procurement, billing, qc, labour, diary] = await Promise.all([
      this.analyticsService.getProjectOverview(projectId),
      this.analyticsService.getProgressAnalytics(projectId),
      this.analyticsService.getMaterialAnalytics(projectId),
      this.analyticsService.getProcurementAnalytics(projectId),
      this.analyticsService.getBillingAnalytics(projectId),
      this.analyticsService.getQCAnalytics(projectId),
      this.analyticsService.getLabourAnalytics(projectId),
      this.analyticsService.getSiteDiaryAnalytics(projectId),
    ]);

    return {
      overview,
      progress,
      materials,
      procurement,
      billing,
      qc,
      labour,
      diary,
      generatedAt: new Date(),
    };
  }
}
