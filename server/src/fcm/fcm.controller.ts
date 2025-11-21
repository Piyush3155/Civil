import { Controller, Post, Body } from '@nestjs/common';
import { FcmService } from './fcm.service';

@Controller('fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('send')
  async sendNotification(
    @Body() body: { token: string; title: string; body: string; data?: any },
  ) {
    return this.fcmService.sendNotification(
      body.token,
      body.title,
      body.body,
      body.data,
    );
  }

  @Post('send-multiple')
  async sendToMultipleTokens(
    @Body() body: { tokens: string[]; title: string; body: string; data?: any },
  ) {
    return this.fcmService.sendToMultipleTokens(
      body.tokens,
      body.title,
      body.body,
      body.data,
    );
  }
}
