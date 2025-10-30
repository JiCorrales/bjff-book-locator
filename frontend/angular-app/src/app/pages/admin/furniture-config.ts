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
    numero: 1,
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

  // Patrón para validación de códigos
  private readonly codePattern = /^[A-Za-z]{1,2}\d{2,4}$/;

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
      numero: 1, // TODO: Obtener del backend cuando esté disponible
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
    if (this.formData.numero < 1) {
      this.validationErrors.push({
        field: 'numero',
        message: 'El número debe ser mayor a 0'
      });
    }

    // Validar código inicial
    if (this.formData.codigoInicial && !this.codePattern.test(this.formData.codigoInicial)) {
      this.validationErrors.push({
        field: 'codigoInicial',
        message: 'Formato inválido. Use letras(1-2) + números(2-4). Ej: A100'
      });
    }

    // Validar código final
    if (this.formData.codigoFinal && !this.codePattern.test(this.formData.codigoFinal)) {
      this.validationErrors.push({
        field: 'codigoFinal',
        message: 'Formato inválido. Use letras(1-2) + números(2-4). Ej: A199'
      });
    }

    // Validar consistencia entre códigos
    if (this.formData.codigoInicial && this.formData.codigoFinal) {
      if (this.formData.codigoInicial >= this.formData.codigoFinal) {
        this.validationErrors.push({
          field: 'codigoFinal',
          message: 'El código final debe ser mayor al código inicial'
        });
      }
    }

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
      const payload: ModuleUpdatePayload = {
        module_name: this.formData.nombre,
        module_number: this.formData.numero,
        range_start: this.formData.codigoInicial || undefined,
        range_end: this.formData.codigoFinal || undefined
      };

      const response = await this.editService.updateModule(this.formData.id, payload).toPromise();
      
      if (response?.success) {
        this.originalData = { ...this.formData };
        this.hasUnsavedChanges = false;
        this.showMessage('Cambios guardados correctamente', 'success');
      } else {
        this.showMessage(response?.message || 'Error al guardar los cambios', 'error');
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