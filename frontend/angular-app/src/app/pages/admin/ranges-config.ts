import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  LibraryStructureService,
  ModuleNode as Mueble,
  ShelvingUnitNode as Estante,
  ShelfNode as Anaquel,
  StructureRange as CodeRange,
} from '../../services/library-structure.service';

@Component({
  selector: 'app-admin-ranges-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ranges-config.html',
  styleUrl: './ranges-config.css',
})
export class AdminRangesConfigComponent implements OnInit {
  data: Mueble[] = [];
  seleccionado: { mueble?: Mueble; estante?: Estante } = {};
  vista: 'muebles' | 'estantes' | 'anaqueles' = 'muebles';
  cargando = false;
  error?: string;

  constructor(private readonly libraryStructure: LibraryStructureService) {}

  async ngOnInit(): Promise<void> {
    this.cargando = true;
    try {
      const response = await firstValueFrom(this.libraryStructure.load());
      this.data = (response?.items ?? []).map((m) => ({
        ...m,
        estantes: m.estantes.map((e) => ({
          ...e,
          anaqueles: e.anaqueles.map((a) => ({ ...a })),
        })),
      }));
      this.seleccionado = {};
      this.vista = 'muebles';
    } catch (err) {
      console.error('[admin-ranges-config] Error al cargar datos:', err);
      this.error = 'No se pudieron obtener los rangos. Intenta más tarde.';
    } finally {
      this.cargando = false;
    }
  }

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

  guardarRango(r: CodeRange) {
    if (!this.valido(r.inicio) || !this.valido(r.fin)) {
      return;
    }
    r.actualizado = new Date().toLocaleString();
  }

  valido(code: string) {
    return /^[A-Za-z]{1,2}\d{2,4}$/.test(code);
  }
}
