// bookLocator.ts - Módulo principal de localización de libros
// Este módulo implementa la lógica de búsqueda de libros en la estructura física de la biblioteca

import {
  LibraryStructure,
  BookLocation,
  SearchOptions,
  ParsedCode,
  StructureLevel,
  Mueble,
  Cara,
  Estanteria,
  Anaquel
} from './types';
import { CodeParser } from './codeParser';

/**
 * Clase BookLocator
 * Localiza libros en la estructura física de la biblioteca basándose en códigos de clasificación.
 * Soporta búsquedas por diferentes niveles de detalle y detección de overflows.
 *
 * @example
 * // Crear un localizador con la estructura de la biblioteca
 * const locator = new BookLocator(libraryStructure);
 *
 * // Buscar la ubicación más probable
 * const location = locator.findBookLocation("511.33 C823M");
 *
 * // Buscar todas las ubicaciones posibles (incluye overflows)
 * const allLocations = locator.findAll("511.33 C823M", {
 *   includeOverflows: true
 * });
 */
export class BookLocator {
  /** Estructura completa de la biblioteca con todos sus muebles, caras, estanterías y anaqueles */
  private library: LibraryStructure;

  /**
   * Constructor del BookLocator
   * @param library - Estructura de la biblioteca a utilizar para las búsquedas
   */
  constructor(library: LibraryStructure) {
    this.library = library;
  }

  /**
   * Encuentra la ubicación más probable de un libro
   * Retorna la primera ubicación que coincide exactamente con el código buscado.
   * Si no encuentra una ubicación exacta, retorna null.
   *
   * @param code - Código del libro a buscar (puede ser Dewey estándar o latinoamericano)
   * @param options - Opciones de búsqueda
   * @param options.level - Nivel de detalle deseado: 'mueble', 'cara', 'estanteria', o 'anaquel' (default)
   * @returns La ubicación encontrada o null si no existe
   *
   * @example
   * // Búsqueda con máximo detalle (anaquel)
   * const location = locator.findBookLocation("511.33 C823M");
   * // → { mueble: 1, cara: "frontal", estanteria: "A", anaquel: 1, confidence: "high" }
   *
   * @example
   * // Búsqueda solo hasta estantería
   * const location = locator.findBookLocation("511.33 C823M", { level: 'estanteria' });
   * // → { mueble: 1, cara: "frontal", estanteria: "A", anaquel: 0, confidence: "high" }
   *
   * @example
   * // Código no encontrado
   * const location = locator.findBookLocation("999.999 Z999Z");
   * // → null
   */
  findBookLocation(
    code: string,
    options: SearchOptions = { level: 'anaquel' }
  ): BookLocation | null {
    try {
      // Parsear el código de entrada
      const parsedCode = CodeParser.parse(code);
      const level = options.level || 'anaquel';

      // Recorrer todos los muebles de la biblioteca
      for (const mueble of this.library.muebles) {
        // Verificar si el código está en el rango del mueble
        if (!this.codeInRange(parsedCode, mueble.range.start, mueble.range.end)) {
          continue; // No está en este mueble, pasar al siguiente
        }

        // Si solo se busca a nivel de mueble, retornar aquí
        if (level === 'mueble') {
          return this.createLocation(parsedCode, mueble);
        }

        // Recorrer las caras del mueble (frontal/trasera)
        for (const cara of mueble.caras) {
          // Verificar si el código está en el rango de la cara
          if (!this.codeInRange(parsedCode, cara.range.start, cara.range.end)) {
            continue; // No está en esta cara, pasar a la siguiente
          }

          // Si solo se busca a nivel de cara, retornar aquí
          if (level === 'cara') {
            return this.createLocation(parsedCode, mueble, cara);
          }

          // Recorrer las estanterías de la cara
          for (const estanteria of cara.estanterias) {
            // Verificar si el código está en el rango de la estantería
            if (!this.codeInRange(parsedCode, estanteria.range.start, estanteria.range.end)) {
              continue; // No está en esta estantería, pasar a la siguiente
            }

            // Si solo se busca a nivel de estantería, retornar aquí
            if (level === 'estanteria') {
              return this.createLocation(parsedCode, mueble, cara, estanteria);
            }

            // Recorrer los anaqueles de la estantería
            for (const anaquel of estanteria.anaqueles) {
              // Verificar si el código está exactamente en el rango del anaquel
              if (this.codeInRange(parsedCode, anaquel.range.start, anaquel.range.end)) {
                // ¡Encontrado! Retornar con confianza alta
                return this.createLocation(parsedCode, mueble, cara, estanteria, anaquel);
              }
            }
          }
        }
      }

      // No se encontró ninguna ubicación para este código
      return null;
    } catch (error) {
      // Si hay error al parsear el código, loguear y retornar null
      console.error('Error al buscar ubicación:', error);
      return null;
    }
  }

