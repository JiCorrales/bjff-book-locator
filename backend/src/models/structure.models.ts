import { RowDataPacket } from 'mysql2/promise';
import { queryRows } from '../config/database';

export interface BaseItemDto {
  id: number;
  nombre: string;
  rango: string;
  estado: boolean;
  ultimaModificacion: string;
  meta?: Record<string, number | string>;
}

const formatDate = (value: unknown): string => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

const formatRange = (start: unknown, end: unknown): string => {
  const from = typeof start === 'string' ? start : start?.toString() ?? '';
  const to = typeof end === 'string' ? end : end?.toString() ?? '';
  return `${from} - ${to}`.trim();
};

export async function listModules(): Promise<BaseItemDto[]> {
  const rows = await queryRows<RowDataPacket>(
    `SELECT m.module_id, m.module_number, m.range_start, m.range_end, m.updated_at, m.is_active, m.is_deleted
     FROM Modules m
     WHERE m.is_deleted = 0
     ORDER BY m.module_number ASC`,
  );

  return rows.map((r: any) => ({
    id: Number(r.module_id),
    nombre: `Mueble ${r.module_number ?? ''}`.trim(),
    rango: formatRange(r.range_start, r.range_end),
    estado: Boolean(r.is_active),
    ultimaModificacion: formatDate(r.updated_at),
    meta: {
      module_id: Number(r.module_id),
      module_number: Number(r.module_number),
    },
  }));
}

export async function listShelvingUnits(): Promise<BaseItemDto[]> {
  const rows = await queryRows<RowDataPacket>(
    `SELECT su.shelving_unit_id, su.unit_number, su.range_start, su.range_end, su.updated_at, su.is_active,
            mp.module_part_id, mp.part_name, m.module_id, m.module_number
     FROM Shelving_units su
     INNER JOIN Module_parts mp ON su.module_part_id = mp.module_part_id
     INNER JOIN Modules m ON mp.module_id = m.module_id
     WHERE su.is_deleted = 0
     ORDER BY m.module_number ASC, su.unit_number ASC`,
  );

  return rows.map((r: any) => ({
    id: Number(r.shelving_unit_id),
    nombre: `Estante ${r.unit_number ?? ''}`.trim(),
    rango: formatRange(r.range_start, r.range_end),
    estado: Boolean(r.is_active),
    ultimaModificacion: formatDate(r.updated_at),
    meta: {
      module_id: Number(r.module_id),
      module_number: Number(r.module_number),
      module_part_id: Number(r.module_part_id),
      part_name: String(r.part_name),
      unit_number: Number(r.unit_number),
    },
  }));
}

export async function listShelves(): Promise<BaseItemDto[]> {
  const rows = await queryRows<RowDataPacket>(
    `SELECT s.shelf_id, s.shelf_number, s.range_start, s.range_end, s.updated_at, s.is_active,
            su.shelving_unit_id, su.unit_number,
            mp.module_part_id, mp.part_name,
            m.module_id, m.module_number
     FROM Shelves s
     INNER JOIN Shelving_units su ON s.shelving_unit_id = su.shelving_unit_id
     INNER JOIN Module_parts mp ON su.module_part_id = mp.module_part_id
     INNER JOIN Modules m ON mp.module_id = m.module_id
     WHERE s.is_deleted = 0
     ORDER BY m.module_number ASC, su.unit_number ASC, s.shelf_number ASC`,
  );

  return rows.map((r: any) => ({
    id: Number(r.shelf_id),
    nombre: `Anaquel ${r.shelf_number ?? ''}`.trim(),
    rango: formatRange(r.range_start, r.range_end),
    estado: Boolean(r.is_active),
    ultimaModificacion: formatDate(r.updated_at),
    meta: {
      module_id: Number(r.module_id),
      module_number: Number(r.module_number),
      module_part_id: Number(r.module_part_id),
      part_name: String(r.part_name),
      shelving_unit_id: Number(r.shelving_unit_id),
      unit_number: Number(r.unit_number),
      shelf_number: Number(r.shelf_number),
    },
  }));
}
