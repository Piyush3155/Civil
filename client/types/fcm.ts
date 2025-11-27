export interface FCMResult {
  success: number;
  failure: number;
  notificationId: number;
  targetDescription: string;
  message?: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  username: string;
}