import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  LibraryStructureService,
  ModuleNode as Mueble,
  ShelvingUnitNode as Estante,
  ShelfNode as Anaquel,
  StructureRange as CodeRange,
} from '../../services/library-structure.service';
import { EditModalComponent, EditableItem } from '../../components/edit-modal/edit-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-ranges-view',
  standalone: true,
  imports: [CommonModule, EditModalComponent],
  templateUrl: './ranges-view.html',
  styleUrl: './ranges-view.css',
})
export class AdminRangesViewComponent implements OnInit {
  data: Mueble[] = [];
  
  // Estado del modal de edición
  isEditModalOpen = false;
  editingItem: EditableItem | null = null;

  constructor(
    private readonly libraryStructure: LibraryStructureService,
    private readonly cdr: ChangeDetectorRef,
    private readonly auth: AuthService,
  ) {}

  formato(r: CodeRange) {
    return `${r.inicio} - ${r.fin}`;
  }

  seleccionado: { mueble?: Mueble; estante?: Estante } = {};
  vista: 'muebles' | 'estantes' | 'anaqueles' = 'muebles';

  get canEdit(): boolean {
    const role = this.auth.getRole();
    return role === 'admin' || role === 'isMaster';
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

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const response = await firstValueFrom(this.libraryStructure.load());
      this.data = response?.items ?? [];
      // Forzar render en modo zoneless
      this.cdr.detectChanges();
    } catch (err) {
      console.error('[admin-ranges] Error al cargar datos:', err);
    }
  }

  // Métodos para edición
  editMueble(mueble: Mueble) {
    // Necesito acceder a los datos originales del servicio para obtener el module_number
    // Por ahora uso un valor por defecto
    this.editingItem = {
      type: 'module',
      id: mueble.id,
      nombre: mueble.nombre,
      numero: 1, // TODO: Obtener del meta cuando esté disponible
      rango: {
        inicio: mueble.rango.inicio,
        fin: mueble.rango.fin
      }
    };
    this.isEditModalOpen = true;
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
    // Recargar datos después de guardar
    await this.loadData();
    this.onEditModalClosed();
  }
}