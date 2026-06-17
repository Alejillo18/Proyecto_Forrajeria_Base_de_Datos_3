import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/reportes/dashboard/dashboard.component';
import { CatalogoComponent } from './features/inventario/catalogo/catalogo';
import { ProcesarVentaComponent } from './features/ventas/procesar-venta/procesar-venta.component';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] } 
  },
  { 
    path: 'inventario', 
    component: CatalogoComponent, 
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Operario'] } 
  },
  { 
    path: 'ventas', 
    component: ProcesarVentaComponent, 
    canActivate: [roleGuard],
    data: { roles: ['Administrador', 'Operario'] } 
  },
  { path: '**', redirectTo: '/login' }
];