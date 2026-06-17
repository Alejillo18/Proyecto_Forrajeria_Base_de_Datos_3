import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const rolesPermitidos = route.data['roles'] as Array<string>;
  const userRol = authService.getRol();

  if (!rolesPermitidos || rolesPermitidos.includes(userRol || '')) {
    return true;
  }

  router.navigate(['/']);
  return false;
};