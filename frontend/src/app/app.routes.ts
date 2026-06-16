import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/reportes/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [roleGuard(['Administrador'])]
      },
      {
        path: 'vendedores',
        loadComponent: () => import('./features/reportes/comisionistas/comisionistas.component').then(m => m.ComisionistasComponent),
        canActivate: [roleGuard(['Administrador'])]
      },
      {
        path: 'inventario',
        loadComponent: () => import('./features/inventario/catalogo/catalogo').then(m => m.CatalogoComponent),
        canActivate: [roleGuard(['Administrador', 'Empleado'])]
      },
      {
        path: 'ventas',
        loadComponent: () => import('./features/ventas/procesar-venta/procesar-venta.component').then(m => m.ProcesarVentaComponent),
        canActivate: [roleGuard(['Administrador', 'Empleado'])]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];