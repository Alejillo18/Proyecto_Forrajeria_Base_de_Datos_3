import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.sass'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  public isLoading = false;
  public errorMessage = '';

  public onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        const rolUsuario = res.usuario?.rol;

        if (rolUsuario === 'Administrador') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/ventas']);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;

        if (err.error && typeof err.error === 'object' && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else {
          this.errorMessage = 'Credenciales incorrectas.';
        }
        this.cdr.detectChanges(); 
      }
    });
  }
}