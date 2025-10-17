import { ParsedCode, CodeType } from './types';

/**
 * Parser para códigos de clasificación de libros (Dewey y Literatura Latinoamericana)
 *
 * Soporta:
 * - Códigos Dewey estándar: "511.33 C823M"
 * - Códigos de Literatura Latinoamericana: "CR863 L318P7"
 */
export class CodeParser {
  /**
   * Códigos de países válidos para Literatura Latinoamericana
   */
  private static readonly VALID_COUNTRY_CODES = new Set([
    'AR', 'BO', 'C', 'CH', 'CO', 'CR', 'CU', 'EC', 'SV', 'GT',
    'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'DO', 'UY', 'VE'
  ]);

  /**
   * Normaliza el código eliminando espacios extras y guiones
   */
  private static normalize(code: string): string {
    return code.trim().replace(/\s+/g, ' ').replace(/-/g, '');
  }

  /**
   * Detecta si el código es de Literatura Latinoamericana
   * (comienza con 1 o 2 letras seguidas de dígitos)
   */
  private static isLatinAmericanCode(code: string): boolean {
    return /^[A-Z]{1,2}\d/.test(code);
  }

  /**
   * Parsea un código Dewey estándar
   * Formato: <dewey> <authorCutter><titleCutter>[edición]
   */
  private static parseStandardCode(code: string): ParsedCode {
    const parts = code.split(' ');
    if (parts.length < 2) {
      throw new Error(`Código Dewey inválido: ${code}`);
    }

    const deweyPortion = parts[0];
    const cutterPart = parts[1];

    const cutterMatch = cutterPart.match(/^([A-Z]\d+)([A-Z].*)$/i);
    if (!cutterMatch) {
      throw new Error(`Formato de cutter inválido: ${cutterPart}`);
    }

    const authorCutter = cutterMatch[1].toUpperCase();
    const titlePart = cutterMatch[2].toUpperCase();

    const titleMatch = titlePart.match(/^([A-Z]+)(\d*)$/);
    if (!titleMatch) {
      throw new Error(`Formato de título inválido: ${titlePart}`);
    }

    return {
      type: "standard",
      deweyPortion,
      authorCutter,
      titleCutter: titleMatch[1],
      editionNumber: titleMatch[2] || undefined,
      original: code
    };
  }

  /**
   * Parsea un código de Literatura Latinoamericana
   * Formato: <país><dewey> <authorCutter><titleCutter>[edición]
   */
  private static parseLatinAmericanCode(code: string): ParsedCode {
    const parts = code.split(' ');
    if (parts.length < 2) {
      throw new Error(`Código de literatura latinoamericana inválido: ${code}`);
    }

    const firstPart = parts[0];
    const cutterPart = parts[1];

    const countryMatch = firstPart.match(/^([A-Z]{1,2})(\d+\.?\d*)$/i);
    if (!countryMatch) {
      throw new Error(`Formato de país/Dewey inválido: ${firstPart}`);
    }

    const countryCode = countryMatch[1].toUpperCase();
    const deweyPortion = countryMatch[2];

    if (!this.VALID_COUNTRY_CODES.has(countryCode)) {
      throw new Error(
        `Código de país inválido: "${countryCode}". ` +
        `Solo se aceptan códigos de países latinoamericanos.`
      );
    }

    const cutterMatch = cutterPart.match(/^([A-Z]\d+)([A-Z].*)$/i);
    if (!cutterMatch) {
      throw new Error(`Formato de cutter inválido: ${cutterPart}`);
    }

    const authorCutter = cutterMatch[1].toUpperCase();
    const titlePart = cutterMatch[2].toUpperCase();

    const titleMatch = titlePart.match(/^([A-Z]+)(\d*)$/);
    if (!titleMatch) {
      throw new Error(`Formato de título inválido: ${titlePart}`);
    }

    return {
      type: "latin_american",
      countryCode,
      deweyPortion,
      authorCutter,
      titleCutter: titleMatch[1],
      editionNumber: titleMatch[2] || undefined,
      original: code
    };
  }

