import { Module } from '@nestjs/common';
import { SiteDiaryService } from './site-diary.service';
import { SiteDiaryController } from './site-diary.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SiteDiaryController],
  providers: [SiteDiaryService],
  exports: [SiteDiaryService],
})
export class SiteDiaryModule {}