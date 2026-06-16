import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // Corregimos '/comisionistas' por '/vendedores' para que coincida con app.routes.ts
  private allNavLinks = [
    { label: 'Panel Gerencial', route: '/dashboard', roles: ['Administrador'] },
    { label: 'Inventario / Catálogo', route: '/inventario', roles: ['Administrador', 'Operario', 'Empleado'] },
    { label: 'Mostrador de Ventas', route: '/ventas', roles: ['Administrador', 'Operario', 'Empleado'] },
    { label: 'Comisionistas', route: '/vendedores', roles: ['Administrador'] }
  ];

  public get filteredLinks() {
    if (!this.checkLoginStatus()) {
      return [];
    }
    const userRol = this.authService.getRol() || '';
    
    return this.allNavLinks.filter(link => 
      link.roles.map(r => r.toLowerCase()).includes(userRol.toLowerCase())
    );
  }

  public checkLoginStatus(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return this.authService.isLoggedIn();
    }
    return false;
  }

  public onLogout(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}