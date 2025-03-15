// src/app/features/auth/reset-password/reset-password.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  isSubmitting = false;
  isSubmitted = false;
  errorMessage = '';
  token = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Pobieranie tokenu z parametru URL
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';

      if (!this.token) {
        this.errorMessage = 'Brak lub nieprawidłowy token resetowania hasła.';
      }
    });
  }

  initForm(): void {
    this.resetPasswordForm = this.formBuilder.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validator: this.passwordMatchValidator,
      }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.token) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { newPassword } = this.resetPasswordForm.value;

    // Tutaj będzie wywołanie serwisu do zresetowania hasła
    // Na razie tylko symulujemy odpowiedź
    setTimeout(() => {
      this.isSubmitting = false;
      this.isSubmitted = true;
    }, 1000);

    // Po implementacji serwisu:
    /*
    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSubmitted = true;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Błąd resetowania hasła';
        this.isSubmitting = false;
      }
    });
    */
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
