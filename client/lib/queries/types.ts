export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Array<{
    role: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}