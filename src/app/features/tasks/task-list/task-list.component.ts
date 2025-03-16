// src/app/features/tasks/task-list/task-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { Task } from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  projects: Project[] = [];

  isLoading = true;
  errorMessage = '';

  // Filters
  searchTerm = '';
  projectFilter = 'all';
  statusFilter = 'all';
  priorityFilter = 'all';
  sortBy = 'dueDate';
  sortDirection = 'asc';

  // Status change modal
  showStatusModal = false;
  taskToUpdate: Task | null = null;
  selectedStatus = '';

  // Delete modal
  showDeleteModal = false;
  taskToDelete: Task | null = null;

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Pobierz zadania i projekty równolegle
    forkJoin({
      tasks: this.taskService.getTasks().pipe(
        catchError((error) => {
          this.errorMessage = error.message || 'Nie udało się załadować zadań';
          return of([]);
        })
      ),
      projects: this.projectService.getProjects().pipe(
        catchError((error) => {
          console.error('Błąd przy ładowaniu projektów:', error);
          return of([]);
        })
      ),
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((results) => {
        this.tasks = results.tasks;
        this.projects = results.projects;

        // Dołącz dane projektów do zadań
        this.attachProjectsToTasks();

        // Zastosuj filtry
        this.applyFilters();
      });
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.attachProjectsToTasks();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Nie udało się załadować zadań';
        this.isLoading = false;
      },
    });
  }

  attachProjectsToTasks(): void {
    // Mapowanie id projektu na obiekt projektu dla szybkiego dostępu
    const projectMap = new Map<number, Project>();
    this.projects.forEach((project) => projectMap.set(project.id, project));

    // Dołącz dane projektu do każdego zadania
    this.tasks.forEach((task) => {
      if (task.projectId && projectMap.has(task.projectId)) {
        task.project = projectMap.get(task.projectId);
      }
    });
  }

  applyFilters(): void {
    let result = [...this.tasks];

    // Filtrowanie po wyszukiwanej frazie
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(search) ||
          (task.description &&
            task.description.toLowerCase().includes(search)) ||
          (task.project && task.project.name.toLowerCase().includes(search))
      );
    }

    // Filtrowanie po projekcie
    if (this.projectFilter !== 'all') {
      const projectId = parseInt(this.projectFilter, 10);
      result = result.filter((task) => task.projectId === projectId);
    }

    // Filtrowanie po statusie
    if (this.statusFilter !== 'all') {
      result = result.filter((task) => task.status === this.statusFilter);
    }

    // Filtrowanie po priorytecie
    if (this.priorityFilter !== 'all') {
      result = result.filter((task) => task.priority === this.priorityFilter);
    }

    // Sortowanie
    result.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'priority':
          const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
          comparison =
            priorityOrder[a.priority as keyof typeof priorityOrder] -
            priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'status':
          const statusOrder = {
            pending: 0,
            in_progress: 1,
            completed: 2,
            cancelled: 3,
          };
          comparison =
            statusOrder[a.status as keyof typeof statusOrder] -
            statusOrder[b.status as keyof typeof statusOrder];
          break;
        case 'dueDate':
          const dueDateA = a.dueDate
            ? new Date(a.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          const dueDateB = b.dueDate
            ? new Date(b.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          comparison = dueDateA - dueDateB;
          break;
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredTasks = result;
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

  viewTaskDetails(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }

  editTask(task: Task, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  openStatusModal(task: Task, event: Event): void {
    event.stopPropagation();
    this.taskToUpdate = task;
    this.selectedStatus = task.status;
    this.showStatusModal = true;
  }

  updateTaskStatus(): void {
    if (!this.taskToUpdate || !this.selectedStatus) return;

    this.taskService
      .updateTaskStatus(this.taskToUpdate.id, this.selectedStatus)
      .subscribe({
        next: (updatedTask) => {
          // Aktualizuj zadanie w listach
          const index = this.tasks.findIndex((t) => t.id === updatedTask.id);
          if (index !== -1) {
            this.tasks[index] = updatedTask;

            // Dodaj dane projektu, które mogły być usunięte w API
            if (this.tasks[index].projectId) {
              const project = this.projects.find(
                (p) => p.id === this.tasks[index].projectId
              );
              if (project) {
                this.tasks[index].project = project;
              }
            }

            // Zastosuj filtry, aby zaktualizować widok
            this.applyFilters();
          }

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
    this.taskToUpdate = null;
    this.selectedStatus = '';
    this.showStatusModal = false;
  }

  confirmDeleteTask(task: Task, event: Event): void {
    event.stopPropagation();
    this.taskToDelete = task;
    this.showDeleteModal = true;
  }

  deleteTask(): void {
    if (!this.taskToDelete) return;

    this.taskService.deleteTask(this.taskToDelete.id).subscribe({
      next: () => {
        // Usuń zadanie z list
        this.tasks = this.tasks.filter((t) => t.id !== this.taskToDelete!.id);
        this.applyFilters();

        // Zamknij modal
        this.cancelDelete();
      },
      error: (error) => {
        console.error('Błąd przy usuwaniu zadania:', error);
        alert(`Nie udało się usunąć zadania: ${error.message}`);
      },
    });
  }

  cancelDelete(): void {
    this.taskToDelete = null;
    this.showDeleteModal = false;
  }
}
