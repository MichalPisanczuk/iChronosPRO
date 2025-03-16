// src/app/features/time-tracker/time-tracker.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { TimeEntryService } from '../../core/services/time-entry.service';
import { TaskService } from '../../core/services/task.service';
import { TimeEntry } from '../../core/models/time-entry.model';
import { Task } from '../../core/models/task.model';

interface TodaySummary {
  totalHours: number;
  entryCount: number;
  billableHours: number;
  billableAmount: number;
}

interface TaskDistribution {
  id: number;
  name: string;
  hours: number;
  percentage: number;
}

@Component({
  selector: 'app-time-tracker',
  templateUrl: './time-tracker.component.html',
  styleUrls: ['./time-tracker.component.scss'],
})
export class TimeTrackerComponent implements OnInit, OnDestroy {
  // Timer state
  activeTimer: TimeEntry | null = null;
  activeTask: Task | null = null;
  currentTime = '00:00:00';
  private timerSubscription: Subscription | null = null;

  // Modal state
  showTaskSelectorModal = false;
  showManualEntryModal = false;
  showDescriptionModal = false;

  // Data
  timeEntries: TimeEntry[] = [];
  availableTasks: Task[] = [];
  filteredTasks: Task[] = [];
  todaySummary: TodaySummary = {
    totalHours: 0,
    entryCount: 0,
    billableHours: 0,
    billableAmount: 0,
  };
  todayTasks: TaskDistribution[] = [];

  // UI state
  isLoading = true;
  hasMoreEntries = false;

  // Forms
  manualEntryForm: FormGroup;

  // Temporary state
  selectedTaskId: number | null = null;
  newEntryDescription = '';
  timerDescription = '';
  taskSearchTerm = '';

  // Task map for quick lookup
  private taskMap = new Map<number, Task>();

  // Pagination
  private currentPage = 1;
  private pageSize = 10;

  constructor(
    private timeEntryService: TimeEntryService,
    private taskService: TaskService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.manualEntryForm = this.formBuilder.group({
      taskId: [null, [Validators.required]],
      date: [this.formatDateForInput(new Date()), [Validators.required]],
      startTime: ['09:00', [Validators.required]],
      endTime: ['10:00', [Validators.required]],
      description: [''],
      isBillable: [true],
    });
  }

  ngOnInit(): void {
    // Load active timer
    this.checkActiveTimer();

    // Load time entries and tasks
    this.loadTimeEntries();
    this.loadAvailableTasks();

    // Calculate today's summary
    this.calculateTodaySummary();
  }

  ngOnDestroy(): void {
    this.stopTimerDisplay();
  }

  // Active timer methods
  checkActiveTimer(): void {
    this.timeEntryService.activeTimer.subscribe((timer) => {
      this.activeTimer = timer;

      if (timer) {
        this.isLoading = true;
        this.loadActiveTask(timer.taskId);
        this.timerDescription = timer.description || '';
        this.startTimerDisplay();
      } else {
        this.activeTask = null;
        this.stopTimerDisplay();
      }
    });
  }

  loadActiveTask(taskId: number): void {
    this.taskService.getTask(taskId).subscribe({
      next: (task) => {
        this.activeTask = task;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Błąd przy pobieraniu aktywnego zadania:', error);
        this.isLoading = false;
      },
    });
  }

