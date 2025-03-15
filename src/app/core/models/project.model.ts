import { Client } from './client.model';

// src/app/core/models/project.model.ts
export interface Project {
  id: number;
  name: string;
  description?: string;
  clientId: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  startDate?: string;
  endDate?: string;
  budget?: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  client?: Client;
}
