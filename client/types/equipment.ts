export interface Equipment {
  id: string;
  name: string;
  model?: string;
  capacity?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  rental?: boolean;
  rentalVendor?: string;
  rentalRate?: number;
  status: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEquipmentData {
  name: string;
  model?: string;
  capacity?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  rental: boolean;
  rentalVendor?: string;
  rentalRate?: string;
  status: string;
  categoryId: string;
  projectId?: string;
}
