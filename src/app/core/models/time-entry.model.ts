import { Task } from './task.model';

// src/app/core/models/time-entry.model.ts
export interface TimeEntry {
  id: number;
  taskId: number;
  userId: number;
  startTime: string;
  endTime?: string;
  duration?: number; // czas w sekundach
  description?: string;
  isBillable: boolean;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
  task?: Task;
}
