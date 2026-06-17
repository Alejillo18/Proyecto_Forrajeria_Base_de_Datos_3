import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'jwt_token';
  private readonly ROLE_KEY = 'user_role';

  login(credentials: any): Observable<any> {
    const { email, password } = credentials;

    if (email !== 'admin@test.com' && email !== 'operario@forrajería.com') {
      return throwError(() => ({
        error: { message: 'El usuario no está registrado en el sistema.' }
      })).pipe(delay(1000));
    }

    if (password !== '123456') {
      return throwError(() => ({
        error: { message: 'Contraseña incorrecta. Intente nuevamente.' }
      })).pipe(delay(1000));
    }
    const mockResponse = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenForrajeríaElTrebol2026',
      user: {
        email: email,
        nombre: 'Alejo Oviedo',
        rol: 'Administrador'
      }
    };


    return of(mockResponse).pipe(
      delay(1000),
      tap(res => {

        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.ROLE_KEY, res.user.rol);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRol(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
  }
}