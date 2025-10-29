/**
 * Parser de códigos de clasificación bibliográfica
 * Soporta códigos Dewey estándar y Literatura Latinoamericana (LATAM)
 *
 * Genera una clave comparable de longitud fija (22 caracteres) con el formato:
 * T(1) + CC(2) + CLS(3) + DEC_DW(6) + CUT_MAIN(1) + CUT_DEC(6) + CUT_LET(1) + CUT_NUM(2)
 */

// Prefijos válidos de países latinoamericanos (códigos ISO-2)
const LATAM_PREFIXES = new Set([
  'AR', 'BO', 'CH', 'CO', 'CR', 'CU', 'EC',
  'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE',
  'PR', 'DO', 'UY', 'VE'
]);

export interface ParsedCode {
  raw: string;
  normalized: string;
  type: 'DEWEY' | 'LATAM';
  country: string;            // CC (2 chars)
  deweyClass: string;         // CLS (3 chars)
  deweyDecimal: string;       // DEC_DW (6 chars)
  cutterMain: string;         // CUT_MAIN (1 char)
  cutterDecimal: string;      // CUT_DEC (6 chars)
  cutterSuffixLetter: string; // CUT_LET (1 char)
  cutterSuffixNumber: string; // CUT_NUM (2 chars)
  comparableKey: string;      // Final key (22 chars)
}

/**
 * Normaliza un string de entrada a una forma estable:
 * - trim, mayusculas, normalizacion Unicode NFKC
 * - colapsa espacios multiples
 * - elimina guiones (p.ej. S-237M23 -> S237M23)
 */
function normalize(input: string): string {

  return input
    .trim()
    .toUpperCase()
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .replace(/-/g, '');
    
}

/** Determina el tipo de codigo segun prefijo de pais valido (LATAM) o no (DEWEY). */
function detectType(normalized: string): 'LATAM' | 'DEWEY' {
  const latamPattern = /^[A-Z]{1,2}[- ]?\d/;
  if (latamPattern.test(normalized)) {
    const prefix = normalized.match(/^[A-Z]{1,2}/)?.[0] || '';
    if (prefix && LATAM_PREFIXES.has(prefix)) return 'LATAM';
  }
  return 'DEWEY';
}

/** Parsea parte Dewey + Cutter (si existe) y valida formatos. */
function parseDewey(normalized: string): Omit<ParsedCode, 'raw' | 'normalized' | 'type' | 'comparableKey'> {
  const parts = normalized.split(' ');
  const deweyPart = parts[0] || '';
  const cutterRaw = parts.slice(1).join('').trim();

  let deweyClass = '';
  let deweyDecimal = '';
  // Validar formato Dewey: 1-3 dígitos + opcional .dígitos
  if (!/^\d{1,3}(?:\.\d+)?$/.test(deweyPart)) {
    throw new Error(`Formato Dewey inválido: "${deweyPart || '(vacío)'}"`);
  }
  if (deweyPart.includes('.')) {
    const [cls, dec] = deweyPart.split('.');
    deweyClass = (cls || '0').padStart(3, '0').substring(0, 3);
    deweyDecimal = (dec || '').padEnd(6, '0').substring(0, 6);
  } else {
    deweyClass = deweyPart.padStart(3, '0').substring(0, 3);
    deweyDecimal = '000000';
  }

  // Validar cutter si viene presente: debe iniciar con letra
  if (cutterRaw && !/^[A-Z]/.test(cutterRaw)) {
    throw new Error(`Formato de Cutter inválido: "${cutterRaw}"`);
  }

  const cutter = parseCutter(cutterRaw);
  return { country: 'AA', deweyClass, deweyDecimal, ...cutter };
}

/** Parsea codigos LATAM: CC + Dewey + Cutter. Reusa parseo Dewey para el resto. */
function parseLatam(normalized: string): Omit<ParsedCode, 'raw' | 'normalized' | 'type' | 'comparableKey'> {
  const countryMatch = normalized.match(/^([A-Z]{1,2})/);
  const country = (countryMatch?.[1] || 'AA').padEnd(2, 'A').substring(0, 2);
  const withoutCountry = normalized.replace(/^[A-Z]{1,2}[- ]?/, '');
  const deweyParsed = parseDewey(withoutCountry);
  return { ...deweyParsed, country };
}

/** Parsea Cutter: letra principal, decimal implicito, letra y numero sufijo. */
function parseCutter(cutterRaw: string): {
  cutterMain: string;
  cutterDecimal: string;
  cutterSuffixLetter: string;
  cutterSuffixNumber: string;
} {
  if (!cutterRaw) {
    return { cutterMain: '0', cutterDecimal: '000000', cutterSuffixLetter: '0', cutterSuffixNumber: '00' };
  }
  const cutterMain = cutterRaw[0] || '0';
  let remaining = cutterRaw.substring(1);
  const decimalMatch = remaining.match(/^(\d+)/);
  const decimalStr = decimalMatch?.[1] || '';
  const cutterDecimal = decimalStr.padEnd(6, '0').substring(0, 6);
  remaining = remaining.substring(decimalStr.length);
  const suffixLetterMatch = remaining.match(/^([A-Z])/);
  const cutterSuffixLetter = suffixLetterMatch?.[1] || '0';
  remaining = remaining.substring(suffixLetterMatch?.[1]?.length || 0);
  const suffixNumMatch = remaining.match(/^(\d+)/);
  let suffixNum = suffixNumMatch?.[1] || '00';
  if (suffixNum.length > 2) suffixNum = suffixNum.substring(suffixNum.length - 2);
  const cutterSuffixNumber = suffixNum.padStart(2, '0').substring(0, 2);
  // Cualquier resto no reconocido implica formato inválido
  const leftover = remaining.substring((suffixNumMatch?.[1] || '').length);
  if (leftover && /[A-Z0-9]/.test(leftover)) {
    throw new Error(`Formato de Cutter inválido (resto inesperado): "${cutterRaw}"`);
  }
  return { cutterMain, cutterDecimal, cutterSuffixLetter, cutterSuffixNumber };
}

/** Construye la clave comparable de 22 chars con padding estandar. */
function buildComparableKey(
  parsed: Omit<ParsedCode, 'raw' | 'normalized' | 'comparableKey'> & { type: 'DEWEY' | 'LATAM' }
): string {
  const typeChar = parsed.type === 'LATAM' ? 'L' : 'D';
  return (
    typeChar +
    parsed.country +
    parsed.deweyClass +
    parsed.deweyDecimal +
    parsed.cutterMain +
    parsed.cutterDecimal +
    parsed.cutterSuffixLetter +
    parsed.cutterSuffixNumber
  );
}

/**
 * Punto de entrada del parser. Devuelve estructura y clave comparable.
 * Lanza errores descriptivos en caso de formato invalido.
 */

export function parseClassificationCode(input: string): ParsedCode {
  const raw = input;
  const normalized = normalize(input);
  // Si parece LATAM pero el prefijo no es válido, rechazar explícitamente
  const looksLatam = /^[A-Z]{1,2}[- ]?\d/.test(normalized);
  if (looksLatam) {
    const prefix = normalized.match(/^[A-Z]{1,2}/)?.[0] || '';
    if (prefix && !LATAM_PREFIXES.has(prefix)) {
      throw new Error(`Código de país inválido para LATAM: "${prefix}"`);
    }
  }
  const type = detectType(normalized);
  const base = type === 'LATAM' ? parseLatam(normalized) : parseDewey(normalized);
  const comparableKey = buildComparableKey({ ...base, type });
  return { raw, normalized, type, ...base, comparableKey };
}
