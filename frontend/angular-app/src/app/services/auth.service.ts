import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type UserRole = 'admin' | 'assistant';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  username: string | null;
}

// Nota: Este servicio usa credenciales locales de ejemplo.
// En producción, reemplazar por peticiones a backend y JWT.
const VALID_USERS: Record<string, { password: string; role: UserRole }> = {
  'admin': { password: 'admin123', role: 'admin' },
  'assistant': { password: 'assistant123', role: 'assistant' }
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'bjff.auth';
  readonly state = signal<AuthState>({ isAuthenticated: false, role: null, username: null });

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    if (this.isBrowser) {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AuthState;
          this.state.set(parsed);
        } catch {}
      }
    }
  }

  login(username: string, password: string): Promise<boolean> {
    // Simular login sin backend.
    const user = VALID_USERS[username];
    const ok = !!user && user.password === password;
    if (ok) {
      const auth: AuthState = { isAuthenticated: true, role: user.role, username };
      this.state.set(auth);
      if (this.isBrowser) {
        localStorage.setItem(this.storageKey, JSON.stringify(auth));
      }
    }
    return Promise.resolve(ok);
  }

  logout(): void {
    const auth: AuthState = { isAuthenticated: false, role: null, username: null };
    this.state.set(auth);
    if (this.isBrowser) {
      localStorage.removeItem(this.storageKey);
    }
  }

  getRole(): UserRole | null { return this.state().role; }
  isLoggedIn(): boolean { return this.state().isAuthenticated; }
}