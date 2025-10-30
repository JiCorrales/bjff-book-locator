import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  LibraryStructureService,
  ModuleNode as Mueble,
  ShelvingUnitNode as Estante,
  ShelfNode as Anaquel,
  StructureRange as CodeRange,
} from '../../services/library-structure.service';

@Component({
  selector: 'app-admin-ranges-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranges-view.html',
  styleUrl: './ranges-view.css',
})
export class AdminRangesViewComponent implements OnInit {
  data: Mueble[] = [];

  constructor(private readonly libraryStructure: LibraryStructureService) {}

  formato(r: CodeRange) {
    return `${r.inicio} - ${r.fin}`;
  }

  seleccionado: { mueble?: Mueble; estante?: Estante } = {};
  vista: 'muebles' | 'estantes' | 'anaqueles' = 'muebles';

  get titulo(): string {
    if (this.vista === 'muebles') return 'Muebles';
    if (this.vista === 'estantes') return 'Estantes';
    return 'Anaqueles';
  }

  get subtitulo(): string {
    if (this.vista === 'muebles') return '';
    if (this.vista === 'estantes' && this.seleccionado.mueble) {
      return this.seleccionado.mueble.nombre;
    }
    if (this.vista === 'anaqueles' && this.seleccionado.estante) {
      return `${this.seleccionado.mueble?.nombre} · ${this.seleccionado.estante.nombre}`;
    }
    return '';
  }

  seleccionarMueble(m: Mueble) {
    this.seleccionado = { mueble: m };
    this.vista = 'estantes';
  }

  seleccionarEstante(e: Estante) {
    this.seleccionado = { mueble: this.seleccionado.mueble, estante: e };
    this.vista = 'anaqueles';
  }

  volverArriba() {
    if (this.vista === 'anaqueles') {
      this.vista = 'estantes';
      this.seleccionado.estante = undefined;
    } else if (this.vista === 'estantes') {
      this.vista = 'muebles';
      this.seleccionado = {};
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      const response = await firstValueFrom(this.libraryStructure.load());
      this.data = response?.items ?? [];
    } catch (err) {
      console.error('[admin-ranges] Error al cargar datos:', err);
    }
  }
}
