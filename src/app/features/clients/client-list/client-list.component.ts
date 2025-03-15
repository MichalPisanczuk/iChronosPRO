// src/app/features/clients/client-list/client-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-client-list',
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  isLoading = true;
  errorMessage = '';

  // Filters
  searchTerm = '';
  statusFilter = 'all';
  sortBy = 'name';
  sortDirection = 'asc';

  // Delete modal
  showDeleteModal = false;
  clientToDelete: Client | null = null;

  constructor(private clientService: ClientService, private router: Router) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Nie udało się załadować klientów';
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    let result = [...this.clients];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(search) ||
          (client.email && client.email.toLowerCase().includes(search)) ||
          (client.phone && client.phone.toLowerCase().includes(search)) ||
          (client.address && client.address.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      result = result.filter((client) => client.isActive === isActive);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'isActive':
          comparison = Number(a.isActive) - Number(b.isActive);
          break;
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredClients = result;
  }

  changeSorting(column: string): void {
    if (this.sortBy === column) {
      // Toggle direction if clicking the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new column and default to ascending
      this.sortBy = column;
      this.sortDirection = 'asc';
    }

    this.applyFilters();
  }

  viewClientDetails(client: Client): void {
    this.router.navigate(['/clients', client.id]);
  }

  editClient(client: Client): void {
    this.router.navigate(['/clients', client.id, 'edit']);
  }

  toggleClientStatus(client: Client): void {
    this.clientService.toggleClientStatus(client.id).subscribe({
      next: (updatedClient) => {
        // Update client in the lists
        const index = this.clients.findIndex((c) => c.id === client.id);
        if (index !== -1) {
          this.clients[index] = updatedClient;

          // Re-apply filters to update filtered list
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Błąd przy zmianie statusu klienta:', error);
        alert(`Nie udało się zmienić statusu klienta: ${error.message}`);
      },
    });
  }

  confirmDeleteClient(client: Client): void {
    this.clientToDelete = client;
    this.showDeleteModal = true;
  }

  deleteClient(): void {
    if (!this.clientToDelete) return;

    this.clientService.deleteClient(this.clientToDelete.id).subscribe({
      next: () => {
        // Remove client from lists
        this.clients = this.clients.filter(
          (c) => c.id !== this.clientToDelete!.id
        );
        this.applyFilters();

        // Close modal
        this.cancelDelete();
      },
      error: (error) => {
        console.error('Błąd przy usuwaniu klienta:', error);
        alert(`Nie udało się usunąć klienta: ${error.message}`);
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.clientToDelete = null;
  }
}
