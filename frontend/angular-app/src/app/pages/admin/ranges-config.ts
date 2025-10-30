import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  LibraryStructureService,
  ModuleNode as Mueble,
  ShelvingUnitNode as Estante,
  ShelfNode as Anaquel,
  StructureRange as CodeRange,
} from '../../services/library-structure.service';
import { EditModalComponent, EditableItem } from '../../components/edit-modal/edit-modal.component';

@Component({
  selector: 'app-admin-ranges-config',
  standalone: true,
  imports: [CommonModule, FormsModule, EditModalComponent],
  templateUrl: './ranges-config.html',
  styleUrl: './ranges-config.css',
})
export class AdminRangesConfigComponent implements OnInit {
  data: Mueble[] = [];
  seleccionado: { mueble?: Mueble; estante?: Estante } = {};
  vista: 'muebles' | 'estantes' | 'anaqueles' = 'muebles';
  cargando = false;
  error?: string;

  // Modal de edición
  isEditModalOpen = false;
  editingItem: EditableItem | null = null;

  constructor(
    private readonly libraryStructure: LibraryStructureService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
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
      // Forzar render en modo zoneless
      this.cdr.detectChanges();
    } catch (err) {
      console.error('[admin-ranges-config] Error al cargar datos:', err);
      this.error = 'No se pudieron obtener los rangos. Intenta más tarde.';
    } finally {
      this.cargando = false;
      // Asegurar refresco al terminar la carga
      this.cdr.detectChanges();
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



  editEstante(estante: Estante) {
    // TODO: Obtener unit_number del meta cuando esté disponible
    this.editingItem = {
      type: 'shelving-unit',
      id: estante.id,
      nombre: estante.nombre,
      numero: 1, // TODO: Obtener del meta cuando esté disponible
      rango: {
        inicio: estante.rango.inicio,
        fin: estante.rango.fin
      }
    };
    this.isEditModalOpen = true;
  }

  editAnaquel(anaquel: Anaquel) {
    // TODO: Obtener shelf_number del meta cuando esté disponible
    this.editingItem = {
      type: 'shelf',
      id: anaquel.id,
      nombre: anaquel.nombre,
      numero: 1, // TODO: Obtener del meta cuando esté disponible
      rango: {
        inicio: anaquel.rango.inicio,
        fin: anaquel.rango.fin
      }
    };
    this.isEditModalOpen = true;
  }

  onEditModalClosed() {
    this.isEditModalOpen = false;
    this.editingItem = null;
  }

  async onEditModalSaved() {
    this.isEditModalOpen = false;
    this.editingItem = null;
    await this.loadData();
  }

  editMueble(mueble: Mueble) {
    this.router.navigate(['/admin/furniture-config', mueble.id]);
  }
}
