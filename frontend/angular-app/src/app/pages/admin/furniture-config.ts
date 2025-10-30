import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { EditStructureService, ModuleUpdatePayload } from '../../services/edit-structure.service';
import { LibraryStructureService, ModuleNode } from '../../services/library-structure.service';

interface FurnitureFormData {
  id: number;
  numero: number;
  codigoInicial: string;
  codigoFinal: string;
  estado: 'Activo' | 'Inactivo';
  nombre: string;
}

interface ValidationError {
  field: string;
  message: string;
}

@Component({
  selector: 'app-furniture-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './furniture-config.html',
  styleUrl: './furniture-config.css'
})
export class FurnitureConfigComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly autoSave$ = new Subject<void>();
  private readonly themeService = inject(ThemeService);
  private readonly editService = inject(EditStructureService);
  private readonly structureService = inject(LibraryStructureService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Estado del componente
  formData: FurnitureFormData = {
    id: 0,
    numero: 0,
    codigoInicial: '',
    codigoFinal: '',
    estado: 'Activo',
    nombre: ''
  };

  originalData: FurnitureFormData | null = null;
  isLoading = false;
  isSaving = false;
  hasUnsavedChanges = false;
  validationErrors: ValidationError[] = [];
  saveMessage = '';
  saveMessageType: 'success' | 'error' | '' = '';

  // Validaciones simplificadas: sin validación de formato de códigos

  ngOnInit() {
    this.setupAutoSave();
    this.loadFurnitureData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    // Ctrl+S o Cmd+S para guardar
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.saveChanges();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
    }
  }

  private setupAutoSave() {
    // Auto-guardado con debounce de 2 segundos
    this.autoSave$.pipe(
      debounceTime(2000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.hasUnsavedChanges && this.isFormValid()) {
        this.saveChanges();
      }
    });
  }

  private async loadFurnitureData() {
    const furnitureId = this.route.snapshot.paramMap.get('id');
    if (!furnitureId) {
      this.router.navigate(['/admin/ranges-config']);
      return;
    }

    this.isLoading = true;
    try {
      const response = await this.structureService.load().toPromise();
      if (response?.success && response.items) {
        const furniture = response.items.find(item => item.id === parseInt(furnitureId));
        if (furniture) {
          this.loadFormData(furniture);
        } else {
          this.showMessage('Mueble no encontrado', 'error');
          this.router.navigate(['/admin/ranges-config']);
        }
      }
    } catch (error) {
      this.showMessage('Error al cargar los datos del mueble', 'error');
      console.error('Error loading furniture data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private loadFormData(furniture: ModuleNode) {
    this.formData = {
      id: furniture.id,
      numero: furniture.numero,
      codigoInicial: furniture.rango.inicio,
      codigoFinal: furniture.rango.fin,
      estado: furniture.rango.estado,
      nombre: furniture.nombre
    };

    // Guardar copia para detectar cambios
    this.originalData = { ...this.formData };
    this.hasUnsavedChanges = false;
  }

  onFieldChange() {
    this.hasUnsavedChanges = this.hasDataChanged();
    this.validateForm();
    this.clearMessage();

    // Trigger auto-save
    this.autoSave$.next();
  }

  private hasDataChanged(): boolean {
    if (!this.originalData) return false;

    return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
  }

  private validateForm(): boolean {
    this.validationErrors = [];

    // Validar nombre
    if (!this.formData.nombre.trim()) {
      this.validationErrors.push({
        field: 'nombre',
        message: 'El nombre es obligatorio'
      });
    } else if (this.formData.nombre.trim().length < 2) {
      this.validationErrors.push({
        field: 'nombre',
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    // Validar número
    if (this.formData.numero < 0) {
      this.validationErrors.push({
        field: 'numero',
        message: 'El número debe ser mayor a 0'
      });
    }

    // Sin validaciones de formato ni consistencia para códigos de identificación

    return this.validationErrors.length === 0;
  }

  private isFormValid(): boolean {
    return this.validateForm();
  }

  hasFieldError(fieldName: string): boolean {
    return this.validationErrors.some(error => error.field === fieldName);
  }

  getFieldError(fieldName: string): string {
    const error = this.validationErrors.find(error => error.field === fieldName);
    return error ? error.message : '';
  }

  async saveChanges() {
    if (!this.isFormValid() || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.clearMessage();

    try {
      const ops: Array<{ type: 'module' | 'active'; promise: Promise<any> }> = [];

      // Detectar cambios específicos contra originalData para enviar solo lo necesario
      const payload: ModuleUpdatePayload = {};
      if (this.originalData) {
        if (this.formData.nombre !== this.originalData.nombre) {
          payload.module_name = this.formData.nombre;
        }
        if (this.formData.numero !== this.originalData.numero) {
          payload.module_number = this.formData.numero;
        }
        const rangeChanged =
          this.formData.codigoInicial !== this.originalData.codigoInicial ||
          this.formData.codigoFinal !== this.originalData.codigoFinal;
        if (rangeChanged && this.formData.codigoInicial && this.formData.codigoFinal) {
          payload.range_start = this.formData.codigoInicial;
          payload.range_end = this.formData.codigoFinal;
        }
      } else {
        // Si no hay originalData, enviar lo que haya (carga inicial)
        payload.module_name = this.formData.nombre;
        payload.module_number = this.formData.numero;
        if (this.formData.codigoInicial && this.formData.codigoFinal) {
          payload.range_start = this.formData.codigoInicial;
          payload.range_end = this.formData.codigoFinal;
        }
      }

      if (Object.keys(payload).length > 0) {
        ops.push({ type: 'module', promise: this.editService.updateModule(this.formData.id, payload).toPromise() });
      }

      // Guardado de estado activo/inactivo si cambió
      const estadoCambio = this.originalData && this.formData.estado !== this.originalData.estado;
      if (estadoCambio) {
        const is_active = this.formData.estado === 'Activo';
        ops.push({ type: 'active', promise: this.editService.setModuleActive(this.formData.id, is_active).toPromise() });
      }

      if (ops.length === 0) {
        this.hasUnsavedChanges = false;
        this.showMessage('Sin cambios para guardar', 'success');
        return;
      }

      const results = await Promise.all(ops.map((o) => o.promise));

      // Evaluar resultados individuales para mantener consistencia con BD
      let anyFailed = false;
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        const type = ops[i].type;
        if (!res?.success) {
          anyFailed = true;
          // Revertir cambios de UI para el tipo que falló
          if (type === 'active' && this.originalData) {
            this.formData.estado = this.originalData.estado;
          } else if (type === 'module' && this.originalData) {
            this.formData.nombre = this.originalData.nombre;
            this.formData.numero = this.originalData.numero;
            this.formData.codigoInicial = this.originalData.codigoInicial;
            this.formData.codigoFinal = this.originalData.codigoFinal;
          }
        }
      }

      if (!anyFailed) {
        this.originalData = { ...this.formData };
        this.hasUnsavedChanges = false;
        this.showMessage('Cambios guardados correctamente', 'success');
      } else {
        this.hasUnsavedChanges = this.hasDataChanged();
        this.showMessage('Error al guardar los cambios. Se revirtieron los cambios no persistidos.', 'error');
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message || error.message || 'Error desconocido al guardar';
      this.showMessage(errorMessage, 'error');
      console.error('Error saving changes:', error);
    } finally {
      this.isSaving = false;
    }
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.saveMessage = message;
    this.saveMessageType = type;

    // Auto-clear success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => this.clearMessage(), 3000);
    }
  }

  private clearMessage() {
    this.saveMessage = '';
    this.saveMessageType = '';
  }

  goBack() {
    if (this.hasUnsavedChanges) {
      const confirmed = confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?');
      if (!confirmed) return;
    }

    this.router.navigate(['/admin/ranges-config']);
  }

  get currentTheme() {
    return this.themeService.theme;
  }
}
