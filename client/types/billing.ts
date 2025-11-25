export interface BOQItem {
  id: string;
  projectId: string;
  taskId?: string;
  name: string;
  unit: string;
  estimatedQty?: number;
  createdAt: string;
  task?: Task;
  rateContracts: RateContract[];
}

export interface RateContract {
  id: string;
  projectId: string;
  contractorId?: string;
  boqItemId: string;
  rate: number;
  unit: string;
  createdAt: string;
  contractor?: Contractor;
  boqItem: BOQItem;
}

export interface MeasurementBook {
  id: string;
  boqItemId: string;
  projectId: string;
  contractorId?: string;
  measuredQty: number;
  description?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
  boqItem: BOQItem;
  contractor?: Contractor;
  creator: User;
  approver?: User;
}

export type BillStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface ContractorBill {
  id: string;
  projectId: string;
  contractorId: string;
  billNumber: string;
  periodFrom: string;
  periodTo: string;
  totalAmount: number;
  status: BillStatus;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  contractor: Contractor;
  project: Project;
  billItems: ContractorBillItem[];
  payments: ContractorPayment[];
  creator: User;
  approver?: User;
}

export interface ContractorBillItem {
  id: string;
  billId: string;
  boqItemId: string;
  measuredQty: number;
  rate: number;
  amount: number;
  createdAt: string;
  bill: ContractorBill;
  boqItem: BOQItem;
}

export interface ContractorPayment {
  id: string;
  billId: string;
  amountPaid: number;
  paymentMode?: string;
  paymentDate: string;
  remarks?: string;
  bill: ContractorBill;
}

// Assuming these are defined elsewhere, but for completeness
export interface Task {
  id: string;
  title: string;
  // other fields
}

export interface Contractor {
  id: string;
  name: string;
  // other fields
}

export interface User {
  id: string;
  name: string;
  // other fields
}

export interface Project {
  id: string;
  name: string;
  // other fields
}