import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { AdminRangesViewComponent } from './ranges-view';
import { ThemeService } from '../../services/theme.service';
import {
  LibraryStructureService,
  ModuleNode,
} from '../../services/library-structure.service';

const STRUCTURE_FIXTURE: ModuleNode[] = [
  {
    id: 1,
    nombre: 'Mueble 1',
    rango: { inicio: 'A100', fin: 'A199', estado: 'Activo', actualizado: '2025-10-30 08:00' },
    estantes: [
      {
        id: 11,
        nombre: 'Estante 1',
        rango: { inicio: 'A100', fin: 'A149', estado: 'Activo', actualizado: '2025-10-30 08:00' },
        anaqueles: [
          { id: 111, nombre: 'Anaquel 1', rango: { inicio: 'A100', fin: 'A124', estado: 'Activo', actualizado: '2025-10-30 08:00' } },
        ],
      },
    ],
  },
];

class LibraryStructureServiceStub {
  load() {
    return of({ success: true, items: STRUCTURE_FIXTURE });
  }
}

describe('AdminRangesViewComponent', () => {
  let fixture: ComponentFixture<AdminRangesViewComponent>;
  let theme: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRangesViewComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: LibraryStructureService, useClass: LibraryStructureServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRangesViewComponent);
    theme = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('renders table headers and action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headers = Array.from(compiled.querySelectorAll('thead th')).map((h) =>
      h.textContent?.trim(),
    );
    expect(headers).toContain('Mueble');
    expect(compiled.querySelectorAll('.btn.view').length).toBeGreaterThan(0);
  });

  it('keeps content visible when toggling the theme', () => {
    theme.setTheme('light');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.panel')).toBeTruthy();

    theme.setTheme('dark');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.panel')).toBeTruthy();
  });
});
