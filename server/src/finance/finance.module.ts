import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExpenseCategoryService } from './expense-category.service';
import { ExpenseCategoryController } from './expense-category.controller';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { ContractorAdvanceService } from './contractor-advance.service';
import { ContractorAdvanceController } from './contractor-advance.controller';
import { SupplierPaymentService } from './supplier-payment.service';
import { SupplierPaymentController } from './supplier-payment.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ExpenseCategoryController,
    ExpenseController,
    ContractorAdvanceController,
    SupplierPaymentController,
  ],
  providers: [
    ExpenseCategoryService,
    ExpenseService,
    ContractorAdvanceService,
    SupplierPaymentService,
  ],
  exports: [
    ExpenseCategoryService,
    ExpenseService,
    ContractorAdvanceService,
    SupplierPaymentService,
  ],
})
export class FinanceModule {}