  startTimerDisplay(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    this.updateDisplayTime();

    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateDisplayTime();
    });
  }

  stopTimerDisplay(): void {
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

  stopTimer(): void {
    if (!this.activeTimer) return;

    this.timeEntryService.stopTimer(this.activeTimer.id).subscribe({
      next: (stoppedEntry) => {
        // Refresh time entries after stopping
        this.loadTimeEntries();
        this.calculateTodaySummary();
      },
      error: (error) => {
        console.error('Błąd przy zatrzymywaniu timera:', error);
        alert(`Nie udało się zatrzymać timera: ${error.message}`);
      },
    });
  }

  // Task selection methods
  openTaskSelectorModal(): void {
    this.selectedTaskId = null;
    this.newEntryDescription = '';
    this.taskSearchTerm = '';
    this.filterTasks();
    this.showTaskSelectorModal = true;
  }

  filterTasks(): void {
    if (!this.taskSearchTerm.trim()) {
      this.filteredTasks = [...this.availableTasks];
      return;
    }

    const search = this.taskSearchTerm.toLowerCase().trim();
    this.filteredTasks = this.availableTasks.filter(
      (task) =>
        task.name.toLowerCase().includes(search) ||
        (task.description && task.description.toLowerCase().includes(search)) ||
        (task.project && task.project.name.toLowerCase().includes(search))
    );
  }

  selectTask(task: Task): void {
    this.selectedTaskId = task.id;
  }

  startTimerForSelectedTask(): void {
    if (!this.selectedTaskId) return;

    this.timeEntryService
      .startTimer(this.selectedTaskId, this.newEntryDescription)
      .subscribe({
        next: () => {
          this.cancelTaskSelection();
          // Active timer will be updated via subscription
        },
        error: (error) => {
          console.error('Błąd przy uruchamianiu timera:', error);
          alert(`Nie udało się uruchomić timera: ${error.message}`);
        },
      });
  }

  cancelTaskSelection(): void {
    this.showTaskSelectorModal = false;
    this.selectedTaskId = null;
    this.newEntryDescription = '';
  }

  // Description update methods
  openDescriptionModal(): void {
    if (!this.activeTimer) return;

    this.timerDescription = this.activeTimer.description || '';
    this.showDescriptionModal = true;
  }

  updateTimerDescription(): void {
    if (!this.activeTimer) return;

    // Na potrzeby demo, aktualizujemy tylko lokalnie
    // W pełnej implementacji wywołalibyśmy API
    this.activeTimer.description = this.timerDescription;
    this.cancelDescriptionUpdate();

    // Rzeczywista implementacja:
    /*
    this.timeEntryService.updateTimeEntry(this.activeTimer.id, {
      description: this.timerDescription
    }).subscribe({
      next: (updatedEntry) => {
        this.activeTimer = updatedEntry;
        this.cancelDescriptionUpdate();
      },
      error: (error) => {
        console.error('Błąd przy aktualizacji opisu:', error);
        alert(`Nie udało się zaktualizować opisu: ${error.message}`);
      }
    });
    */
  }

  cancelDescriptionUpdate(): void {
    this.showDescriptionModal = false;
  }

  // Manual entry methods
  openManualEntryModal(): void {
    this.manualEntryForm.reset({
      taskId: null,
      date: this.formatDateForInput(new Date()),
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      isBillable: true,
    });

    this.showManualEntryModal = true;
  }

  addManualEntry(): void {
    if (this.manualEntryForm.invalid) return;

    const formValue = this.manualEntryForm.value;

    // Tworzymy nowy wpis czasowy na podstawie danych z formularza
    const startDateTime = this.combineDateTime(
      formValue.date,
      formValue.startTime
    );
    const endDateTime = this.combineDateTime(formValue.date, formValue.endTime);

    // Obliczamy czas trwania w sekundach
    const durationSeconds = Math.floor(
      (endDateTime.getTime() - startDateTime.getTime()) / 1000
    );

    // Walidacja - sprawdzamy czy koniec jest po początku
    if (durationSeconds <= 0) {
      alert('Czas zakończenia musi być późniejszy niż czas rozpoczęcia');
      return;
    }

    // Przygotowujemy obiekt wpisu czasowego
    const timeEntry: Partial<TimeEntry> = {
      taskId: formValue.taskId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration: durationSeconds,
      description: formValue.description || undefined,
      isBillable: formValue.isBillable,
    };

    // Na potrzeby demo, dodajemy wpis lokalnie
    const mockId = Math.floor(Math.random() * 1000);
    const newEntry: TimeEntry = {
      ...(timeEntry as any),
      id: mockId,
      userId: 1,
      hourlyRate: this.getHourlyRateForTask(formValue.taskId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.timeEntries.unshift(newEntry);
    this.calculateTodaySummary();
    this.cancelManualEntry();

    // Rzeczywista implementacja:
    /*
    this.timeEntryService.createTimeEntry(timeEntry).subscribe({
      next: (newEntry) => {
        this.timeEntries.unshift(newEntry);
        this.calculateTodaySummary();
        this.cancelManualEntry();
      },
      error: (error) => {
        console.error('Błąd przy dodawaniu wpisu czasowego:', error);
        alert(`Nie udało się dodać wpisu: ${error.message}`);
      }
    });
    */
  }

  cancelManualEntry(): void {
    this.showManualEntryModal = false;
  }

  isManualFormFieldInvalid(fieldName: string): boolean {
    const field = this.manualEntryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Time entries management
  loadTimeEntries(): void {
    this.isLoading = true;

    // Na potrzeby demo, generujemy przykładowe wpisy
    setTimeout(() => {
      this.timeEntries = this.generateMockTimeEntries();
      this.hasMoreEntries = this.timeEntries.length >= this.pageSize;
      this.isLoading = false;
    }, 1000);

    // Rzeczywista implementacja:
    /*
    const params = {
      page: this.currentPage.toString(),
      pageSize: this.pageSize.toString(),
      sortBy: 'startTime',
      sortDirection: 'desc'
    };
    
    this.timeEntryService.getTimeEntries(params).subscribe({
      next: (entries) => {
        this.timeEntries = entries;
        this.hasMoreEntries = entries.length >= this.pageSize;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Błąd przy pobieraniu wpisów czasowych:', error);
        this.isLoading = false;
      }
    });
    */
  }

  loadMoreEntries(): void {
    this.currentPage++;

    // Na potrzeby demo, dodajemy więcej przykładowych wpisów
    const moreEntries = this.generateMockTimeEntries(this.timeEntries.length);
    this.timeEntries = [...this.timeEntries, ...moreEntries];
    this.hasMoreEntries = moreEntries.length >= this.pageSize;

    // Rzeczywista implementacja:
    /*
    const params = {
      page: this.currentPage.toString(),
      pageSize: this.pageSize.toString(),
      sortBy: 'startTime',
      sortDirection: 'desc'
    };
    
    this.timeEntryService.getTimeEntries(params).subscribe({
      next: (entries) => {
        this.timeEntries = [...this.timeEntries, ...entries];
        this.hasMoreEntries = entries.length >= this.pageSize;
      },
      error: (error) => {
        console.error('Błąd przy pobieraniu dodatkowych wpisów czasowych:', error);
      }
    });
    */
  }

  editTimeEntry(entry: TimeEntry): void {
    // Implementacja edycji wpisu czasowego
    alert(
      `Funkcja edycji wpisu czasowego (ID: ${entry.id}) zostanie zaimplementowana w przyszłości.`
    );
  }

  deleteTimeEntry(entry: TimeEntry): void {
    if (confirm('Czy na pewno chcesz usunąć ten wpis czasowy?')) {
      // Na potrzeby demo, usuwamy wpis lokalnie
      this.timeEntries = this.timeEntries.filter((e) => e.id !== entry.id);
      this.calculateTodaySummary();

      // Rzeczywista implementacja:
      /*
      this.timeEntryService.deleteTimeEntry(entry.id).subscribe({
        next: () => {
          this.timeEntries = this.timeEntries.filter(e => e.id !== entry.id);
          this.calculateTodaySummary();
        },
        error: (error) => {
          console.error('Błąd przy usuwaniu wpisu czasowego:', error);
          alert(`Nie udało się usunąć wpisu: ${error.message}`);
        }
      });
      */
    }
  }

  isActiveEntry(entry: TimeEntry): boolean {
    return this.activeTimer !== null && this.activeTimer.id === entry.id;
  }

  // Tasks management
  loadAvailableTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.availableTasks = tasks;
        this.filteredTasks = [...tasks];

        // Tworzymy mapę dla szybkiego dostępu
        this.taskMap.clear();
        tasks.forEach((task) => {
          this.taskMap.set(task.id, task);
        });
      },
      error: (error) => {
        console.error('Błąd przy pobieraniu zadań:', error);
      },
    });
  }

  getTaskName(taskId: number): string {
    return this.taskMap.get(taskId)?.name || 'Nieznane zadanie';
  }

  getProjectId(taskId: number): number | undefined {
    return this.taskMap.get(taskId)?.projectId;
  }

  getProjectName(taskId: number): string {
    const task = this.taskMap.get(taskId);
    return task?.project?.name || 'Brak projektu';
  }

  getHourlyRateForTask(taskId: number): number | undefined {
    return this.taskMap.get(taskId)?.hourlyRate;
  }

  // Summary calculations
  calculateTodaySummary(): void {
    // Na potrzeby demo, obliczamy podsumowanie na podstawie lokalnych danych
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = this.timeEntries.filter((entry) => {
      const entryDate = new Date(entry.startTime);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    // Obliczanie łącznego czasu i wartości
    let totalHours = 0;
    let billableHours = 0;
    let billableAmount = 0;

    todayEntries.forEach((entry) => {
      const durationHours = (entry.duration || 0) / 3600;
      totalHours += durationHours;

      if (entry.isBillable) {
        billableHours += durationHours;

        if (entry.hourlyRate) {
          billableAmount += durationHours * entry.hourlyRate;
        }
      }
    });

    this.todaySummary = {
      totalHours,
      entryCount: todayEntries.length,
      billableHours,
      billableAmount,
    };

    // Obliczanie rozkładu czasu na zadania
    this.calculateTaskDistribution(todayEntries);
  }

  calculateTaskDistribution(entries: TimeEntry[]): void {
    // Grupowanie wpisów wg zadań
    const taskGroups = new Map<number, number>();

    entries.forEach((entry) => {
      const taskId = entry.taskId;
      const durationHours = (entry.duration || 0) / 3600;

      if (taskGroups.has(taskId)) {
        taskGroups.set(taskId, taskGroups.get(taskId)! + durationHours);
      } else {
        taskGroups.set(taskId, durationHours);
      }
    });

    // Konwersja na listę z procentami
    const totalHours = this.todaySummary.totalHours;
    const distribution: TaskDistribution[] = [];

    taskGroups.forEach((hours, taskId) => {
      distribution.push({
        id: taskId,
        name: this.getTaskName(taskId),
        hours,
        percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
      });
    });

    // Sortowanie od największego udziału do najmniejszego
    this.todayTasks = distribution.sort((a, b) => b.hours - a.hours);
  }

  getDailyGoalPercentage(): number {
    const goalHours = 8; // Zakładamy 8-godzinny dzień pracy
    const percentage = (this.todaySummary.totalHours / goalHours) * 100;
    return Math.min(percentage, 100); // Maksymalnie 100%
  }

  // Helper methods
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
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

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  combineDateTime(dateStr: string, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Mock data generation
  private generateMockTimeEntries(offset = 0): TimeEntry[] {
    const entries: TimeEntry[] = [];
    const now = new Date();

    // Lista statusów zadań dla różnorodności
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    const priorities = ['low', 'medium', 'high', 'urgent'];

    // Generujemy losową liczbę wpisów
    const count = Math.min(this.pageSize, 10 + Math.floor(Math.random() * 5));

    for (let i = 0; i < count; i++) {
      const id = offset + i + 1;
      const taskId = Math.floor(Math.random() * 5) + 1; // Przykładowe ID zadań 1-5

      // Losowy dzień z ostatnich 7 dni
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 7));
      startDate.setHours(
        9 + Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 60),
        0
      ); // Losowa godzina 9-17

      const durationMinutes = 30 + Math.floor(Math.random() * 240); // Losowy czas 30-270 minut
      const durationSeconds = durationMinutes * 60;

      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);

      // Jeśli nie ma mapy zadań, dodajemy przykładowe zadanie
      if (!this.taskMap.has(taskId)) {
        this.taskMap.set(taskId, {
          id: taskId,
          name: `Przykładowe zadanie ${taskId}`,
          projectId: Math.floor(Math.random() * 3) + 1,
          status: statuses[Math.floor(Math.random() * statuses.length)] as any,
          priority: priorities[
            Math.floor(Math.random() * priorities.length)
          ] as any,
          userId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      entries.push({
        id,
        taskId,
        userId: 1,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        duration: durationSeconds,
        description: i % 3 === 0 ? `Praca nad zadaniem ${taskId}` : undefined,
        isBillable: Math.random() > 0.2, // 80% wpisów jest rozliczalnych
        hourlyRate: 100 + Math.floor(Math.random() * 50),
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
}
