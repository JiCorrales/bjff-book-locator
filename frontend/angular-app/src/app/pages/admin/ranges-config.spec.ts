import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { AdminRangesConfigComponent } from './ranges-config';
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

describe('AdminRangesConfigComponent', () => {
  let fixture: ComponentFixture<AdminRangesConfigComponent>;
  let theme: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRangesConfigComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: LibraryStructureService, useClass: LibraryStructureServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRangesConfigComponent);
    theme = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('renders core columns with readable headers', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headers = Array.from(compiled.querySelectorAll('thead th')).map((h) =>
      h.textContent?.trim(),
    );
    expect(headers).toContain('Mueble');
    expect(headers).toContain('Código inicial');
    expect(headers).toContain('Código final');
    expect(headers).toContain('Estado');
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
