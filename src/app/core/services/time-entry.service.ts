// src/app/core/services/time-entry.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TimeEntry } from '../models/time-entry.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TimeEntryService {
  private path = '/time-entries';
  private activeTimerSubject = new BehaviorSubject<TimeEntry | null>(null);
  public activeTimer = this.activeTimerSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Po załadowaniu serwisu, sprawdź czy istnieje aktywny timer
    this.checkActiveTimer();
  }

  getTimeEntries(params = new HttpParams()): Observable<TimeEntry[]> {
    return this.apiService
      .get<{ status: string; data: { timeEntries: TimeEntry[] } }>(
        this.path,
        params
      )
      .pipe(map((response) => response.data.timeEntries));
  }

  getTimeEntry(id: number): Observable<TimeEntry> {
    return this.apiService
      .get<{ status: string; data: { timeEntry: TimeEntry } }>(
        `${this.path}/${id}`
      )
      .pipe(map((response) => response.data.timeEntry));
  }

  createTimeEntry(timeEntry: Partial<TimeEntry>): Observable<TimeEntry> {
    return this.apiService
      .post<{ status: string; data: { timeEntry: TimeEntry } }>(
        this.path,
        timeEntry
      )
      .pipe(map((response) => response.data.timeEntry));
  }

  updateTimeEntry(
    id: number,
    timeEntry: Partial<TimeEntry>
  ): Observable<TimeEntry> {
    return this.apiService
      .put<{ status: string; data: { timeEntry: TimeEntry } }>(
        `${this.path}/${id}`,
        timeEntry
      )
      .pipe(map((response) => response.data.timeEntry));
  }

  deleteTimeEntry(id: number): Observable<any> {
    return this.apiService.delete<{ status: string; message: string }>(
      `${this.path}/${id}`
    );
  }

  startTimer(taskId: number, description?: string): Observable<TimeEntry> {
    return this.apiService
      .post<{ status: string; data: { timeEntry: TimeEntry } }>(
        `${this.path}/start`,
        {
          taskId,
          description,
          isBillable: true,
        }
      )
      .pipe(
        map((response) => response.data.timeEntry),
        tap((timeEntry) => {
          this.activeTimerSubject.next(timeEntry);
        })
      );
  }

  stopTimer(id: number): Observable<TimeEntry> {
    return this.apiService
      .post<{ status: string; data: { timeEntry: TimeEntry } }>(
        `${this.path}/${id}/stop`,
        {}
      )
      .pipe(
        map((response) => response.data.timeEntry),
        tap(() => {
          this.activeTimerSubject.next(null);
        })
      );
  }

  checkActiveTimer(): void {
    this.apiService
      .get<{ status: string; data: { activeTimer: TimeEntry | null } }>(
        `${this.path}/active`
      )
      .subscribe((response) => {
        this.activeTimerSubject.next(response.data.activeTimer);
      });
  }

  getActiveTimer(): TimeEntry | null {
    return this.activeTimerSubject.value;
  }

  calculateDuration(startTime: string): number {
    const start = new Date(startTime);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / 1000);
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
