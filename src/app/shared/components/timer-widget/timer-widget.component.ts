// src/app/shared/components/timer-widget/timer-widget.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { TimeEntryService } from '../../../core/services/time-entry.service';
import { TimeEntry } from '../../../core/models/time-entry.model';
import { TaskService } from '../../../core/services/task.service';
import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-timer-widget',
  templateUrl: './timer-widget.component.html',
  styleUrls: ['./timer-widget.component.scss'],
})
export class TimerWidgetComponent implements OnInit, OnDestroy {
  isRunning = false;
  currentTime = '00:00:00';
  activeTimer: TimeEntry | null = null;
  activeTask: Task | null = null;
  private timerSubscription: Subscription | null = null;

  constructor(
    private timeEntryService: TimeEntryService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    // Nasłuchiwanie zmian aktywnego timera
    this.timeEntryService.activeTimer.subscribe((timer) => {
      this.activeTimer = timer;

      if (timer) {
        this.isRunning = true;
        this.startTimerDisplay();
        this.loadActiveTask(timer.taskId);
      } else {
        this.isRunning = false;
        this.stopTimerDisplay();
        this.activeTask = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimerDisplay();
  }

  toggleTimer(): void {
    if (this.isRunning) {
      this.stopTimer();
    } else {
      // W rzeczywistej aplikacji tutaj powinno być okno dialogowe do wyboru zadania
      // Na potrzeby demonstracji użyjemy przykładowego ID zadania lub przekierujemy do strony wyboru zadania
      this.openTaskSelector();
    }
  }

  openTaskSelector(): void {
    // Implementacja w dalszej części
    alert(
      'W rzeczywistej aplikacji tutaj byłby panel wyboru zadania do śledzenia'
    );
  }

  startTimer(taskId: number, description?: string): void {
    this.timeEntryService.startTimer(taskId, description).subscribe({
      error: (error) => {
        console.error('Błąd przy uruchamianiu timera:', error);
        alert(`Nie udało się uruchomić timera: ${error.message}`);
      },
    });
  }

  stopTimer(): void {
    if (this.activeTimer) {
      this.timeEntryService.stopTimer(this.activeTimer.id).subscribe({
        error: (error) => {
          console.error('Błąd przy zatrzymywaniu timera:', error);
          alert(`Nie udało się zatrzymać timera: ${error.message}`);
        },
      });
    }
  }

  private startTimerDisplay(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    this.updateDisplayTime();

    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateDisplayTime();
    });
  }

  private stopTimerDisplay(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }

    this.currentTime = '00:00:00';
  }

  private updateDisplayTime(): void {
    if (this.activeTimer && this.activeTimer.startTime) {
      const duration = this.timeEntryService.calculateDuration(
        this.activeTimer.startTime
      );
      this.currentTime = this.timeEntryService.formatDuration(duration);
    }
  }

  private loadActiveTask(taskId: number): void {
    this.taskService.getTask(taskId).subscribe({
      next: (task: any) => {
        this.activeTask = task;
      },
      error: (error: any) => {
        console.error('Błąd przy pobieraniu aktywnego zadania:', error);
      },
    });
  }
}
