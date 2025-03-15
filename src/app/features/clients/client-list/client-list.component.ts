// src/app/features/clients/client-list/client-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-client-list',
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Nie udało się załadować klientów';
        this.isLoading = false;
      },
    });
  }

  toggleClientStatus(client: Client): void {
    this.clientService.toggleClientStatus(client.id).subscribe({
      next: (updatedClient) => {
        const index = this.clients.findIndex((c) => c.id === client.id);
        if (index !== -1) {
          this.clients[index] = updatedClient;
        }
      },
      error: (error) => {
        console.error('Błąd przy zmianie statusu klienta:', error);
        alert(`Nie udało się zmienić statusu klienta: ${error.message}`);
      },
    });
  }

  deleteClient(client: Client, event: Event): void {
    event.stopPropagation();

    if (confirm(`Czy na pewno chcesz usunąć klienta "${client.name}"?`)) {
      this.clientService.deleteClient(client.id).subscribe({
        next: () => {
          this.clients = this.clients.filter((c) => c.id !== client.id);
        },
        error: (error) => {
          console.error('Błąd przy usuwaniu klienta:', error);
          alert(`Nie udało się usunąć klienta: ${error.message}`);
        },
      });
    }
  }
}
