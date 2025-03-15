// src/app/core/models/user.model.ts
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: number;
  theme: 'light' | 'dark' | 'system';
  autoStartTimer: boolean;
  remindInactive: boolean;
  inactiveTimeMinutes: number;
  defaultHourlyRate?: number;
}
