// src/app/features/tasks/task-form/task-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { Task } from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';
import { Tag } from '../../../core/models/tag.model';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
})
export class TaskFormComponent implements OnInit {
  taskId?: number;
  taskForm!: FormGroup;
  projects: Project[] = [];
  availableTags: Tag[] = [];
  selectedTags: Tag[] = [];

  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();

    // Sprawdź, czy jesteśmy w trybie edycji
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.taskId = +params['id'];
        this.isEditMode = true;
        this.loadTask();
      }
    });

    // Sprawdź, czy mamy projectId w parametrach zapytania (dla nowego zadania)
    this.route.queryParams.subscribe((params) => {
      if (params['projectId'] && !this.isEditMode) {
        const projectId = +params['projectId'];
        this.taskForm.get('projectId')?.setValue(projectId);
      }
    });
  }

  initForm(): void {
    this.taskForm = this.formBuilder.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: [''],
      projectId: [null, [Validators.required]],
      status: ['pending', [Validators.required]],
      priority: ['medium', [Validators.required]],
      estimatedHours: [null, [Validators.min(0)]],
      hourlyRate: [null, [Validators.min(0)]],
      dueDate: [null],
    });
  }

  loadInitialData(): void {
    this.isLoading = true;

    forkJoin({
      projects: this.projectService.getProjects().pipe(
        catchError((error) => {
          console.error('Błąd przy ładowaniu projektów:', error);
          return of([]);
        })
      ),
      tags: of(this.generateMockTags()), // Mockujemy tagi, w rzeczywistej implementacji użylibyśmy TagService
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((results) => {
        this.projects = results.projects;
        this.availableTags = results.tags;
      });
  }

  // Metoda do generowania przykładowych tagów (mock)
  private generateMockTags(): Tag[] {
    return [
      {
        id: 1,
        name: 'Frontend',
        color: '#4caf50',
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Backend',
        color: '#2196f3',
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Bug',
        color: '#f44336',
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 4,
        name: 'Feature',
        color: '#ff9800',
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 5,
        name: 'Documentation',
        color: '#9c27b0',
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 6,
        name: 'Testing',
        color: '#795548',
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  loadTask(): void {
    if (!this.taskId) return;

    this.isLoading = true;

    this.taskService.getTask(this.taskId).subscribe({
      next: (task) => {
        this.patchFormValues(task);

        // Przypisz tagi z zadania
        if (task.tags && task.tags.length > 0) {
          this.selectedTags = [...task.tags];

          // Aktualizuj dostępne tagi, aby uniknąć duplikatów
          this.updateAvailableTags();
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error.message || 'Nie udało się załadować danych zadania';
        this.isLoading = false;
      },
    });
  }

  patchFormValues(task: Task): void {
    this.taskForm.patchValue({
      name: task.name,
      description: task.description || '',
      projectId: task.projectId,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours || null,
      hourlyRate: task.hourlyRate || null,
      dueDate: task.dueDate ? this.formatDateForInput(task.dueDate) : null,
    });
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  addTag(tag: Tag): void {
    // Sprawdź, czy tag nie jest już wybrany
    if (!this.selectedTags.some((t) => t.id === tag.id)) {
      this.selectedTags.push(tag);
      this.updateAvailableTags();
    }
  }

  removeTag(tag: Tag): void {
    this.selectedTags = this.selectedTags.filter((t) => t.id !== tag.id);
    this.updateAvailableTags();
  }

  updateAvailableTags(): void {
    const selectedTagIds = this.selectedTags.map((tag) => tag.id);
    this.availableTags = this.generateMockTags().filter(
      (tag) => !selectedTagIds.includes(tag.id)
    );
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      // Oznacz wszystkie pola jako dotknięte, aby pokazać błędy walidacji
      Object.keys(this.taskForm.controls).forEach((key) => {
        const control = this.taskForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Przygotuj dane zadania
    const taskData = this.prepareTaskData();

    if (this.isEditMode) {
      this.updateTask(taskData);
    } else {
      this.createTask(taskData);
    }
  }

  prepareTaskData(): Partial<Task> {
    const formData = this.taskForm.value;

    // Przygotuj dane zadania z formularza
    const taskData: Partial<Task> = {
      name: formData.name,
      description: formData.description || undefined,
      projectId: formData.projectId,
      status: formData.status,
      priority: formData.priority,
      estimatedHours: formData.estimatedHours || undefined,
      hourlyRate: formData.hourlyRate || undefined,
      dueDate: formData.dueDate || undefined,
    };

    // Dodaj tagi, jeśli są wybrane
    if (this.selectedTags.length > 0) {
      taskData.tags = this.selectedTags;
    }

    return taskData;
  }

  createTask(taskData: Partial<Task>): void {
    this.taskService.createTask(taskData).subscribe({
      next: (task) => {
        this.isSubmitting = false;
        this.router.navigate(['/tasks', task.id]);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Nie udało się utworzyć zadania';
        this.isSubmitting = false;
      },
    });
  }

  updateTask(taskData: Partial<Task>): void {
    if (!this.taskId) return;

    this.taskService.updateTask(this.taskId, taskData).subscribe({
      next: (task) => {
        this.isSubmitting = false;
        this.router.navigate(['/tasks', task.id]);
      },
      error: (error) => {
        this.errorMessage =
          error.message || 'Nie udało się zaktualizować zadania';
        this.isSubmitting = false;
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  goBack(): void {
    this.location.back();
  }
}
