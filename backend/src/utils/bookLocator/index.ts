// index.ts - Punto de entrada principal del módulo BookLocator
// Este archivo exporta todas las clases, tipos y funciones helper del sistema de localización

import type {
  BookLocation,
  LibraryStructure,
  ParsedCode,
} from './types';
import { CodeParser } from './codeParser';
import { BookLocator } from './bookLocator';

// ============================================================================
// EXPORTACIONES DE TIPOS
// ============================================================================

/**
 * Exportar todos los tipos e interfaces del sistema
 * Estos tipos se usan para definir estructuras de datos y opciones
 */
export type {
  CodeType,           // 'standard' | 'latin_american'
  StructureLevel,     // 'mueble' | 'cara' | 'estanteria' | 'anaquel'
  ParsedCode,         // Código parseado con sus componentes
  CodeRange,          // Rango de códigos (start-end)
  BookLocation,       // Ubicación física de un libro
  SearchOptions,      // Opciones para búsquedas
  LibraryStructure,   // Estructura completa de la biblioteca
  Mueble,             // Mueble físico
  Cara,               // Cara de un mueble (frontal/trasera)
  Estanteria,         // Estantería dentro de una cara
  Anaquel,            // Anaquel (repisa) dentro de una estantería
} from './types';

// ============================================================================
// EXPORTACIONES DE CLASES
// ============================================================================

/**
 * Exportar las clases principales del sistema
 */
export { CodeParser } from './codeParser';
export { BookLocator } from './bookLocator';

// ============================================================================
// VERSIÓN DEL MÓDULO
// ============================================================================

/** Versión actual del módulo BookLocator */
export const VERSION = '1.0.0';

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

/**
 * Crea una estructura de biblioteca vacía
 * Útil para inicializar una nueva biblioteca antes de agregar muebles
 *
 * @returns Estructura de biblioteca sin muebles
 *
 * @example
 * const library = createEmptyLibrary();
 * // → { muebles: [] }
 *
 * // Luego agregar muebles:
 * library.muebles.push({
 *   id: 1,
 *   nombre: "Matemáticas",
 *   range: { ... },
 *   caras: [ ... ]
 * });
 */
export function createEmptyLibrary(): LibraryStructure {
  return {
    muebles: [],
  };
}

/**
 * Valida la estructura de una biblioteca
 * Verifica que la biblioteca tenga todos los componentes necesarios y bien formados
 *
 * Validaciones realizadas:
 * - La biblioteca debe tener al menos un mueble
 * - Cada mueble debe tener un ID
 * - Cada mueble debe tener al menos una cara
 * - Cada cara debe ser 'frontal' o 'trasera'
 * - Cada cara debe tener al menos una estantería
 * - Cada estantería debe tener un ID
 * - Cada estantería debe tener al menos un anaquel
 *
 * @param library - Estructura de biblioteca a validar
 * @returns Objeto con el resultado de la validación
 * @returns result.valid - true si la biblioteca es válida, false en caso contrario
 * @returns result.errors - Array de mensajes de error (vacío si es válida)
 *
 * @example
 * const result = validateLibraryStructure(library);
 * if (!result.valid) {
 *   console.error("Errores encontrados:");
 *   result.errors.forEach(err => console.error("  -", err));
 * }
 * // → Errores encontrados:
 * //   - La biblioteca debe tener al menos un mueble
 */
