import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  // Public endpoint: Request password reset by email (for login page)
  @Post('request')
  async requestReset(@Body() body: { email: string }) {
    return this.passwordResetService.createRequestByEmail(body.email);
  }

  // Authenticated endpoint: Request password reset for current user
  @UseGuards(JwtAuthGuard)
  @Post('request-authenticated')
  async requestResetAuthenticated(@Request() req) {
    return this.passwordResetService.createRequest(req.user.id, req.user.email);
  }

  // Admin: Get all pending requests
  @UseGuards(JwtAuthGuard)
  @Get('pending')
  async getPendingRequests() {
    return this.passwordResetService.getPendingRequests();
  }

  // Admin: Get all requests with optional status filter
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllRequests(@Query('status') status?: string) {
    return this.passwordResetService.getAllRequests(status);
  }

  // Admin: Get request statistics
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats() {
    return this.passwordResetService.getRequestStats();
  }

  // Admin: Approve request and set new password
  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  async approveRequest(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Request() req,
  ) {
    return this.passwordResetService.approveRequest(id, req.user.id, body.newPassword);
  }

  // Admin: Reject request
  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  async rejectRequest(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    return this.passwordResetService.rejectRequest(id, req.user.id, body.reason);
  }
}
