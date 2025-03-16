// src/app/features/tasks/task-detail/task-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { TimeEntryService } from '../../../core/services/time-entry.service';
import { Task } from '../../../core/models/task.model';
import { TimeEntry } from '../../../core/models/time-entry.model';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss'],
})
export class TaskDetailComponent implements OnInit {
  taskId!: number;
  task: Task | null = null;
  timeEntries: TimeEntry[] = [];
  totalHours = 0;

  isLoading = true;
  isLoadingTimeEntries = false;
  errorMessage = '';
  isTimerRunning = false;

  // Status change modal
  showStatusModal = false;
  selectedStatus = '';

  // Delete modal
  showDeleteModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private timeEntryService: TimeEntryService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.taskId = +params['id'];
      this.loadTask();
    });

    // Sprawdź, czy jest aktywny timer
    this.checkActiveTimer();
  }

  loadTask(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTask(this.taskId).subscribe({
      next: (task) => {
        this.task = task;
        this.isLoading = false;
        this.loadTimeEntries();
      },
      error: (error) => {
        this.errorMessage =
          error.message || 'Nie udało się załadować danych zadania';
        this.isLoading = false;
      },
    });
  }

  loadTimeEntries(): void {
    this.isLoadingTimeEntries = true;

    // W rzeczywistej implementacji powinniśmy użyć filtrów po taskId
    // Tutaj używamy mocka
    setTimeout(() => {
      // Generujemy przykładowe wpisy czasowe
      this.timeEntries = this.generateMockTimeEntries();
      this.calculateTotalHours();
      this.isLoadingTimeEntries = false;
    }, 1000);

    // Rzeczywista implementacja mogłaby wyglądać tak:
    /*
    this.timeEntryService.getTimeEntries({ taskId: this.taskId }).subscribe({
      next: (entries) => {
        this.timeEntries = entries;
        this.calculateTotalHours();
        this.isLoadingTimeEntries = false;
      },
      error: (error) => {
        console.error('Błąd przy ładowaniu wpisów czasowych:', error);
        this.isLoadingTimeEntries = false;
      }
    });
    */
  }

  // Metoda do generowania przykładowych wpisów czasowych (mock)
  private generateMockTimeEntries(): TimeEntry[] {
    if (!this.task) return [];

    const entries: TimeEntry[] = [];
    const now = new Date();

    // Generujemy losową liczbę wpisów (0-5)
    const count = Math.floor(Math.random() * 6);

    for (let i = 0; i < count; i++) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 14)); // Losowy dzień z ostatnich 14 dni
      startDate.setHours(
        9 + Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 60),
        0
      ); // Losowa godzina 9-17

      const durationMinutes = 30 + Math.floor(Math.random() * 240); // Losowy czas 30-270 minut
      const durationSeconds = durationMinutes * 60;

      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);

      entries.push({
        id: i + 1,
        taskId: this.task.id,
        userId: 1, // Aktualni użytkownik
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        duration: durationSeconds,
        description:
          i % 2 === 0 ? `Praca nad zadaniem ${this.task.name}` : undefined,
        isBillable: true,
        hourlyRate: this.task.hourlyRate,
        createdAt: startDate.toISOString(),
        updatedAt: endDate.toISOString(),
      });
    }

    // Sortuj od najnowszych do najstarszych
    return entries.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  calculateTotalHours(): void {
    this.totalHours = this.timeEntries.reduce((total, entry) => {
      const duration = entry.duration || 0;
      return total + duration / 3600; // Konwersja sekund na godziny
    }, 0);
  }

  checkActiveTimer(): void {
    const activeTimer = this.timeEntryService.getActiveTimer();
    if (activeTimer && activeTimer.taskId === this.taskId) {
      this.isTimerRunning = true;
    }
  }

  startTimer(): void {
    if (!this.task) return;

    this.timeEntryService.startTimer(this.task.id).subscribe({
      next: () => {
        this.isTimerRunning = true;
        // Możemy dodać komunikat o sukcesie
      },
      error: (error) => {
        console.error('Błąd przy uruchamianiu timera:', error);
        alert(`Nie udało się uruchomić timera: ${error.message}`);
      },
    });
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  }

  editTimeEntry(entry: TimeEntry): void {
    // Implementacja edycji wpisu czasowego
    alert(
      `Edycja wpisu czasowego o ID: ${entry.id} zostanie zaimplementowana w przyszłości.`
    );
  }

  deleteTimeEntry(entry: TimeEntry): void {
    if (confirm(`Czy na pewno chcesz usunąć ten wpis czasowy?`)) {
      // W rzeczywistej implementacji wywołamy serwis
      /*
      this.timeEntryService.deleteTimeEntry(entry.id).subscribe({
        next: () => {
          this.timeEntries = this.timeEntries.filter(e => e.id !== entry.id);
          this.calculateTotalHours();
        },
        error: (error) => {
          console.error('Błąd przy usuwaniu wpisu czasowego:', error);
          alert(`Nie udało się usunąć wpisu: ${error.message}`);
        }
      });
      */

      // Na potrzeby demonstracji usuwamy wpis lokalnie
      this.timeEntries = this.timeEntries.filter((e) => e.id !== entry.id);
      this.calculateTotalHours();
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'low':
        return 'Niski';
      case 'medium':
        return 'Średni';
      case 'high':
        return 'Wysoki';
      case 'urgent':
        return 'Pilny';
      default:
        return 'Nieznany';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Oczekujące';
      case 'in_progress':
        return 'W trakcie';
      case 'completed':
        return 'Zakończone';
      case 'cancelled':
        return 'Anulowane';
      default:
        return 'Nieznany';
    }
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate) return false;

    const now = new Date();
    const dueDate = new Date(task.dueDate);

    // Ustawienie godziny na koniec dnia
    dueDate.setHours(23, 59, 59, 999);

    return (
      now > dueDate &&
      task.status !== 'completed' &&
      task.status !== 'cancelled'
    );
  }

  openStatusModal(): void {
    if (!this.task) return;

    this.selectedStatus = this.task.status;
    this.showStatusModal = true;
  }

  updateTaskStatus(): void {
    if (!this.task || !this.selectedStatus) return;

    this.taskService
      .updateTaskStatus(this.task.id, this.selectedStatus)
      .subscribe({
        next: (updatedTask) => {
          // Aktualizuj dane zadania
          this.task = updatedTask;

          // Zamknij modal
          this.cancelStatusChange();
        },
        error: (error) => {
          console.error('Błąd przy aktualizacji statusu zadania:', error);
          alert(
            `Nie udało się zaktualizować statusu zadania: ${error.message}`
          );
        },
      });
  }

  cancelStatusChange(): void {
    this.selectedStatus = '';
    this.showStatusModal = false;
  }

  confirmDeleteTask(): void {
    this.showDeleteModal = true;
  }

  deleteTask(): void {
    if (!this.task) return;

    this.taskService.deleteTask(this.task.id).subscribe({
      next: () => {
        this.router.navigate(['/tasks']);
      },
      error: (error) => {
        console.error('Błąd przy usuwaniu zadania:', error);
        alert(`Nie udało się usunąć zadania: ${error.message}`);
        this.cancelDelete();
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }
}
