import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AdminRangesViewComponent } from './ranges-view';
import { ThemeService } from '../../services/theme.service';

describe('AdminRangesViewComponent (themes)', () => {
  let fixture: ComponentFixture<AdminRangesViewComponent>;
  let component: AdminRangesViewComponent;
  let theme: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRangesViewComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRangesViewComponent);
    component = fixture.componentInstance;
    theme = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('renders table headers and action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headers = Array.from(compiled.querySelectorAll('thead th')).map(h => h.textContent?.trim());
    expect(headers.length).toBeGreaterThan(0);
    expect(compiled.querySelectorAll('.btn.view').length).toBeGreaterThan(0);
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