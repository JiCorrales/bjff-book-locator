import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    // Redirigir a login si no está autenticado
    router.navigate(['/login'], { queryParams: { redirect: state.url } });
    return false;
  }

  const allowedRoles = (route.data?.['roles'] ?? []) as UserRole[];
  const role = auth.getRole();
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    // Si el rol no está permitido, redirigir a raíz
    router.navigate(['/']);
    return false;
  }

  return true;
};