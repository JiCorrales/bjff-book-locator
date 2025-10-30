import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeName = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'appTheme';
  private readonly isBrowser: boolean;
  private readonly themeSubject: BehaviorSubject<ThemeName>;

  readonly theme$: Observable<ThemeName>;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    const initialTheme = this.resolveInitialTheme();
    this.themeSubject = new BehaviorSubject<ThemeName>(initialTheme);
    this.theme$ = this.themeSubject.asObservable();
    this.log('Initialized with theme', initialTheme);
    this.applyTheme(initialTheme);
  }

  get theme(): ThemeName {
    return this.themeSubject.value;
  }

  toggleTheme(): void {
    const nextTheme: ThemeName = this.theme === 'light' ? 'dark' : 'light';
    this.log('Toggle requested. Switching to', nextTheme);
    this.setTheme(nextTheme);
  }

  setTheme(theme: ThemeName): void {
    if (this.themeSubject.value !== theme) {
      this.themeSubject.next(theme);
      this.log('Theme subject updated to', theme);
    }

    this.persistTheme(theme);
    this.applyTheme(theme);
  }

  private resolveInitialTheme(): ThemeName {
    if (!this.isBrowser) {
      return 'dark';
    }

    const stored = localStorage.getItem(this.storageKey) as ThemeName | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }

  private persistTheme(theme: ThemeName): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.storageKey, theme);
    this.log('Persisted theme to storage', theme);
  }

  private applyTheme(theme: ThemeName): void {
    if (!this.isBrowser) {
      return;
    }

    document.body.classList.toggle('light-theme', theme === 'light');
    this.log('Applied theme to body', theme);
  }

  private log(message: string, detail: unknown): void {
    console.debug(`[ThemeService] ${message}:`, detail);
  }
}
