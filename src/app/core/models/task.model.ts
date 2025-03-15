import { Project } from './project.model';
import { Tag } from './tag.model';
import { TimeEntry } from './time-entry.model';

// src/app/core/models/task.model.ts
export interface Task {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours?: number;
  hourlyRate?: number;
  dueDate?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  tags?: Tag[];
  timeEntries?: TimeEntry[];
}
