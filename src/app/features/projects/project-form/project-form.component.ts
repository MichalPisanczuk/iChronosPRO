// src/app/features/projects/project-form/project-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { ClientService } from '../../../core/services/client.service';
import { Project } from '../../../core/models/project.model';
import { Client } from '../../../core/models/client.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
})
export class ProjectFormComponent implements OnInit {
  projectId?: number;
  projectForm!: FormGroup;
  clients: Client[] = [];
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private projectService: ProjectService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadClients();

    // Sprawdź, czy jesteśmy w trybie edycji
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.projectId = +params['id'];
        this.isEditMode = true;
        this.loadProject();
      }
    });

    // Sprawdź, czy mamy clientId w parametrach zapytania (dla nowego projektu)
    this.route.queryParams.subscribe((params) => {
      if (params['clientId'] && !this.isEditMode) {
        const clientId = +params['clientId'];
        this.projectForm.get('clientId')?.setValue(clientId);
      }
    });
  }

  initForm(): void {
    this.projectForm = this.formBuilder.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: [''],
      clientId: [null, [Validators.required]],
      status: ['active', [Validators.required]],
      startDate: [''],
      endDate: [''],
      budget: [null],
    });
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients.filter((client) => client.isActive);
      },
      error: (error) => {
        console.error('Błąd przy ładowaniu klientów:', error);
        this.errorMessage = 'Nie udało się załadować listy klientów';
      },
    });
  }

  loadProject(): void {
    if (!this.projectId) return;

    this.isLoading = true;

    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => {
        this.patchFormValues(project);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error.message || 'Nie udało się załadować danych projektu';
        this.isLoading = false;
      },
    });
  }

  patchFormValues(project: Project): void {
    this.projectForm.patchValue({
      name: project.name,
      description: project.description || '',
      clientId: project.clientId,
      status: project.status,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      budget: project.budget || null,
    });
  }

  onSubmit(): void {
    // Implementacja zostanie dodana w pełnej wersji formularza
  }

  goBack(): void {
    this.location.back();
  }
}
