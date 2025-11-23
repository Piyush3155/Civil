import { Module } from '@nestjs/common';
import { FcmController } from './fcm.controller';
import { FcmService } from './fcm.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FcmController],
  providers: [FcmService]
})
export class FcmModule {}
