import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'admin' | 'assistant' | 'isMaster';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  fullName: string | null;
  email: string | null;
  token: string | null;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: UserRole;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'bjff.auth';
  readonly state = signal<AuthState>({
    isAuthenticated: false,
    role: null,
    fullName: null,
    email: null,
    token: null,
  });

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly http = inject(HttpClient);

  constructor() {
    if (this.isBrowser) {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AuthState;
          this.state.set(parsed);
        } catch {
          localStorage.removeItem(this.storageKey);
        }
      }
    }
  }

  async login(email: string, password: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>('/api/auth/login', { email, password }),
      );

      const auth: AuthState = {
        isAuthenticated: true,
        role: response.user.role,
        fullName: response.user.fullName,
        email: response.user.email,
        token: response.token,
      };

      this.state.set(auth);
      if (this.isBrowser) {
        localStorage.setItem(this.storageKey, JSON.stringify(auth));
      }

      return { ok: true };
    } catch (error: any) {
      const message: string =
        error?.error?.error?.message || 'Credenciales inválidas. Intenta nuevamente.';
      return { ok: false, message };
    }
  }

  logout(): void {
    const auth: AuthState = {
      isAuthenticated: false,
      role: null,
      fullName: null,
      email: null,
      token: null,
    };
    this.state.set(auth);
    if (this.isBrowser) {
      localStorage.removeItem(this.storageKey);
    }
  }

  getRole(): UserRole | null {
    return this.state().role;
  }

  isLoggedIn(): boolean {
    return this.state().isAuthenticated;
  }

  getToken(): string | null {
    return this.state().token;
  }
}
