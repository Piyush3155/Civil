export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
  OTHER = 'OTHER'
}

export interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  projectId: string;
  categoryId: string;
  amount: number;
  description?: string;
  paymentDate: string;
  paidById?: string;
  paidTo?: string;
  paymentMode: PaymentMode;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  category?: ExpenseCategory;
  paidBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ContractorAdvance {
  id: string;
  contractorId: string;
  projectId: string;
  amount: number;
  paidDate: string;
  notes?: string;
  paidById?: string;
  contractor?: {
    id: string;
    name: string;
    phone?: string;
  };
  paidBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  projectId: string;
  poId?: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  paidById?: string;
  supplier?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  po?: {
    id: string;
    poNumber: string;
  };
  paidBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateExpenseCategoryDto {
  name: string;
}

export interface CreateExpenseDto {
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

export interface CreateContractorAdvanceDto {
  contractorId: string;
  projectId: string;
  amount: number | string;
  paidDate?: string;
  notes?: string;
  paidById?: string;
}

export interface CreateSupplierPaymentDto {
  supplierId: string;
  projectId: string;
  poId?: string;
  amount: number | string;
  paymentDate?: string;
  notes?: string;
  paidById?: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  categoryWiseExpenses: Array<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    count: number;
  }>;
  paymentModeBreakdown: Array<{
    mode: PaymentMode;
    totalAmount: number;
    count: number;
  }>;
  recentExpenses: Expense[];
}

export interface CashFlowData {
  cashIn: number;
  cashOut: number;
  expectedBills: number;
  futurePayments: number;
  netCashFlow: number;
}

export interface FinancialReport {
  projectId: string;
  projectName: string;
  period: {
    from: string;
    to: string;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
  };
  contractorAdvances: {
    total: number;
    count: number;
  };
  supplierPayments: {
    total: number;
    count: number;
  };
  materialExpenditure: number;
  outstandingLiabilities: number;
}
