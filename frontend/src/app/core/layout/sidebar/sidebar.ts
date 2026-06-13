import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.sass'
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  public navLinks = [
    { label: 'Panel Gerencial', route: '/dashboard' },
    { label: 'Inventario / Catálogo', route: '/inventario' },
    { label: 'Mostrador de Ventas', route: '/ventas' }
  ];

  public checkLoginStatus(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return this.authService.isLoggedIn();
    }
    return false;
  }

  public onLogout(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.authService.logout();
    }
  }
}