export function validateLibraryStructure(library: LibraryStructure): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verificar que haya al menos un mueble
  if (!library.muebles || library.muebles.length === 0) {
    errors.push('La biblioteca debe tener al menos un mueble');
  }

  // Validar cada mueble
  library.muebles.forEach((mueble, mIndex) => {
    // Verificar que el mueble tenga ID
    if (!mueble.id) {
      errors.push(`Mueble ${mIndex}: falta ID`);
    }

    // Verificar que el mueble tenga caras
    if (!mueble.caras || mueble.caras.length === 0) {
      errors.push(`Mueble ${mueble.id}: debe tener al menos una cara`);
    }

    // Validar cada cara del mueble
    mueble.caras?.forEach((cara, cIndex) => {
      // Verificar que la cara tenga un tipo válido
      if (!cara.tipo || !['frontal', 'trasera'].includes(cara.tipo)) {
        errors.push(`Mueble ${mueble.id}, Cara ${cIndex}: tipo inválido`);
      }

      // Verificar que la cara tenga estanterías
      if (!cara.estanterias || cara.estanterias.length === 0) {
        errors.push(
          `Mueble ${mueble.id}, Cara ${cara.tipo}: debe tener al menos una estantería`
        );
      }

      // Validar cada estantería de la cara
      cara.estanterias?.forEach((estanteria, eIndex) => {
        // Verificar que la estantería tenga ID
        if (!estanteria.id) {
          errors.push(
            `Mueble ${mueble.id}, Cara ${cara.tipo}, Estantería ${eIndex}: falta ID`
          );
        }

        // Verificar que la estantería tenga anaqueles
        if (!estanteria.anaqueles || estanteria.anaqueles.length === 0) {
          errors.push(
            `Mueble ${mueble.id}, Cara ${cara.tipo}, Estantería ${estanteria.id}: debe tener al menos un anaquel`
          );
        }
      });
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// CONSTANTES ÚTILES
// ============================================================================

/**
 * Niveles de confianza disponibles para ubicaciones
 * @constant
 */
export const CONFIDENCE_LEVELS = {
  /** Alta confianza - El código está exactamente en el rango */
  HIGH: 'high' as const,
  /** Confianza media - El código está en la estantería pero sin anaquel específico */
  MEDIUM: 'medium' as const,
  /** Baja confianza - Posible overflow, el código está cerca del rango */
  LOW: 'low' as const,
};

/**
 * Niveles de estructura de la biblioteca
 * @constant
 */
export const STRUCTURE_LEVELS = {
  /** Nivel de mueble - Estructura más general */
  MUEBLE: 'mueble' as const,
  /** Nivel de cara - Frontal o trasera del mueble */
  CARA: 'cara' as const,
  /** Nivel de estantería - División vertical */
  ESTANTERIA: 'estanteria' as const,
  /** Nivel de anaquel - Nivel más específico (repisa) */
  ANAQUEL: 'anaquel' as const,
};

/**
 * Tipos de códigos de clasificación
 * @constant
 */
export const CODE_TYPES = {
  /** Código Dewey estándar (ej: "511.33 C823M") */
  STANDARD: 'standard' as const,
  /** Código de Literatura Latinoamericana (ej: "CR863 L318P7") */
  LATIN_AMERICAN: 'latin_american' as const,
};

// ============================================================================
// FUNCIONES DE FORMATEO
// ============================================================================

/**
 * Formatea una ubicación como string legible para humanos
 * Convierte un objeto BookLocation en una descripción textual fácil de leer
 *
 * @param location - Ubicación a formatear
 * @returns String con la ubicación formateada
 *
 * @example
 * const location = {
 *   mueble: 1,
 *   cara: "frontal",
 *   estanteria: "A",
 *   anaquel: 1,
 *   range: { ... },
 *   confidence: "high"
 * };
 * formatLocation(location);
 * // → "Mueble 1 - Cara frontal - Estantería A - Anaquel 1 - (Confianza: high)"
 *
 * @example
 * // Ubicación sin anaquel específico
 * const location = {
 *   mueble: 1,
 *   cara: "frontal",
 *   estanteria: "A",
 *   anaquel: 0,
 *   confidence: "medium"
 * };
 * formatLocation(location);
 * // → "Mueble 1 - Cara frontal - Estantería A - (Confianza: medium)"
 */
export function formatLocation(location: BookLocation): string {
  const parts = [`Mueble ${location.mueble}`];

  // Agregar cara si existe
  if (location.cara) {
    parts.push(`Cara ${location.cara}`);
  }

  // Agregar estantería si existe
  if (location.estanteria) {
    parts.push(`Estantería ${location.estanteria}`);
  }

  // Agregar anaquel solo si es mayor a 0 (0 significa no especificado)
  if (location.anaquel > 0) {
    parts.push(`Anaquel ${location.anaquel}`);
  }

  // Siempre agregar nivel de confianza
  parts.push(`(Confianza: ${location.confidence})`);

  return parts.join(' - ');
}

/**
 * Formatea un código parseado de vuelta a su representación en string
 * Reconstruye el código original a partir de sus componentes parseados
 *
 * @param code - Código parseado a formatear
 * @returns String con el código formateado
 *
 * @example
 * // Código Dewey estándar
 * const code = {
 *   type: "standard",
 *   deweyPortion: "511.33",
 *   authorCutter: "C823",
 *   titleCutter: "M",
 *   editionNumber: undefined
 * };
 * formatParsedCode(code);
 * // → "511.33 C823M"
 *
 * @example
 * // Código con edición
 * const code = {
 *   type: "standard",
 *   deweyPortion: "530",
 *   authorCutter: "T595",
 *   titleCutter: "FI",
 *   editionNumber: "2"
 * };
 * formatParsedCode(code);
 * // → "530 T595FI2"
 *
 * @example
 * // Código de Literatura Latinoamericana
 * const code = {
 *   type: "latin_american",
 *   countryCode: "CR",
 *   deweyPortion: "863",
 *   authorCutter: "L318",
 *   titleCutter: "P",
 *   editionNumber: "7"
 * };
 * formatParsedCode(code);
 * // → "CR863 L318P7"
 */
export function formatParsedCode(code: ParsedCode): string {
  if (code.type === 'latin_american') {
    // Formato: <país><dewey> <authorCutter><titleCutter>[edición]
    let result = `${code.countryCode}${code.deweyPortion} ${code.authorCutter}${code.titleCutter}`;
    if (code.editionNumber) {
      result += code.editionNumber;
    }
    return result;
  } else {
    // Formato: <dewey> <authorCutter><titleCutter>[edición]
    let result = `${code.deweyPortion} ${code.authorCutter}${code.titleCutter}`;
    if (code.editionNumber) {
      result += code.editionNumber;
    }
    return result;
  }
}

// ============================================================================
// EXPORTACIÓN POR DEFECTO
// ============================================================================

/**
 * Exportación por defecto con todas las funcionalidades principales
 * Permite importar todo el módulo con una sola línea
 *
 * @example
 * import BookLocatorModule from './bookLocator';
 *
 * const code = BookLocatorModule.CodeParser.parse("511.33 C823M");
 * const locator = new BookLocatorModule.BookLocator(library);
 * console.log(BookLocatorModule.VERSION);
 */
export default {
  CodeParser,
  BookLocator,
  createEmptyLibrary,
  validateLibraryStructure,
  formatLocation,
  formatParsedCode,
  VERSION,
  CONFIDENCE_LEVELS,
  STRUCTURE_LEVELS,
  CODE_TYPES,
};
