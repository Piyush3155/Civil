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
import { FinanceModule } from './finance/finance.module';
import { EstimationModule } from './estimation/estimation.module';
import { PdfModule } from './pdf/pdf.module';
import { EquipmentModule } from './equipment/equipment.module';
import { EquipmentCategoryModule } from './equipment-category/equipment-category.module';
import { AiController } from './ai/ai.controller';
import { AiModule } from './ai/ai.module';

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
    FinanceModule,
    EstimationModule,
    PdfModule,
    EquipmentModule,
    EquipmentCategoryModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
