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
import { EditStructureService } from '../../services/edit-structure.service';

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

  // Mensajes de guardado
  saveMessage = '';
  saveMessageType: 'success' | 'error' | '' = '';

  // Estados originales para revertir si hay error al guardar
  private originalUnitStates = new Map<number, 'Activo' | 'Inactivo'>();
  private originalShelfStates = new Map<number, 'Activo' | 'Inactivo'>();

  // Modal de edición
  isEditModalOpen = false;
  editingItem: EditableItem | null = null;

  // Edición en línea de filas
  editing: { type: 'module' | 'shelving-unit' | 'shelf'; id: number } | null = null;
  private originalRow: any = null;

  constructor(
    private readonly libraryStructure: LibraryStructureService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private readonly editService: EditStructureService,
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

      // Capturar estados originales para gestionar reversión en errores
      this.originalUnitStates.clear();
      this.originalShelfStates.clear();
      for (const mod of this.data) {
        for (const unit of mod.estantes) {
          this.originalUnitStates.set(unit.id, unit.rango.estado);
          for (const shelf of unit.anaqueles) {
            this.originalShelfStates.set(shelf.id, shelf.rango.estado);
          }
        }
      }
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

  async onShelvingUnitEstadoChange(estante: Estante, nuevoEstado: 'Activo' | 'Inactivo') {
    const previo = this.originalUnitStates.get(estante.id) ?? estante.rango.estado;
    try {
      const is_active = nuevoEstado === 'Activo';
      const res = await this.editService.setShelvingUnitActive(estante.id, is_active).toPromise();
      if (res?.success) {
        this.originalUnitStates.set(estante.id, nuevoEstado);
        estante.rango.actualizado = new Date().toLocaleString();
        this.showMessage('Estado del estante guardado correctamente', 'success');
      } else {
        estante.rango.estado = previo;
        this.showMessage(res?.message || 'Error al guardar estado del estante', 'error');
      }
    } catch (error: any) {
      estante.rango.estado = previo;
      const msg = error?.error?.message || error?.message || 'Error desconocido al guardar estado del estante';
      this.showMessage(msg, 'error');
    } finally {
      this.cdr.detectChanges();
    }
  }

  async onShelfEstadoChange(anaquel: Anaquel, nuevoEstado: 'Activo' | 'Inactivo') {
    const previo = this.originalShelfStates.get(anaquel.id) ?? anaquel.rango.estado;
    try {
      const is_active = nuevoEstado === 'Activo';
      const res = await this.editService.setShelfActive(anaquel.id, is_active).toPromise();
      if (res?.success) {
        this.originalShelfStates.set(anaquel.id, nuevoEstado);
        anaquel.rango.actualizado = new Date().toLocaleString();
        this.showMessage('Estado del anaquel guardado correctamente', 'success');
      } else {
        anaquel.rango.estado = previo;
        this.showMessage(res?.message || 'Error al guardar estado del anaquel', 'error');
      }
    } catch (error: any) {
      anaquel.rango.estado = previo;
      const msg = error?.error?.message || error?.message || 'Error desconocido al guardar estado del anaquel';
      this.showMessage(msg, 'error');
    } finally {
      this.cdr.detectChanges();
    }
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.saveMessage = message;
    this.saveMessageType = type;
    if (type === 'success') {
      setTimeout(() => this.clearMessage(), 3000);
    }
  }

  private clearMessage() {
    this.saveMessage = '';
    this.saveMessageType = '';
  }


  // ===== EDICIÓN EN LÍNEA =====
  isEditing(type: 'module' | 'shelving-unit' | 'shelf', id: number) {
    return this.editing?.type === type && this.editing?.id === id;
  }

  startEditModule(m: Mueble) {
    this.editing = { type: 'module', id: m.id };
    this.originalRow = {
      numero: m.numero,
      inicio: m.rango.inicio,
      fin: m.rango.fin,
      estado: m.rango.estado,
    };
  }

  startEditUnit(e: Estante) {
    this.editing = { type: 'shelving-unit', id: e.id };
    this.originalRow = {
      tmpNumero: e.numero ?? null,
      inicio: e.rango.inicio,
      fin: e.rango.fin,
      estado: e.rango.estado,
    };
  }

  startEditShelf(a: Anaquel) {
    this.editing = { type: 'shelf', id: a.id };
    this.originalRow = {
      tmpNumero: a.numero ?? null,
      inicio: a.rango.inicio,
      fin: a.rango.fin,
      estado: a.rango.estado,
    };
  }

  async saveModuleRow(m: Mueble) {
    if (!this.isEditing('module', m.id)) return;
    this.cargando = true;
    try {
      const payload: any = {};
      if (m.numero !== this.originalRow.numero) payload.module_number = m.numero;
      if (m.rango.inicio !== this.originalRow.inicio) payload.range_start = m.rango.inicio;
      if (m.rango.fin !== this.originalRow.fin) payload.range_end = m.rango.fin;

      if (Object.keys(payload).length) {
        const res = await this.editService.updateModule(m.id, payload).toPromise();
        if (!res?.success) throw new Error(res?.message || 'Error al actualizar mueble');
      }

      if (m.rango.estado !== this.originalRow.estado) {
        const resp = await this.editService.setModuleActive(m.id, m.rango.estado === 'Activo').toPromise();
        if (!resp?.success) throw new Error(resp?.message || 'Error al actualizar estado');
      }

      m.rango.actualizado = new Date().toLocaleString();
      this.showMessage('Fila guardada correctamente', 'success');
      this.editing = null;
      this.originalRow = null;
    } catch (err: any) {
      // Revertir
      m.numero = this.originalRow.numero;
      m.rango.inicio = this.originalRow.inicio;
      m.rango.fin = this.originalRow.fin;
      m.rango.estado = this.originalRow.estado;
      const msg = err?.error?.message || err?.message || 'Error al guardar cambios';
      this.showMessage(msg, 'error');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async saveUnitRow(e: Estante) {
    if (!this.isEditing('shelving-unit', e.id)) return;
    this.cargando = true;
    try {
      const unitNumber = e.numero as number | undefined;
      const payload: any = {};
      if (unitNumber != null) payload.unit_number = unitNumber;
      if (e.rango.inicio !== this.originalRow.inicio) payload.range_start = e.rango.inicio;
      if (e.rango.fin !== this.originalRow.fin) payload.range_end = e.rango.fin;

      if (Object.keys(payload).length) {
        const res = await this.editService.updateShelvingUnit(e.id, payload).toPromise();
        if (!res?.success) throw new Error(res?.message || 'Error al actualizar estante');
      }

      if (e.rango.estado !== this.originalRow.estado) {
        const resp = await this.editService.setShelvingUnitActive(e.id, e.rango.estado === 'Activo').toPromise();
        if (!resp?.success) throw new Error(resp?.message || 'Error al actualizar estado');
      }

      e.rango.actualizado = new Date().toLocaleString();
      this.showMessage('Fila guardada correctamente', 'success');
      this.editing = null;
      this.originalRow = null;
    } catch (err: any) {
      // Revertir
      e.numero = this.originalRow.tmpNumero;
      e.rango.inicio = this.originalRow.inicio;
      e.rango.fin = this.originalRow.fin;
      e.rango.estado = this.originalRow.estado;
      const msg = err?.error?.message || err?.message || 'Error al guardar cambios';
      this.showMessage(msg, 'error');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async saveShelfRow(a: Anaquel) {
    if (!this.isEditing('shelf', a.id)) return;
    this.cargando = true;
    try {
      const shelfNumber = a.numero as number | undefined;
      const payload: any = {};
      if (shelfNumber != null) payload.shelf_number = shelfNumber;
      if (a.rango.inicio !== this.originalRow.inicio) payload.range_start = a.rango.inicio;
      if (a.rango.fin !== this.originalRow.fin) payload.range_end = a.rango.fin;

      if (Object.keys(payload).length) {
        const res = await this.editService.updateShelf(a.id, payload).toPromise();
        if (!res?.success) throw new Error(res?.message || 'Error al actualizar anaquel');
      }

      if (a.rango.estado !== this.originalRow.estado) {
        const resp = await this.editService.setShelfActive(a.id, a.rango.estado === 'Activo').toPromise();
        if (!resp?.success) throw new Error(resp?.message || 'Error al actualizar estado');
      }

      a.rango.actualizado = new Date().toLocaleString();
      this.showMessage('Fila guardada correctamente', 'success');
      this.editing = null;
      this.originalRow = null;
    } catch (err: any) {
      // Revertir
      a.numero = this.originalRow.tmpNumero;
      a.rango.inicio = this.originalRow.inicio;
      a.rango.fin = this.originalRow.fin;
      a.rango.estado = this.originalRow.estado;
      const msg = err?.error?.message || err?.message || 'Error al guardar cambios';
      this.showMessage(msg, 'error');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
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
