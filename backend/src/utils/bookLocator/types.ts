// types.ts - Definiciones de tipos para el sistema de localización de libros
// Este archivo contiene todas las interfaces y tipos utilizados en el sistema

/**
 * Tipo de código de libro
 * - standard: Código Dewey estándar (ej: "511.33 C823M")
 * - latin_american: Código de Literatura Latinoamericana con código de país (ej: "CR863 L318P7")
 */
export type CodeType = "standard" | "latin_american";

/**
 * Nivel de estructura de la biblioteca para búsquedas
 * Determina el nivel de detalle en la búsqueda de un libro:
 * - mueble: Nivel más general, solo identifica el mueble físico
 * - cara: Identifica la cara (frontal/trasera) del mueble
 * - estanteria: Identifica la estantería específica dentro de una cara
 * - anaquel: Nivel más específico, identifica el anaquel exacto (repisa)
 */
export type StructureLevel = "mueble" | "cara" | "estanteria" | "anaquel";

/**
 * Código de libro parseado y estructurado
 * Representa un código de clasificación de libro después de ser procesado
 *
 * @example
 * // Código Dewey estándar
 * {
 *   type: "standard",
 *   deweyPortion: "511.33",
 *   authorCutter: "C823",
 *   titleCutter: "M",
 *   editionNumber: undefined,
 *   countryCode: undefined,
 *   original: "511.33 C823M"
 * }
 *
 * @example
 * // Código de Literatura Latinoamericana
 * {
 *   type: "latin_american",
 *   countryCode: "CR",
 *   deweyPortion: "863",
 *   authorCutter: "L318",
 *   titleCutter: "P",
 *   editionNumber: "7",
 *   original: "CR863 L318P7"
 * }
 */
export interface ParsedCode {
  /** Tipo de código (standard o latin_american) */
  type: CodeType;

  /** Código de país de 1-2 letras (solo para códigos latinoamericanos). Ej: "C" (Colombia), "CR" (Costa Rica) */
  countryCode?: string;

  /** Porción numérica del sistema Decimal Dewey. Ej: "511.33", "863" */
  deweyPortion: string;

  /** Cutter del autor - combinación de letra(s) y números. Ej: "C823", "L318" */
  authorCutter: string;

  /** Cutter del título - letra(s) que identifican el título. Ej: "M", "FI" */
  titleCutter: string;

  /** Número de edición (opcional). Ej: "2", "7" */
  editionNumber?: string;

  /** Código original sin modificar, tal como fue ingresado */
  original: string;
}

/**
 * Rango de códigos que define los límites de una sección de la biblioteca
 * Se usa para definir qué códigos pertenecen a cada mueble, cara, estantería o anaquel
 *
 * @example
 * {
 *   start: CodeParser.parse("511.33 A000A"),
 *   end: CodeParser.parse("511.33 M999Z")
 * }
 */
export interface CodeRange {
  /** Código de inicio del rango (inclusive) */
  start: ParsedCode;

  /** Código de fin del rango (inclusive) */
  end: ParsedCode;
}

/**
 * Ubicación física de un libro en la biblioteca
 * Representa el resultado de una búsqueda, indicando dónde se encuentra (o podría encontrarse) un libro
 *
 * @example
 * {
 *   mueble: 1,
 *   cara: "frontal",
 *   estanteria: "A",
 *   anaquel: 1,
 *   range: { start: ..., end: ... },
 *   confidence: "high"
 * }
 */
export interface BookLocation {
  /** Identificador numérico del mueble físico */
  mueble: number;

  /** Cara del mueble donde se encuentra el libro */
  cara: "frontal" | "trasera";

  /** Identificador de la estantería (división vertical). Ej: "A", "B", "C" */
  estanteria: string;

  /** Número del anaquel (repisa, nivel horizontal). 0 = no especificado */
  anaquel: number;

  /** Rango de códigos que abarca esta ubicación */
  range: CodeRange;

  /**
   * Nivel de confianza de la ubicación:
   * - high: El código está exactamente dentro del rango del anaquel
   * - medium: El código está en la estantería pero sin anaquel específico
   * - low: Posible overflow - el código está cerca pero fuera del rango
   */
  confidence: "high" | "medium" | "low";
}

/**
 * Opciones para configurar la búsqueda de libros
 */
export interface SearchOptions {
  /**
   * Nivel de detalle deseado en la búsqueda.
   * Por defecto es 'anaquel' para máxima precisión
   */
  level?: StructureLevel;

  /**
   * Si se deben incluir posibles ubicaciones de overflow (libros duplicados).
   * Por defecto es true en findAll()
   */
  includeOverflows?: boolean;
}

/**
 * Estructura completa de la biblioteca
 * Representa la organización física de todos los muebles y sus contenidos
 */
export interface LibraryStructure {
  /** Lista de todos los muebles en la biblioteca */
  muebles: Mueble[];
}

/**
 * Mueble físico de la biblioteca
 * Estructura principal que agrupa secciones temáticas completas
 *
 * @example
 * {
 *   id: 1,
 *   nombre: "Ciencias - Matemáticas y Física",
 *   range: { start: "500 A000A", end: "599.999 Z999Z" },
 *   caras: [...]
 * }
 */
export interface Mueble {
  /** Identificador único del mueble */
  id: number;

  /** Nombre descriptivo del mueble (temática o sección) */
  nombre: string;

  /** Rango de códigos que abarca todo el mueble */
  range: CodeRange;

  /** Lista de caras (frontal/trasera) del mueble */
  caras: Cara[];
}

/**
 * Cara de un mueble (frontal o trasera)
 * Cada mueble se divide en caras que funcionan como secciones independientes
 */
export interface Cara {
  /** Tipo de cara del mueble */
  tipo: "frontal" | "trasera";

  /** Rango de códigos que abarca esta cara */
  range: CodeRange;

  /** Lista de estanterías en esta cara */
  estanterias: Estanteria[];
}

/**
 * Estantería dentro de una cara
 * División vertical independiente que contiene múltiples anaqueles (repisas)
 */
export interface Estanteria {
  /** Identificador de la estantería (usualmente letras: "A", "B", "C") */
  id: string;

  /** Rango de códigos que abarca esta estantería */
  range: CodeRange;

  /** Lista de anaqueles (repisas) en esta estantería */
  anaqueles: Anaquel[];
}

/**
 * Anaquel (repisa) dentro de una estantería
 * Nivel más específico donde se ubican físicamente los libros
 * Los anaqueles se numeran desde arriba hacia abajo
 */
export interface Anaquel {
  /** Número del anaquel (1 = superior, incrementa hacia abajo) */
  numero: number;

  /** Rango de códigos que contiene este anaquel */
  range: CodeRange;
}
