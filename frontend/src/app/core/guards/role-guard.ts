import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard = (rolesPermitidos: string[]): CanActivateFn => {
  return (route, state) => {
    const router = inject(Router);
    
    let usuarioStr = null;
    if (typeof window !== 'undefined') {
      usuarioStr = localStorage.getItem('usuario');
    }

    if (!usuarioStr) {
      console.log('🔴 GUARD: No se encontró ningún usuario en localStorage. Rebotando a /login.');
      router.navigate(['/login']);
      return false;
    }

    const usuario = JSON.parse(usuarioStr);
    
    // Normalizamos el rol a formato Título (ej: "Administrador") para evitar errores de tipeo
    const rolCrudo = usuario?.rol || usuario?.role || '';
    const rolUsuario = rolCrudo.charAt(0).toUpperCase() + rolCrudo.slice(1).toLowerCase();

    console.log('--- CHEQUEO DE SEGURIDAD DEL GUARD ---');
    console.log('Objeto usuario recuperado:', usuario);
    console.log('Rol detectado y procesado:', rolUsuario);
    console.log('Roles permitidos para esta pantalla:', rolesPermitidos);
    console.log('--------------------------------------');

    if (rolesPermitidos.map(r => r.toLowerCase()).includes(rolUsuario.toLowerCase())) {
      console.log('🟢 GUARD: Acceso permitido.');
      return true;
    }

    console.log('❌ GUARD: Rol no autorizado para esta URL. Redireccionando por defecto.');
    if (rolUsuario === 'Empleado') {
      router.navigate(['/ventas']);
    } else {
      router.navigate(['/login']);
    }
    
    return false;
  };
};