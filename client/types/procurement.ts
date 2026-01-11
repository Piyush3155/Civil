export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseRequest {
  id: string;
  projectId: string;
  requestedBy: string;
  materialId: string;
  quantity: number;
  reason?: string;
  urgency?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_PO';
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  material: {
    id: string;
    name: string;
    unit: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface POItem {
  id: string;
  poId: string;
  materialId: string;
  quantity: number;
  deliveredQty: number;
  pendingQty: number;
  unitPrice: number;
  amount: number;
  taxPercent?: number;
  taxAmount?: number;
  totalAmount: number;
  notes?: string;
  material: {
    id: string;
    name: string;
    unit: string;
  };
}

export interface PurchaseOrder {
  id: string;
  projectId: string;
  supplierId: string;
  poNumber: string;
  totalAmount: number;
  taxAmount?: number;
  grandTotal: number;
  status: 'DRAFT' |'DELIVERED'|'SENT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT_TO_SUPPLIER' | 'PARTIALLY_DELIVERED' | 'COMPLETED' | 'CANCELLED';
  deliveryAddress?: string;
  paymentTerms?: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  supplier: Supplier;
  items: POItem[];
  creator: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProcurementSummary {
  totalPOs: number;
  totalValue: number;
  statusCounts: {
    DRAFT: number;
    PENDING_APPROVAL: number;
    APPROVED: number;
    SENT_TO_SUPPLIER: number;
    PARTIALLY_DELIVERED: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  purchaseRequests: {
    total: number;
    statusCounts: {
      PENDING: number;
      APPROVED: number;
      REJECTED: number;
      CONVERTED_TO_PO: number;
    };
  };
  recentPOs: PurchaseOrder[];
}
