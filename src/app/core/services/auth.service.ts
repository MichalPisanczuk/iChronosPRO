// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Sprawdź, czy użytkownik jest już zalogowany (token w localStorage)
    this.checkAuthStatus();
  }

  login(email: string, password: string): Observable<User> {
    return this.apiService
      .post<AuthResponse>('/auth/login', { email, password })
      .pipe(
        map((response) => {
          this.setAuth(response.data.user, response.data.token);
          return response.data.user;
        }),
        catchError((error) => {
          return throwError(
            () => new Error(error.error?.message || 'Błąd logowania')
          );
        })
      );
  }

  register(userData: any): Observable<User> {
    return this.apiService.post<AuthResponse>('/auth/register', userData).pipe(
      map((response) => {
        this.setAuth(response.data.user, response.data.token);
        return response.data.user;
      }),
      catchError((error) => {
        return throwError(
          () => new Error(error.error?.message || 'Błąd rejestracji')
        );
      })
    );
  }

  logout(): void {
    // Usuwamy token i dane użytkownika
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setAuth(user: User, token: string): void {
    // Zapisujemy token i dane użytkownika
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
      this.isAuthenticatedSubject.next(true);
    }
  }

  refreshToken(): Observable<string> {
    return this.apiService
      .post<{ status: string; data: { token: string } }>('/auth/refresh-token')
      .pipe(
        map((response) => {
          localStorage.setItem('token', response.data.token);
          return response.data.token;
        })
      );
  }
}
