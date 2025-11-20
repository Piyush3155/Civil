import { Module } from '@nestjs/common';
import { FcmController } from './fcm.controller';
import { FcmService } from './fcm.service';

@Module({
  controllers: [FcmController],
  providers: [FcmService]
})
export class FcmModule {}
