// src/app/core/services/task.service.ts
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private path = '/tasks';

  constructor(private apiService: ApiService) {}
  getTasks(
    params: { [param: string]: string | string[] } = {}
  ): Observable<Task[]> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.apiService
      .get<{ status: string; data: { tasks: Task[] } }>(this.path, httpParams)
      .pipe(map((response) => response.data.tasks));
  }
  getTask(id: number): Observable<Task> {
    return this.apiService
      .get<{ status: string; data: { task: Task } }>(`${this.path}/${id}`)
      .pipe(map((response: any) => response.data.task));
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.apiService
      .post<{ status: string; data: { task: Task } }>(this.path, task)
      .pipe(map((response) => response.data.task));
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    return this.apiService
      .put<{ status: string; data: { task: Task } }>(`${this.path}/${id}`, task)
      .pipe(map((response) => response.data.task));
  }

  deleteTask(id: number): Observable<any> {
    return this.apiService.delete<{ status: string; message: string }>(
      `${this.path}/${id}`
    );
  }

  updateTaskStatus(id: number, status: string): Observable<Task> {
    return this.apiService
      .patch<{ status: string; data: { task: Task } }>(
        `${this.path}/${id}/status`,
        { status }
      )
      .pipe(map((response) => response.data.task));
  }

  getActiveTask(): Observable<Task | null> {
    return this.apiService
      .get<{ status: string; data: { activeTask: Task | null } }>(
        `${this.path}/active`
      )
      .pipe(map((response) => response.data.activeTask));
  }
}
