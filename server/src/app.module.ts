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
import { RolesModule } from './roles/roles.module';
import { MaterialsModule } from './materials/materials.module';
import { SiteDiaryModule } from './site-diary/site-diary.module';
import { ProjectProgressModule } from './project-progress/project-progress.module';
import { TasksModule } from './tasks/tasks.module';
import { BillingModule } from './billing/billing.module';
import { QualityControlModule } from './quality-control/quality-control.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProcurementModule } from './procurement/procurement.module';
import { AnalyticsModule } from './analytics/analytics.module';

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
    RolesModule,
    MaterialsModule,
    SiteDiaryModule,
    ProjectProgressModule,
    TasksModule,
    BillingModule,
    QualityControlModule,
    InventoryModule,
    ProcurementModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
