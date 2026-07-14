import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

function roleGuard(role: UserRole): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasRole(role)) return true;
    if (auth.hasRole('ADMIN')) return router.createUrlTree(['/dashboard']);
    if (auth.hasRole('EMPLOYEE')) return router.createUrlTree(['/entry']);
    return router.createUrlTree(['/login']);
  };
}

export const adminGuard = roleGuard('ADMIN');
export const employeeGuard = roleGuard('EMPLOYEE');

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && auth.user) {
    return router.createUrlTree([auth.user.role === 'ADMIN' ? '/dashboard' : '/entry']);
  }
  return true;
};