  /**
   * Encuentra todas las ubicaciones posibles para un libro (incluyendo overflows)
   * A diferencia de findBookLocation(), este método retorna TODAS las ubicaciones donde
   * el libro podría estar, incluyendo posibles duplicados (overflows).
   *
   * Las ubicaciones se ordenan por nivel de confianza: high → medium → low
   *
   * @param code - Código del libro a buscar
   * @param options - Opciones de búsqueda
   * @param options.level - Nivel de detalle deseado (default: 'anaquel')
   * @param options.includeOverflows - Si incluir posibles overflows (default: true)
   * @returns Array de ubicaciones ordenadas por confianza (puede estar vacío)
   *
   * @example
   * // Buscar todas las ubicaciones incluyendo overflows
   * const locations = locator.findAll("511.33 C823M", { includeOverflows: true });
   * // → [
   * //   { anaquel: 1, confidence: "high" },   // Ubicación principal
   * //   { anaquel: 2, confidence: "low" }     // Posible overflow
   * // ]
   *
   * @example
   * // Buscar solo ubicaciones exactas (sin overflows)
   * const locations = locator.findAll("511.33 C823M", { includeOverflows: false });
   * // → [{ anaquel: 1, confidence: "high" }]
   */
  findAll(
    code: string,
    options: SearchOptions = { level: 'anaquel', includeOverflows: true }
  ): BookLocation[] {
    try {
      // Parsear el código de entrada
      const parsedCode = CodeParser.parse(code);
      const locations: BookLocation[] = [];
      const level = options.level || 'anaquel';

      // Recorrer todos los muebles
      for (const mueble of this.library.muebles) {
        if (!this.codeInRange(parsedCode, mueble.range.start, mueble.range.end)) {
          continue;
        }

        // Recorrer todas las caras
        for (const cara of mueble.caras) {
          if (!this.codeInRange(parsedCode, cara.range.start, cara.range.end)) {
            continue;
          }

          // Recorrer todas las estanterías
          for (const estanteria of cara.estanterias) {
            if (!this.codeInRange(parsedCode, estanteria.range.start, estanteria.range.end)) {
              continue;
            }

            // Si se busca solo a nivel de estantería, agregar y continuar
            if (level === 'estanteria') {
              locations.push(
                this.createLocation(parsedCode, mueble, cara, estanteria, undefined, 'medium')
              );
              continue;
            }

            // Buscar en todos los anaqueles de la estantería
            let foundExactMatch = false;

            for (const anaquel of estanteria.anaqueles) {
              // Verificar si el código está exactamente en el rango del anaquel
              if (this.codeInRange(parsedCode, anaquel.range.start, anaquel.range.end)) {
                // Match exacto - agregar con confianza ALTA
                locations.push(
                  this.createLocation(parsedCode, mueble, cara, estanteria, anaquel, 'high')
                );
                foundExactMatch = true;
              } else if (options.includeOverflows && this.isNearRange(parsedCode, anaquel)) {
                // Posible overflow - el código está cerca del rango del anaquel
                // Agregar con confianza BAJA
                locations.push(
                  this.createLocation(parsedCode, mueble, cara, estanteria, anaquel, 'low')
                );
              }
            }

            // Si no se encontró ningún anaquel exacto pero sí la estantería,
            // agregar la estantería completa con confianza MEDIA
            if (!foundExactMatch && locations.length === 0) {
              locations.push(
                this.createLocation(parsedCode, mueble, cara, estanteria, undefined, 'medium')
              );
            }
          }
        }
      }

      // Ordenar las ubicaciones por nivel de confianza
      // high (0) < medium (1) < low (2)
      return locations.sort((a, b) => {
        const confidenceOrder = { high: 0, medium: 1, low: 2 };
        return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
      });
    } catch (error) {
      // Si hay error, loguear y retornar array vacío
      console.error('Error al buscar todas las ubicaciones:', error);
      return [];
    }
  }

