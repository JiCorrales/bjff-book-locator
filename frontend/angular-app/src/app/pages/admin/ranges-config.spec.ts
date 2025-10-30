import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AdminRangesConfigComponent } from './ranges-config';
import { ThemeService } from '../../services/theme.service';

describe('AdminRangesConfigComponent (themes)', () => {
  let fixture: ComponentFixture<AdminRangesConfigComponent>;
  let component: AdminRangesConfigComponent;
  let theme: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRangesConfigComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRangesConfigComponent);
    component = fixture.componentInstance;
    theme = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('renders core columns with readable text nodes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headers = Array.from(compiled.querySelectorAll('thead th')).map(h => h.textContent?.trim());
    expect(headers).toContain('Mueble');
    expect(headers).toContain('Código inicial');
    expect(headers).toContain('Código final');
    expect(headers).toContain('Estado');
  });

  it('keeps content visible when toggling theme', () => {
    theme.setTheme('light');
    fixture.detectChanges();
    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.panel')).toBeTruthy();

    theme.setTheme('dark');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.panel')).toBeTruthy();
  });
});