// src/app/core/services/project.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '../models/project.model';
import { HttpParams } from '@angular/common/http';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private path = '/projects';

  constructor(private apiService: ApiService) {}

  getProjects(params = new HttpParams()): Observable<Project[]> {
    return this.apiService
      .get<{ status: string; data: { projects: Project[] } }>(this.path, params)
      .pipe(map((response) => response.data.projects));
  }

  getProject(id: number): Observable<Project> {
    return this.apiService
      .get<{ status: string; data: { project: Project } }>(`${this.path}/${id}`)
      .pipe(map((response) => response.data.project));
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.apiService
      .post<{ status: string; data: { project: Project } }>(this.path, project)
      .pipe(map((response) => response.data.project));
  }

  updateProject(id: number, project: Partial<Project>): Observable<Project> {
    return this.apiService
      .put<{ status: string; data: { project: Project } }>(
        `${this.path}/${id}`,
        project
      )
      .pipe(map((response) => response.data.project));
  }

  deleteProject(id: number): Observable<any> {
    return this.apiService.delete<{ status: string; message: string }>(
      `${this.path}/${id}`
    );
  }

  updateProjectStatus(id: number, status: string): Observable<Project> {
    return this.apiService
      .patch<{ status: string; data: { project: Project } }>(
        `${this.path}/${id}/status`,
        { status }
      )
      .pipe(map((response) => response.data.project));
  }

  getProjectStats(id: number): Observable<any> {
    return this.apiService
      .get<{ status: string; data: { stats: any } }>(`${this.path}/${id}/stats`)
      .pipe(map((response) => response.data.stats));
  }

  getProjectTasks(id: number, params = new HttpParams()): Observable<Task[]> {
    return this.apiService
      .get<{ status: string; data: { tasks: Task[] } }>(
        `${this.path}/${id}/tasks`,
        params
      )
      .pipe(map((response) => response.data.tasks));
  }

  getClientProjects(
    clientId: number,
    params = new HttpParams()
  ): Observable<Project[]> {
    return this.apiService
      .get<{ status: string; data: { projects: Project[] } }>(
        `${this.path}/client/${clientId}`,
        params
      )
      .pipe(map((response) => response.data.projects));
  }
}
