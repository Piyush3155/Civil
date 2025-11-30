import { PaymentMode } from '@prisma/client';

export class CreateSupplierPaymentDto {
  supplierId: string;
  projectId: string;
  poId?: string;
  amount: number | string;
  paymentDate?: string;
  notes?: string;
  paidById?: string;
}
