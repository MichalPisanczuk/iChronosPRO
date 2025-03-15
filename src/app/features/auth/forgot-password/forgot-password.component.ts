// src/app/features/auth/forgot-password/forgot-password.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isSubmitting = false;
  isSubmitted = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { email } = this.forgotPasswordForm.value;

    // Tutaj będzie wywołanie serwisu do zresetowania hasła
    // Na razie tylko symulujemy odpowiedź
    setTimeout(() => {
      this.isSubmitting = false;
      this.isSubmitted = true;
    }, 1000);

    // Po implementacji serwisu:
    /*
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSubmitted = true;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Błąd wysyłania linku do resetowania hasła';
        this.isSubmitting = false;
      }
    });
    */
  }
}
