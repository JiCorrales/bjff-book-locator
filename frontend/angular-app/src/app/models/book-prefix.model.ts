export interface BookPrefixOption { 
  /** 
   * Two-letter code appended to the book identifier. Use an empty string for "Sin letras iniciales". 
   */ 
  code: string; 
  /** 
   * Text shown in the dropdown. Keep it short so the list stays compact. 
   */ 
  display: string; 
} 


/** 
 * Collection of available prefixes for book codes. 
 * 
 * Update this list if you need to add or remove regions. Only Latin American 
 * abbreviations and Spain are included by default, plus the "Sin letras 
 * iniciales" option at the top. 
 */ 
export const BOOK_PREFIXES: BookPrefixOption[] = [ 
  { code: '', display: 'NO TIENE' }, 
  { code: 'AR', display: 'AR' }, 
  { code: 'BO', display: 'BO' }, 
  { code: 'BR', display: 'BR' }, 
  { code: 'CL', display: 'CL' }, 
  { code: 'CO', display: 'CO' }, 
  { code: 'CR', display: 'CR' }, 
  { code: 'CU', display: 'CU' }, 
  { code: 'DO', display: 'DO' }, 
  { code: 'EC', display: 'EC' }, 
  { code: 'SV', display: 'SV' }, 
  { code: 'GT', display: 'GT' }, 
  { code: 'HN', display: 'HN' }, 
  { code: 'MX', display: 'MX' }, 
  { code: 'NI', display: 'NI' }, 
  { code: 'PA', display: 'PA' }, 
  { code: 'PY', display: 'PY' }, 
  { code: 'PE', display: 'PE' }, 
  { code: 'PR', display: 'PR' }, 
  { code: 'UY', display: 'UY' }, 
  { code: 'VE', display: 'VE' }, 
  { code: 'ES', display: 'ES' } 
];