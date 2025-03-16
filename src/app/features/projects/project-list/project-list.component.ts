// src/app/features/projects/project-list/project-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { ProjectService } from '../../../core/services/project.service';
import { Client } from '../../../core/models/client.model';
import { Project } from '../../../core/models/project.model';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  clients: Client[] = [];
  projectTaskCounts: { [key: number]: number } = {};

  isLoading = true;
  errorMessage = '';

  // Filters
  searchTerm = '';
  clientFilter = 'all';
  statusFilter = 'all';
  sortBy = 'name';
  sortDirection = 'asc';

  // Status change modal
  showStatusModal = false;
  projectToUpdate: Project | null = null;
  selectedStatus = '';

  // Delete modal
  showDeleteModal = false;
  projectToDelete: Project | null = null;

  constructor(
    private projectService: ProjectService,
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Pobierz projekty i klientów równolegle
    forkJoin({
      projects: this.projectService.getProjects().pipe(
        catchError((error) => {
          this.errorMessage =
            error.message || 'Nie udało się załadować projektów';
          return of([]);
        })
      ),
      clients: this.clientService.getClients().pipe(
        catchError((error) => {
          console.error('Błąd przy ładowaniu klientów:', error);
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
        this.projects = results.projects;
        this.clients = results.clients;

        // Dołącz dane klientów do projektów
        this.attachClientsToProjects();

        // Zastosuj filtry
        this.applyFilters();

        // Pobierz liczby zadań dla każdego projektu
        this.loadProjectTaskCounts();
      });
  }

  loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.attachClientsToProjects();
        this.applyFilters();
        this.loadProjectTaskCounts();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error.message || 'Nie udało się załadować projektów';
        this.isLoading = false;
      },
    });
  }

  attachClientsToProjects(): void {
    // Mapowanie id klienta na obiekt klienta dla szybkiego dostępu
    const clientMap = new Map<number, Client>();
    this.clients.forEach((client) => clientMap.set(client.id, client));

    // Dołącz dane klienta do każdego projektu
    this.projects.forEach((project) => {
      if (project.clientId && clientMap.has(project.clientId)) {
        project.client = clientMap.get(project.clientId);
      }
    });
  }

  loadProjectTaskCounts(): void {
    // Dla każdego projektu pobierz liczbę zadań
    this.projects.forEach((project) => {
      // W rzeczywistej implementacji pobieraj dane z API
      // Tutaj używamy mocka z losową liczbą zadań
      this.projectTaskCounts[project.id] = Math.floor(Math.random() * 15);

      // Rzeczywista implementacja mogłaby wyglądać tak:
      /*
      this.projectService.getProjectTaskCount(project.id).subscribe({
        next: (count) => {
          this.projectTaskCounts[project.id] = count;
        },
        error: (error) => {
          console.error(`Błąd przy pobieraniu liczby zadań dla projektu ${project.id}:`, error);
        }
      });
      */
    });
  }

  applyFilters(): void {
    let result = [...this.projects];

    // Filtrowanie po wyszukiwanej frazie
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(search) ||
          (project.description &&
            project.description.toLowerCase().includes(search)) ||
          (project.client && project.client.name.toLowerCase().includes(search))
      );
    }

    // Filtrowanie po kliencie
    if (this.clientFilter !== 'all') {
      const clientId = parseInt(this.clientFilter, 10);
      result = result.filter((project) => project.clientId === clientId);
    }

    // Filtrowanie po statusie
    if (this.statusFilter !== 'all') {
      result = result.filter((project) => project.status === this.statusFilter);
    }

    // Sortowanie
    result.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'clientName':
          const clientNameA = a.client ? a.client.name : '';
          const clientNameB = b.client ? b.client.name : '';
          comparison = clientNameA.localeCompare(clientNameB);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'startDate':
          const startDateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const startDateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          comparison = startDateA - startDateB;
          break;
        case 'endDate':
          const endDateA = a.endDate ? new Date(a.endDate).getTime() : 0;
          const endDateB = b.endDate ? new Date(b.endDate).getTime() : 0;
          comparison = endDateA - endDateB;
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

    this.filteredProjects = result;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Aktywny';
      case 'paused':
        return 'Wstrzymany';
      case 'completed':
        return 'Zakończony';
      case 'cancelled':
        return 'Anulowany';
      default:
        return 'Nieznany';
    }
  }

  viewProjectDetails(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  editProject(project: Project, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/projects', project.id, 'edit']);
  }

  openStatusModal(project: Project, event: Event): void {
    event.stopPropagation();
    this.projectToUpdate = project;
    this.selectedStatus = project.status;
    this.showStatusModal = true;
  }

  updateProjectStatus(): void {
    if (!this.projectToUpdate || !this.selectedStatus) return;

    this.projectService
      .updateProjectStatus(this.projectToUpdate.id, this.selectedStatus)
      .subscribe({
        next: (updatedProject) => {
          // Aktualizuj projekt w listach
          const index = this.projects.findIndex(
            (p) => p.id === updatedProject.id
          );
          if (index !== -1) {
            this.projects[index] = updatedProject;

            // Dodaj dane klienta, które mogły być usunięte w API
            if (this.projects[index].clientId) {
              const client = this.clients.find(
                (c) => c.id === this.projects[index].clientId
              );
              if (client) {
                this.projects[index].client = client;
              }
            }

            // Zastosuj filtry, aby zaktualizować widok
            this.applyFilters();
          }

          // Zamknij modal
          this.cancelStatusChange();
        },
        error: (error) => {
          console.error('Błąd przy aktualizacji statusu projektu:', error);
          alert(
            `Nie udało się zaktualizować statusu projektu: ${error.message}`
          );
        },
      });
  }

  cancelStatusChange(): void {
    this.projectToUpdate = null;
    this.selectedStatus = '';
    this.showStatusModal = false;
  }

  confirmDeleteProject(project: Project, event: Event): void {
    event.stopPropagation();
    this.projectToDelete = project;
    this.showDeleteModal = true;
  }

  deleteProject(): void {
    if (!this.projectToDelete) return;

    this.projectService.deleteProject(this.projectToDelete.id).subscribe({
      next: () => {
        // Usuń projekt z list
        this.projects = this.projects.filter(
          (p) => p.id !== this.projectToDelete!.id
        );
        this.applyFilters();

        // Zamknij modal
        this.cancelDelete();
      },
      error: (error) => {
        console.error('Błąd przy usuwaniu projektu:', error);
        alert(`Nie udało się usunąć projektu: ${error.message}`);
      },
    });
  }

  cancelDelete(): void {
    this.projectToDelete = null;
    this.showDeleteModal = false;
  }
}
