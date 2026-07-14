import { Injectable } from '@angular/core';

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface AuthUser {
  id: number;
  role: UserRole;
  username?: string;
  employee_id?: string;
  employee_name?: string;
  email?: string;
  designation?: string;
  profile_image?: string | null;
}

interface StoredSession {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'attendance_session';

  setSession(token: string, user: AuthUser): void {
    localStorage.setItem(this.storageKey, JSON.stringify({ token, user }));
  }

  getSession(): StoredSession | null {
    const value = localStorage.getItem(this.storageKey);
    if (!value) return null;

    try {
      return JSON.parse(value) as StoredSession;
    } catch {
      this.logout();
      return null;
    }
  }

  get token(): string | null {
    return this.getSession()?.token ?? null;
  }

  get user(): AuthUser | null {
    return this.getSession()?.user ?? null;
  }

  get isLoggedIn(): boolean {
    const token = this.token;
    if (!token) return false;
    try {
      const b64 = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const data = JSON.parse(atob(padded));
      return typeof data.exp === 'number' && data.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  hasRole(role: UserRole): boolean {
    return this.user?.role === role;
  }

  updateUser(changes: Partial<AuthUser>): void {
    const session = this.getSession();
    if (!session) return;
    this.setSession(session.token, { ...session.user, ...changes });
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }
}
