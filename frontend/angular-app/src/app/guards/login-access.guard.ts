import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginAccessService } from '../services/login-access.service';

export const loginAccessGuard: CanActivateFn = (route, state) => {
  const access = inject(LoginAccessService);
  const router = inject(Router);

  if (access.consumeAccess()) {
    return true;
  }

  router.navigate(['/']);
  return false;
};