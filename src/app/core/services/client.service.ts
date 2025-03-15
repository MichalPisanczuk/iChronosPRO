// src/app/core/services/client.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private path = '/clients';

  constructor(private apiService: ApiService) {}

  getClients(): Observable<Client[]> {
    return this.apiService
      .get<{ status: string; data: { clients: Client[] } }>(this.path)
      .pipe(map((response) => response.data.clients));
  }

  getClient(id: number): Observable<Client> {
    return this.apiService
      .get<{ status: string; data: { client: Client } }>(`${this.path}/${id}`)
      .pipe(map((response) => response.data.client));
  }

  createClient(client: Partial<Client>): Observable<Client> {
    return this.apiService
      .post<{ status: string; data: { client: Client } }>(this.path, client)
      .pipe(map((response) => response.data.client));
  }

  updateClient(id: number, client: Partial<Client>): Observable<Client> {
    return this.apiService
      .put<{ status: string; data: { client: Client } }>(
        `${this.path}/${id}`,
        client
      )
      .pipe(map((response) => response.data.client));
  }

  deleteClient(id: number): Observable<any> {
    return this.apiService.delete<{ status: string; message: string }>(
      `${this.path}/${id}`
    );
  }

  toggleClientStatus(id: number): Observable<Client> {
    return this.apiService
      .patch<{ status: string; data: { client: Client } }>(
        `${this.path}/${id}/toggle-status`
      )
      .pipe(map((response) => response.data.client));
  }
}
