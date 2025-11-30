import { PaymentMode } from '@prisma/client';

export class CreateExpenseDto {
  projectId: string;
  categoryId: string;
  amount: number | string;
  description?: string;
  paymentDate?: string;
  paidById?: string;
  paidTo?: string;
  paymentMode: PaymentMode;
  receiptUrl?: string;
}
