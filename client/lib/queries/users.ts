"use client"

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { UsersResponse } from './types';

export const useUsers = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: async (): Promise<UsersResponse> => {
      const response = await apiRequest(`/users?page=${page}&limit=${limit}`);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserPermissions = () => {
  return useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      // Since checkUserPermissions is a server action, we need to call it differently
      // For now, we'll assume it's available or create a new API endpoint
      // Let's create a simple API call
      const response = await apiRequest('/auth/permissions');
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};