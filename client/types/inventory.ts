export interface MaterialStock {
  id: string;
  projectId: string;
  materialId: string;
  openingQty: number;
  receivedQty: number;
  usedQty: number;
  adjustedQty: number;
  closingQty: number;
  location?: string;
  lastUpdated: Date;
  material: {
    id: string;
    name: string;
    unit: string;
    description?: string;
  };
}

export interface StockLedgerEntry {
  id: string;
  projectId: string;
  materialId: string;
  type: 'DELIVERY' | 'USAGE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';
  quantity: number;
  notes?: string;
  location?: string;
  relatedId?: string;
  createdAt: Date;
  material: {
    id: string;
    name: string;
    unit: string;
  };
}

export interface MaterialAdjustment {
  id: string;
  projectId: string;
  materialId: string;
  type: 'DAMAGE' | 'LOSS' | 'THEFT' | 'AUDIT' | 'CORRECTION';
  quantity: number;
  reason?: string;
  photos?: string[];
  adjustedBy: string;
  createdAt: Date;
  material: {
    id: string;
    name: string;
    unit: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface MaterialTransfer {
  id: string;
  projectId: string;
  materialId: string;
  fromLocation?: string;
  toLocation?: string;
  quantity: number;
  notes?: string;
  transferredBy: string;
  createdAt: Date;
  material: {
    id: string;
    name: string;
    unit: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface StockSummary {
  totalMaterials: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  stock: MaterialStock[];
  lowStock: MaterialStock[];
  outOfStock: MaterialStock[];
}
