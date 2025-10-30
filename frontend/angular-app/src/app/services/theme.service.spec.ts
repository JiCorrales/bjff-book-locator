import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService, ThemeName } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideZonelessChangeDetection(),
      ]
    });
    service = TestBed.inject(ThemeService);
    // Reset body class before each test
    document.body.classList.remove('light-theme');
  });

  it('initializes with a valid theme', () => {
    const theme: ThemeName = service.theme;
    expect(['light', 'dark']).toContain(theme);
  });

  it('applies light theme to body', () => {
    service.setTheme('light');
    expect(document.body.classList.contains('light-theme')).toBeTrue();
  });

  it('applies dark theme to body', () => {
    service.setTheme('dark');
    expect(document.body.classList.contains('light-theme')).toBeFalse();
  });

  it('toggles theme between light and dark', () => {
    service.setTheme('light');
    service.toggleTheme();
    expect(service.theme).toBe('dark');
    expect(document.body.classList.contains('light-theme')).toBeFalse();

    service.toggleTheme();
    expect(service.theme).toBe('light');
    expect(document.body.classList.contains('light-theme')).toBeTrue();
  });
});