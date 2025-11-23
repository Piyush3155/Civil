import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { FcmModule } from './fcm/fcm.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProjectsModule } from './projects/projects.module';
import { ContractorsModule } from './contractors/contractors.module';
import { LaboursModule } from './labours/labours.module';
import { DrawingsModule } from './drawings/drawings.module';

@Module({
  imports: [
    UsersModule,
    FcmModule,
    AuthModule,
    NotificationsModule,
    ProjectsModule,
    ContractorsModule,
    LaboursModule,
    DrawingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
