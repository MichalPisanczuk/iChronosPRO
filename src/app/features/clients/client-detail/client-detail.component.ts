// src/app/features/clients/client-detail/client-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { ProjectService } from '../../../core/services/project.service';
import { Client } from '../../../core/models/client.model';
import { Project } from '../../../core/models/project.model';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
})
export class ClientDetailComponent implements OnInit {
  clientId!: number;
  client: Client | null = null;
  clientProjects: Project[] = [];
  projectTaskCounts: { [key: number]: number } = {};

  isLoading = true;
  isLoadingProjects = true;
  errorMessage = '';

  // Delete modal
  showDeleteModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.clientId = +params['id'];
      this.loadClient();
    });
  }

  loadClient(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.clientService.getClient(this.clientId).subscribe({
      next: (client) => {
        this.client = client;
        this.isLoading = false;
        this.loadClientProjects();
      },
      error: (error) => {
        this.errorMessage =
          error.message || 'Nie udało się załadować danych klienta';
        this.isLoading = false;
      },
    });
  }

  loadClientProjects(): void {
    this.isLoadingProjects = true;

    this.projectService.getClientProjects(this.clientId).subscribe({
      next: (projects) => {
        this.clientProjects = projects;
        this.loadProjectTaskCounts();
      },
      error: (error) => {
        console.error('Błąd przy ładowaniu projektów klienta:', error);
        this.isLoadingProjects = false;
      },
    });
  }

  loadProjectTaskCounts(): void {
    if (this.clientProjects.length === 0) {
      this.isLoadingProjects = false;
      return;
    }

    // Przygotuj tablicę obserwatorów - po jednym dla każdego projektu
    const taskCountRequests = this.clientProjects.map((project) => {
      // Tutaj można wykorzystać serwis ProjectService, który powinien mieć metodę
      // do pobierania liczby zadań dla danego projektu. W przypadku braku takiej metody,
      // symulujemy to za pomocą of() i losowej liczby.
      // W rzeczywistej implementacji użyj właściwej metody API

      return of(Math.floor(Math.random() * 10)).pipe(
        catchError((error) => {
          console.error(
            `Błąd przy pobieraniu zadań dla projektu ${project.id}:`,
            error
          );
          return of(0);
        })
      );
    });

    // Użyj forkJoin do równoległego wykonania wszystkich żądań
    forkJoin(taskCountRequests)
      .pipe(
        finalize(() => {
          this.isLoadingProjects = false;
        })
      )
      .subscribe({
        next: (counts) => {
          // Przypisz wyniki do projektów
          this.clientProjects.forEach((project, index) => {
            this.projectTaskCounts[project.id] = counts[index];
          });
        },
      });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Aktywny';
      case 'completed':
        return 'Zakończony';
      case 'paused':
        return 'Wstrzymany';
      case 'cancelled':
        return 'Anulowany';
      default:
        return 'Nieznany';
    }
  }

  confirmDeleteClient(): void {
    this.showDeleteModal = true;
  }

  deleteClient(): void {
    if (!this.client) return;

    this.clientService.deleteClient(this.client.id).subscribe({
      next: () => {
        this.router.navigate(['/clients']);
      },
      error: (error) => {
        console.error('Błąd przy usuwaniu klienta:', error);
        alert(`Nie udało się usunąć klienta: ${error.message}`);
        this.cancelDelete();
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }
}
