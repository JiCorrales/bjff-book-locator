import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ModulesService, ItemDto as ModuleDto } from './modules.service';
import { ShelvingUnitsService, ItemDto as UnitDto } from './shelving-units.service';
import { ShelvesService, ItemDto as ShelfDto } from './shelves.service';

export interface StructureRange {
  inicio: string;
  fin: string;
  estado: 'Activo' | 'Inactivo';
  actualizado: string;
}

export interface ShelfNode {
  id: number;
  nombre: string;
  numero: number;
  rango: StructureRange;
}

export interface ShelvingUnitNode {
  id: number;
  nombre: string;
  orientacion: string;
  numero: number;
  rango: StructureRange;
  anaqueles: ShelfNode[];
}

export interface ModuleNode {
  id: number;
  nombre: string;
  numero: number;
  rango: StructureRange;
  estantes: ShelvingUnitNode[];
}

export interface StructureResponse {
  success: boolean;
  items: ModuleNode[];
}

@Injectable({ providedIn: 'root' })
export class LibraryStructureService {
  constructor(
    private readonly modules: ModulesService,
    private readonly units: ShelvingUnitsService,
    private readonly shelves: ShelvesService,
  ) {}

  load(): Observable<StructureResponse> {
    return forkJoin([
      this.modules.getAll(),
      this.units.getAll(),
      this.shelves.getAll(),
    ]).pipe(
      map(([modulesRes, unitsRes, shelvesRes]) => {
        const modules = modulesRes?.items ?? [];
        const units = unitsRes?.items ?? [];
        const shelves = shelvesRes?.items ?? [];

        const moduleNodes = this.buildModules(modules);
        const unitIndex = this.attachUnits(moduleNodes, units);
        this.attachShelves(unitIndex, shelves);

        return {
          success: true,
          items: moduleNodes,
        };
      }),
    );
  }

  private buildModules(source: ModuleDto[]): ModuleNode[] {
    return source.map((m) => ({
      id: Number(m.id),
      nombre: m.nombre,
      numero: Number(m.meta?.['module_number'] ?? 0),
      rango: this.toRange(m),
      estantes: [],
    }));
  }

  private attachUnits(modules: ModuleNode[], units: UnitDto[]): Map<number, ShelvingUnitNode> {
    const moduleById = new Map<number, ModuleNode>();
    for (const m of modules) {
      moduleById.set(m.id, m);
    }

    const unitIndex = new Map<number, ShelvingUnitNode>();

    for (const unit of units) {
      const moduleId = Number(unit.meta?.['module_id'] ?? 0);
      const module = moduleById.get(moduleId);
      if (!module) {
        continue;
      }

      const partNameRaw = String(unit.meta?.['part_name'] ?? '').toLowerCase();
      const orientacion = partNameRaw === 'front' ? 'Frente' : partNameRaw === 'back' ? 'Atrás' : partNameRaw || '';

      const node: ShelvingUnitNode = {
        id: Number(unit.id),
        nombre: unit.nombre,
        orientacion,
        numero: Number(unit.meta?.['unit_number'] ?? 0),
        rango: this.toRange(unit),
        anaqueles: [],
      };

      module.estantes.push(node);
      unitIndex.set(node.id, node);
    }

    return unitIndex;
  }

  private attachShelves(unitIndex: Map<number, ShelvingUnitNode>, shelves: ShelfDto[]): void {
    for (const shelf of shelves) {
      const unitId = Number(shelf.meta?.['shelving_unit_id'] ?? 0);
      const unit = unitIndex.get(unitId);
      if (!unit) {
        continue;
      }

      unit.anaqueles.push({
        id: Number(shelf.id),
        nombre: shelf.nombre,
        numero: Number(shelf.meta?.['shelf_number'] ?? 0),
        rango: this.toRange(shelf),
      });
    }
  }

  private toRange(item: { rango: string; estado: boolean; ultimaModificacion: string }): StructureRange {
    const [inicio, fin] = item.rango.split(' - ');
    return {
      inicio: inicio?.trim() ?? '',
      fin: fin?.trim() ?? '',
      estado: item.estado ? 'Activo' : 'Inactivo',
      actualizado: item.ultimaModificacion,
    };
  }
}