  /**
   * Parsea cualquier código de libro (detecta automáticamente el tipo)
   * @throws Error si el formato no es válido
   */
  static parse(code: string): ParsedCode {
    const normalized = this.normalize(code);

    if (this.isLatinAmericanCode(normalized)) {
      return this.parseLatinAmericanCode(normalized);
    } else {
      return this.parseStandardCode(normalized);
    }
  }

  /**
   * Compara dos Cutters tratando los números como decimales
   *
   * Ejemplos:
   * - A5 = A.5 = 0.500
   * - A50 = A.50 = 0.500 (igual que A5)
   * - A501 = A.501 = 0.501 (mayor que A50)
   * - A51 = A.51 = 0.510 (mayor que A501)
   *
   * Orden: A5 = A50 < A501 < A51 < A6
   */
  private static compareCutter(cutterA: string, cutterB: string): number {
    // Separar letra y números
    const matchA = cutterA.match(/^([A-Z])(\d+)$/i);
    const matchB = cutterB.match(/^([A-Z])(\d+)$/i);

    if (!matchA || !matchB) {
      // Fallback a comparación alfabética si el formato no es el esperado
      return cutterA < cutterB ? -1 : cutterA > cutterB ? 1 : 0;
    }

    const letterA = matchA[1].toUpperCase();
    const letterB = matchB[1].toUpperCase();
    const numberA = matchA[2];
    const numberB = matchB[2];

    // Primero comparar por letra
    if (letterA !== letterB) {
      return letterA < letterB ? -1 : 1;
    }

    // Tratar números como decimales: A5 = A.5, A50 = A.50, A501 = A.501
    // Agregamos el punto decimal al inicio
    const decimalA = parseFloat('0.' + numberA);
    const decimalB = parseFloat('0.' + numberB);

    if (decimalA < decimalB) return -1;
    if (decimalA > decimalB) return 1;
    return 0;
  }

  /**
   * Compara dos códigos parseados
   *
   * Orden de prioridad:
   * 1. Dewey (numérico)
   * 2. País (alfabético, solo si Dewey igual) - standard < latino
   * 3. Cutter autor (números como decimales: A5 = A50 < A501 < A51)
   * 4. Cutter título (letras + números como decimales)
   * 5. Edición (numérico)
   *
   * @returns -1 si a < b, 0 si a === b, 1 si a > b
   */
  static compare(a: ParsedCode, b: ParsedCode): number {
    // 1. Comparar por Dewey (numérico)
    const deweyA = parseFloat(a.deweyPortion);
    const deweyB = parseFloat(b.deweyPortion);
    if (deweyA !== deweyB) {
      return deweyA < deweyB ? -1 : 1;
    }

    // 2. Comparar por código de país
    const countryA = a.countryCode || '';
    const countryB = b.countryCode || '';
    if (countryA !== countryB) {
      if (countryA === '') return -1;  // Standard antes que latino
      if (countryB === '') return 1;
      return countryA < countryB ? -1 : 1;
    }

    // 3. Comparar por cutter del autor (números como decimales)
    const authorCompare = this.compareCutter(a.authorCutter, b.authorCutter);
    if (authorCompare !== 0) {
      return authorCompare;
    }

    // 4. Comparar por cutter del título (letras alfabéticas)
    if (a.titleCutter !== b.titleCutter) {
      return a.titleCutter < b.titleCutter ? -1 : 1;
    }

    // 5. Comparar por edición
    const editionA = a.editionNumber ? parseInt(a.editionNumber) : 0;
    const editionB = b.editionNumber ? parseInt(b.editionNumber) : 0;
    if (editionA !== editionB) {
      return editionA < editionB ? -1 : 1;
    }

    return 0;
  }

  /**
   * Verifica si un código está dentro de un rango (inclusive)
   */
  static isInRange(code: ParsedCode, start: ParsedCode, end: ParsedCode): boolean {
    return this.compare(code, start) >= 0 && this.compare(code, end) <= 0;
  }
}
