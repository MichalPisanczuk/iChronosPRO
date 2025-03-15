// src/app/core/models/client.model.ts
export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}
