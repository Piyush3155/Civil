import { Module } from '@nestjs/common';
import { ProjectProgressService } from './project-progress.service';
import { ProjectProgressController } from './project-progress.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectProgressController],
  providers: [ProjectProgressService],
  exports: [ProjectProgressService],
})
export class ProjectProgressModule {}