  /**
   * Verifica si un código está dentro de un rango
   * Método privado helper que delega al CodeParser
   *
   * @param code - Código parseado a verificar
   * @param start - Inicio del rango (inclusive)
   * @param end - Fin del rango (inclusive)
   * @returns true si code está en [start, end], false en caso contrario
   */
  private codeInRange(code: ParsedCode, start: ParsedCode, end: ParsedCode): boolean {
    return CodeParser.isInRange(code, start, end);
  }

  /**
   * Verifica si un código está "cerca" de un rango (para detectar overflows)
   * Un código se considera "cerca" si la diferencia en la porción Dewey es menor a 1
   *
   * Casos de overflow:
   * - Código antes del rango: deweyCode < deweyStart && |deweyStart - deweyCode| < 1
   * - Código después del rango: deweyCode > deweyEnd && |deweyCode - deweyEnd| < 1
   *
   * @param code - Código parseado a verificar
   * @param anaquel - Anaquel cuyo rango verificar
   * @returns true si el código está cerca del rango (posible overflow), false en caso contrario
   *
   * @example
   * // Anaquel: [511.33 A000A → 511.33 M999Z]
   * // Código: 511.32 Z999Z (Dewey 511.32)
   * isNearRange(code, anaquel)  // → true (diferencia: 0.01 < 1)
   *
   * @example
   * // Anaquel: [511.33 A000A → 511.33 M999Z]
   * // Código: 510 A000A (Dewey 510)
   * isNearRange(code, anaquel)  // → false (diferencia: 1.33 >= 1)
   */
  private isNearRange(code: ParsedCode, anaquel: Anaquel): boolean {
    // Comparar el código con los límites del rango
    const beforeStart = CodeParser.compare(code, anaquel.range.start);
    const afterEnd = CodeParser.compare(code, anaquel.range.end);

    // Caso 1: El código está ANTES del inicio del rango
    if (beforeStart < 0) {
      // Calcular diferencia en la porción Dewey (numérica)
      const deweyDiff = parseFloat(anaquel.range.start.deweyPortion) - parseFloat(code.deweyPortion);

      // Si la diferencia es menor a 1, el código está "cerca"
      // Ej: 511.32 está cerca de 511.33 (diferencia: 0.01)
      return Math.abs(deweyDiff) < 1;
    }

    // Caso 2: El código está DESPUÉS del final del rango
    if (afterEnd > 0) {
      // Calcular diferencia en la porción Dewey (numérica)
      const deweyDiff = parseFloat(code.deweyPortion) - parseFloat(anaquel.range.end.deweyPortion);

      // Si la diferencia es menor a 1, el código está "cerca"
      // Ej: 511.34 está cerca de 511.33 (diferencia: 0.01)
      return Math.abs(deweyDiff) < 1;
    }

    // El código está dentro del rango o muy lejos de él
    return false;
  }

  /**
   * Crea un objeto BookLocation con la información de ubicación
   * Método privado helper para construir objetos de ubicación consistentemente
   *
   * @param code - Código parseado del libro (no se usa directamente, pero se mantiene por consistencia)
   * @param mueble - Mueble donde se encuentra el libro
   * @param cara - Cara del mueble (opcional, default: 'frontal')
   * @param estanteria - Estantería específica (opcional)
   * @param anaquel - Anaquel específico (opcional)
   * @param confidence - Nivel de confianza de la ubicación (default: 'high')
   * @returns Objeto BookLocation completo
   *
   * @example
   * // Ubicación completa con anaquel
   * createLocation(code, mueble, cara, estanteria, anaquel, 'high')
   * // → { mueble: 1, cara: "frontal", estanteria: "A", anaquel: 1, confidence: "high", ... }
   *
   * @example
   * // Ubicación solo hasta estantería
   * createLocation(code, mueble, cara, estanteria, undefined, 'medium')
   * // → { mueble: 1, cara: "frontal", estanteria: "A", anaquel: 0, confidence: "medium", ... }
   */
  private createLocation(
    code: ParsedCode,
    mueble: Mueble,
    cara?: Cara,
    estanteria?: Estanteria,
    anaquel?: Anaquel,
    confidence: 'high' | 'medium' | 'low' = 'high'
  ): BookLocation {
    return {
      mueble: mueble.id,
      cara: cara?.tipo || 'frontal',            // Default a 'frontal' si no se especifica
      estanteria: estanteria?.id || '',         // String vacío si no se especifica
      anaquel: anaquel?.numero || 0,            // 0 indica que no hay anaquel específico

      // El rango es el más específico disponible:
      // anaquel > estanteria > cara > mueble
      range: anaquel?.range || estanteria?.range || cara?.range || mueble.range,

      confidence
    };
  }
}
