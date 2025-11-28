import { Module } from '@nestjs/common';
import { DrawingsAttachmentController } from './drawings-attachment.controller';
import { DrawingsAttachmentService } from './drawings-attachment.service';

@Module({
  controllers: [DrawingsAttachmentController],
  providers: [DrawingsAttachmentService],
  exports: [DrawingsAttachmentService],
})
export class DrawingsAttachmentModule {}