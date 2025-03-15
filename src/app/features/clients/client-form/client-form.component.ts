// src/app/features/clients/client-form/client-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss'],
})
export class ClientFormComponent implements OnInit {
  clientId?: number;
  clientForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Sprawdź, czy jesteśmy w trybie edycji
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.clientId = +params['id'];
        this.isEditMode = true;
        this.loadClient();
      }
    });
  }

  initForm(): void {
    this.clientForm = this.formBuilder.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      email: ['', [Validators.email]],
      phone: [
        '',
        [
          Validators.pattern(
            /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{3,6}$/
          ),
        ],
      ],
      address: [''],
      notes: [''],
      isActive: [true],
    });
  }

  loadClient(): void {
    if (!this.clientId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.clientService.getClient(this.clientId).subscribe({
      next: (client) => {
        this.patchFormValues(client);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error.message || 'Nie udało się załadować danych klienta';
        this.isLoading = false;
      },
    });
  }

  patchFormValues(client: Client): void {
    this.clientForm.patchValue({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
      isActive: client.isActive,
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      // Oznacz wszystkie pola jako dotknięte, aby pokazać błędy walidacji
      Object.keys(this.clientForm.controls).forEach((key) => {
        const control = this.clientForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode) {
      this.updateClient();
    } else {
      this.createClient();
    }
  }

  createClient(): void {
    this.clientService.createClient(this.clientForm.value).subscribe({
      next: (client) => {
        this.isSubmitting = false;
        this.router.navigate(['/clients', client.id]);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Nie udało się utworzyć klienta';
        this.isSubmitting = false;
      },
    });
  }

  updateClient(): void {
    if (!this.clientId) return;

    this.clientService
      .updateClient(this.clientId, this.clientForm.value)
      .subscribe({
        next: (client) => {
          this.isSubmitting = false;
          this.router.navigate(['/clients', client.id]);
        },
        error: (error) => {
          this.errorMessage =
            error.message || 'Nie udało się zaktualizować klienta';
          this.isSubmitting = false;
        },
      });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.clientForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  goBack(): void {
    this.location.back();
  }
}
