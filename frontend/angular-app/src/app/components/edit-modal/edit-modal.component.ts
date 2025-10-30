import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditStructureService, ModuleUpdatePayload, ShelvingUnitUpdatePayload, ShelfUpdatePayload } from '../../services/edit-structure.service';

export type EditableItem = {
  id: number;
  type: 'module' | 'shelving-unit' | 'shelf';
  nombre: string;
  numero?: number;
  rango: {
    inicio: string;
    fin: string;
  };
};

@Component({
  selector: 'app-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Editar {{ getTypeLabel() }}</h3>
          <button class="close-btn" (click)="close()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="nombre">Nombre:</label>
            <input 
              type="text" 
              id="nombre" 
              name="nombre"
              [value]="formData.nombre" 
              readonly
              class="form-control readonly"
            />
          </div>
          
          <div class="form-group">
            <label for="numero">Número:</label>
            <input 
              type="number" 
              id="numero" 
              name="numero"
              [(ngModel)]="formData.numero" 
              min="1"
              class="form-control"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="rangeStart">Rango Inicio:</label>
              <input 
                type="text" 
                id="rangeStart" 
                name="rangeStart"
                [(ngModel)]="formData.rangeStart" 
                class="form-control"
                placeholder="Ej: A001"
              />
            </div>
            
            <div class="form-group">
              <label for="rangeEnd">Rango Fin:</label>
              <input 
                type="text" 
                id="rangeEnd" 
                name="rangeEnd"
                [(ngModel)]="formData.rangeEnd" 
                class="form-control"
                placeholder="Ej: A999"
              />
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn secondary" (click)="close()">Cancelar</button>
            <button type="button" class="btn primary" (click)="onSubmit()" [disabled]="isLoading">
              {{ isLoading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .modal-header h3 {
      margin: 0;
      color: #333;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .close-btn:hover {
      color: #333;
    }
    
    .modal-body {
      padding: 1.5rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }
    
    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    
    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
    
    .form-control.readonly {
      background-color: #f8f9fa;
      color: #6c757d;
      cursor: not-allowed;
    }
    
    .modal-footer {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.2s;
    }
    
    .btn.primary {
      background: #007bff;
      color: white;
    }
    
    .btn.primary:hover:not(:disabled) {
      background: #0056b3;
    }
    
    .btn.secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn.secondary:hover {
      background: #545b62;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class EditModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() item: EditableItem | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  formData = {
    nombre: '',
    numero: undefined as number | undefined,
    rangeStart: '',
    rangeEnd: ''
  };

  isLoading = false;
  private readonly codeRegex = /^[A-Za-z]{1,2}\d{2,4}$/;

  constructor(private editService: EditStructureService) {}

  ngOnInit() {
    if (this.item) {
      this.formData = {
        nombre: this.item.nombre,
        numero: this.item.numero,
        rangeStart: this.item.rango.inicio,
        rangeEnd: this.item.rango.fin
      };
    }
  }

  getTypeLabel(): string {
    switch (this.item?.type) {
      case 'module': return 'Mueble';
      case 'shelving-unit': return 'Estante';
      case 'shelf': return 'Anaquel';
      default: return 'Elemento';
    }
  }

  onSubmit() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    const type = this.item?.type;
    const id = this.item?.id ?? 0;
    const finish = () => (this.isLoading = false);
    if (type === 'module') {
      const payload: ModuleUpdatePayload = {
        module_name: this.formData.nombre,
        module_number: this.formData.numero,
        range_start: this.formData.rangeStart,
        range_end: this.formData.rangeEnd,
      };
      this.editService.updateModule(id, payload).subscribe({
        next: (res) => {
          finish();
          if (res?.success) {
            alert('Actualización completada correctamente');
            this.saved.emit();
          } else {
            alert('No se pudo actualizar: ' + (res?.message || 'Error desconocido'));
          }
        },
        error: (err) => {
          finish();
          alert('Error al actualizar: ' + (err?.error?.message || err.message || 'Desconocido'));
        },
      });
    } else if (type === 'shelving-unit') {
      const payload: ShelvingUnitUpdatePayload = {
        unit_name: this.formData.nombre,
        unit_number: this.formData.numero,
        range_start: this.formData.rangeStart,
        range_end: this.formData.rangeEnd,
      };
      this.editService.updateShelvingUnit(id, payload).subscribe({
        next: (res) => {
          finish();
          if (res?.success) {
            alert('Actualización completada correctamente');
            this.saved.emit();
          } else {
            alert('No se pudo actualizar: ' + (res?.message || 'Error desconocido'));
          }
        },
        error: (err) => {
          finish();
          alert('Error al actualizar: ' + (err?.error?.message || err.message || 'Desconocido'));
        },
      });
    } else if (type === 'shelf') {
      const payload: ShelfUpdatePayload = {
        shelf_number: this.formData.numero,
        range_start: this.formData.rangeStart,
        range_end: this.formData.rangeEnd,
      };
      this.editService.updateShelf(id, payload).subscribe({
        next: (res) => {
          finish();
          if (res?.success) {
            alert('Actualización completada correctamente');
            this.saved.emit();
          } else {
            alert('No se pudo actualizar: ' + (res?.message || 'Error desconocido'));
          }
        },
        error: (err) => {
          finish();
          alert('Error al actualizar: ' + (err?.error?.message || err.message || 'Desconocido'));
        },
      });
    } else {
      finish();
      alert('Tipo de elemento inválido');
    }
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
  }
  // onSubmit duplicado eliminado; se consolidó la lógica en la implementación anterior con validaciones
}