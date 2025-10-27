// bookLocator.test.ts - Pruebas completas del sistema de localización

import { CodeParser } from './codeParser';
import { BookLocator } from './bookLocator';
import { sampleLibrary, emptyLibrary, simplLibrary } from './testData';
import { validateLibraryStructure, formatLocation, formatParsedCode, BookLocation } from './index';

describe('CodeParser', () => {
  describe('Parseo de códigos Dewey estándar', () => {
    it('debe parsear código Dewey simple', () => {
      const result = CodeParser.parse('511.33 C823M');
      expect(result).toEqual({
        type: 'standard',
        deweyPortion: '511.33',
        authorCutter: 'C823',
        titleCutter: 'M',
        editionNumber: undefined,
        countryCode: undefined,
        original: '511.33 C823M'
      });
    });

    test('debe parsear código Dewey con edición', () => {
      const result = CodeParser.parse('530 T595FI2');
      expect(result).toEqual({
        type: 'standard',
        deweyPortion: '530',
        authorCutter: 'T595',
        titleCutter: 'FI',
        editionNumber: '2',
        countryCode: undefined,
        original: '530 T595FI2'
      });
    });

    test('debe parsear código con múltiples letras en titleCutter', () => {
      const result = CodeParser.parse('530 T595FISICA');
      expect(result).toEqual({
        type: 'standard',
        deweyPortion: '530',
        authorCutter: 'T595',
        titleCutter: 'FISICA',
        editionNumber: undefined,
        countryCode: undefined,
        original: '530 T595FISICA'
      });
    });

    test('debe normalizar espacios extras', () => {
      const result = CodeParser.parse('511.33   C823M');
      expect(result.deweyPortion).toBe('511.33');
      expect(result.authorCutter).toBe('C823');
    });

    test('debe eliminar guiones', () => {
      const result = CodeParser.parse('860 S-237M23');
      expect(result.authorCutter).toBe('S237');
      expect(result.titleCutter).toBe('M');
      expect(result.editionNumber).toBe('23');
    });

    test('debe eliminar múltiples guiones', () => {
      const result = CodeParser.parse('863.3 C419-I-2');
      expect(result.authorCutter).toBe('C419');
      expect(result.titleCutter).toBe('I');
      expect(result.editionNumber).toBe('2');
    });
  });

  describe('Parseo de códigos de Literatura Latinoamericana', () => {
    test('debe parsear código de Colombia', () => {
      const result = CodeParser.parse('C863 G216CI');
      expect(result).toEqual({
        type: 'latin_american',
        countryCode: 'C',
        deweyPortion: '863',
        authorCutter: 'G216',
        titleCutter: 'CI',
        editionNumber: undefined,
        original: 'C863 G216CI'
      });
    });

    test('debe parsear código de Costa Rica con edición', () => {
      const result = CodeParser.parse('CR863 L318P7');
      expect(result).toEqual({
        type: 'latin_american',
        countryCode: 'CR',
        deweyPortion: '863',
        authorCutter: 'L318',
        titleCutter: 'P',
        editionNumber: '7',
        original: 'CR863 L318P7'
      });
    });

    test('debe parsear código con porción Dewey decimal', () => {
      const result = CodeParser.parse('CR863.5 L318P');
      expect(result.deweyPortion).toBe('863.5');
    });

    test('debe detectar correctamente códigos latinoamericanos', () => {
      const latinCode = CodeParser.parse('CR863 L318P7');
      expect(latinCode.type).toBe('latin_american');

      const standardCode = CodeParser.parse('863 L318P7');
      expect(standardCode.type).toBe('standard');
    });
  });

  describe('Manejo de errores', () => {
    test('debe lanzar error con código sin espacio', () => {
      expect(() => CodeParser.parse('511.33C823M')).toThrow();
    });

    test('debe lanzar error con formato de cutter inválido', () => {
      expect(() => CodeParser.parse('511.33 823M')).toThrow();
    });

    test('debe lanzar error con código vacío', () => {
      expect(() => CodeParser.parse('')).toThrow();
    });

    test('debe lanzar error con código de una sola parte', () => {
      expect(() => CodeParser.parse('511.33')).toThrow();
    });

    test('debe lanzar error con código de país no válido', () => {
      expect(() => CodeParser.parse('XX863 G216CI')).toThrow('Código de país inválido');
    });

    test('debe lanzar error con código de país inválido (un carácter)', () => {
      expect(() => CodeParser.parse('Z863 G216CI')).toThrow('Código de país inválido');
    });

    test('debe lanzar error con código de país europeo', () => {
      expect(() => CodeParser.parse('ES863 G216CI')).toThrow('Código de país inválido');
    });

    test('debe aceptar códigos latinoamericanos válidos', () => {
      expect(() => CodeParser.parse('AR863 G216CI')).not.toThrow(); // Argentina
      expect(() => CodeParser.parse('MX863 G216CI')).not.toThrow(); // México
      expect(() => CodeParser.parse('CR863 G216CI')).not.toThrow(); // Costa Rica
    });
  });

  describe('Comparación de códigos', () => {
    test('debe comparar códigos iguales', () => {
      const code1 = CodeParser.parse('511.33 C823M');
      const code2 = CodeParser.parse('511.33 C823M');
      expect(CodeParser.compare(code1, code2)).toBe(0);
    });

    test('debe comparar por porción Dewey', () => {
      const code1 = CodeParser.parse('510 A000A');
      const code2 = CodeParser.parse('520 A000A');
      expect(CodeParser.compare(code1, code2)).toBe(-1);
      expect(CodeParser.compare(code2, code1)).toBe(1);
    });

    test('debe respetar jerarquía Dewey: 500 < 510 < 511', () => {
      const dewey500 = CodeParser.parse('500 A000A');
      const dewey510 = CodeParser.parse('510 A000A');
      const dewey511 = CodeParser.parse('511 A000A');

      expect(CodeParser.compare(dewey500, dewey510)).toBe(-1);
      expect(CodeParser.compare(dewey510, dewey511)).toBe(-1);
      expect(CodeParser.compare(dewey500, dewey511)).toBe(-1);
    });

    test('debe respetar jerarquía Dewey decimal: 511 < 511.3 < 511.33', () => {
      const dewey511 = CodeParser.parse('511 A000A');
      const dewey5113 = CodeParser.parse('511.3 A000A');
      const dewey51133 = CodeParser.parse('511.33 A000A');

      expect(CodeParser.compare(dewey511, dewey5113)).toBe(-1);
      expect(CodeParser.compare(dewey5113, dewey51133)).toBe(-1);
      expect(CodeParser.compare(dewey511, dewey51133)).toBe(-1);
    });

    test('debe ordenar jerárquicamente: 500 < 500.1 < 510 < 511.3 < 511.33', () => {
      const codes = [
        CodeParser.parse('511.33 A000A'),
        CodeParser.parse('500 A000A'),
        CodeParser.parse('511.3 A000A'),
        CodeParser.parse('510 A000A'),
        CodeParser.parse('500.1 A000A')
      ];

      const sorted = [...codes].sort((a, b) => CodeParser.compare(a, b));

      expect(sorted[0].deweyPortion).toBe('500');
      expect(sorted[1].deweyPortion).toBe('500.1');
      expect(sorted[2].deweyPortion).toBe('510');
      expect(sorted[3].deweyPortion).toBe('511.3');
      expect(sorted[4].deweyPortion).toBe('511.33');
    });

    test('debe comparar por authorCutter (letra diferente)', () => {
      const code1 = CodeParser.parse('511.33 A823M');
      const code2 = CodeParser.parse('511.33 C823M');
      expect(CodeParser.compare(code1, code2)).toBe(-1);
    });

    test('debe ordenar Cutters por letra primero: A123 < B456 < L318', () => {
      const codeA = CodeParser.parse('863 A123A');
      const codeB = CodeParser.parse('863 B456A');
      const codeL = CodeParser.parse('863 L318A');

      // A < B < L (por letra, independientemente del número)
      expect(CodeParser.compare(codeA, codeB)).toBe(-1);  // A < B
      expect(CodeParser.compare(codeB, codeL)).toBe(-1);  // B < L
      expect(CodeParser.compare(codeA, codeL)).toBe(-1);  // A < L

      // Orden completo: A123 < B456 < L318
      const sorted = [codeL, codeB, codeA].sort((a, b) => CodeParser.compare(a, b));
      expect(sorted[0].authorCutter).toBe('A123');
      expect(sorted[1].authorCutter).toBe('B456');
      expect(sorted[2].authorCutter).toBe('L318');
    });

    test('debe comparar authorCutter como decimales: A5 = A50', () => {
      const code1 = CodeParser.parse('863 G5CI');
      const code2 = CodeParser.parse('863 G50CI');
      expect(CodeParser.compare(code1, code2)).toBe(0);  // 0.5 === 0.50
    });

    test('debe comparar authorCutter como decimales: A50 < A501', () => {
      const code1 = CodeParser.parse('863 G50CI');
      const code2 = CodeParser.parse('863 G501CI');
      expect(CodeParser.compare(code1, code2)).toBe(-1);  // 0.50 < 0.501
    });

    test('debe comparar authorCutter como decimales: A501 < A51', () => {
      const code1 = CodeParser.parse('863 G501CI');
      const code2 = CodeParser.parse('863 G51CI');
      expect(CodeParser.compare(code1, code2)).toBe(-1);  // 0.501 < 0.51
    });

    test('debe comparar authorCutter como decimales: A51 < A6', () => {
      const code1 = CodeParser.parse('863 G51CI');
      const code2 = CodeParser.parse('863 G6CI');
      expect(CodeParser.compare(code1, code2)).toBe(-1);  // 0.51 < 0.6
    });

    test('debe ordenar: A5 = A50 < A501 < A51 < A6', () => {
      const codes = [
        CodeParser.parse('863 G6CI'),
        CodeParser.parse('863 G51CI'),
        CodeParser.parse('863 G501CI'),
        CodeParser.parse('863 G50CI'),
        CodeParser.parse('863 G5CI')
      ];

      const sorted = [...codes].sort((a, b) => CodeParser.compare(a, b));

      // G5 y G50 deben ser iguales (pueden aparecer en cualquier orden)
      expect(sorted[0].authorCutter === 'G5' || sorted[0].authorCutter === 'G50').toBe(true);
      expect(sorted[1].authorCutter === 'G5' || sorted[1].authorCutter === 'G50').toBe(true);
      expect(sorted[2].authorCutter).toBe('G501');
      expect(sorted[3].authorCutter).toBe('G51');
      expect(sorted[4].authorCutter).toBe('G6');
    });

    test('debe comparar por titleCutter', () => {
      const code1 = CodeParser.parse('511.33 C823A');
      const code2 = CodeParser.parse('511.33 C823M');
      expect(CodeParser.compare(code1, code2)).toBe(-1);
    });

    test('debe comparar por número de edición', () => {
      const code1 = CodeParser.parse('511.33 C823M1');
      const code2 = CodeParser.parse('511.33 C823M2');
      expect(CodeParser.compare(code1, code2)).toBe(-1);
    });

    test('debe integrar códigos estándar y latinoamericanos por Dewey', () => {
      // Con el mismo Dewey, standard va antes que latino (cuando tienen el mismo cutter)
      const standard = CodeParser.parse('500 A000A');
      const latin = CodeParser.parse('C500 A000A');
      expect(CodeParser.compare(standard, latin)).toBe(-1);
      expect(CodeParser.compare(latin, standard)).toBe(1);

      // Pero el Dewey tiene prioridad sobre el tipo
      const standard600 = CodeParser.parse('600 A000A');
      const latin500 = CodeParser.parse('C500 Z999Z');
      expect(CodeParser.compare(latin500, standard600)).toBe(-1);  // 500 < 600
    });

    test('debe comparar códigos latinoamericanos por país cuando tienen mismo Dewey', () => {
      const colombia = CodeParser.parse('C863 G216CI');
      const costaRica = CodeParser.parse('CR863 G216CI');
      expect(CodeParser.compare(colombia, costaRica)).toBe(-1);  // C < CR
    });

    test('debe permitir rangos mixtos (standard a latino)', () => {
      const standardStart = CodeParser.parse('500 A000A');
      const latinoEnd = CodeParser.parse('C600 Z999Z');
      const testCode = CodeParser.parse('C550 M500M');

      expect(CodeParser.isInRange(testCode, standardStart, latinoEnd)).toBe(true);
    });

    test('debe permitir rangos mixtos (latino a standard)', () => {
      const latinoStart = CodeParser.parse('C500 A000A');
      const standardEnd = CodeParser.parse('600 Z999Z');
      const testCode = CodeParser.parse('550 M500M');

      expect(CodeParser.isInRange(testCode, latinoStart, standardEnd)).toBe(true);
    });
  });

  describe('Verificación de rangos', () => {
    test('debe verificar código dentro de rango', () => {
      const code = CodeParser.parse('511.33 C823M');
      const start = CodeParser.parse('511.33 A000A');
      const end = CodeParser.parse('511.33 Z999Z');
      expect(CodeParser.isInRange(code, start, end)).toBe(true);
    });

    test('debe verificar código fuera de rango (antes)', () => {
      const code = CodeParser.parse('511.33 A000A');
      const start = CodeParser.parse('511.33 C000A');
      const end = CodeParser.parse('511.33 Z999Z');
      expect(CodeParser.isInRange(code, start, end)).toBe(false);
    });

    test('debe verificar código fuera de rango (después)', () => {
      const code = CodeParser.parse('511.33 Z999Z');
      const start = CodeParser.parse('511.33 A000A');
      const end = CodeParser.parse('511.33 M999Z');
      expect(CodeParser.isInRange(code, start, end)).toBe(false);
    });

    test('debe verificar código en límite inferior', () => {
      const code = CodeParser.parse('511.33 A000A');
      const start = CodeParser.parse('511.33 A000A');
      const end = CodeParser.parse('511.33 Z999Z');
      expect(CodeParser.isInRange(code, start, end)).toBe(true);
    });

    test('debe verificar código en límite superior', () => {
      const code = CodeParser.parse('511.33 Z999Z');
      const start = CodeParser.parse('511.33 A000A');
      const end = CodeParser.parse('511.33 Z999Z');
      expect(CodeParser.isInRange(code, start, end)).toBe(true);
    });
  });
});

describe('BookLocator', () => {
  describe('findBookLocation - Búsqueda por anaquel', () => {
    const locator = new BookLocator(sampleLibrary);

    test('debe encontrar ubicación exacta en anaquel 1', () => {
      const location = locator.findBookLocation('511.33 C823M');
      expect(location).not.toBeNull();
      expect(location?.mueble).toBe(1);
      expect(location?.cara).toBe('frontal');
      expect(location?.estanteria).toBe('A');
      expect(location?.anaquel).toBe(1);
      expect(location?.confidence).toBe('high');
    });

    test('debe encontrar ubicación en anaquel 2', () => {
      const location = locator.findBookLocation('511.33 R456S');
      expect(location).not.toBeNull();
      expect(location?.anaquel).toBe(2);
      expect(location?.confidence).toBe('high');
    });

    test('debe encontrar libro de física', () => {
      const location = locator.findBookLocation('530 T595FI');
      expect(location).not.toBeNull();
      expect(location?.mueble).toBe(1);
      expect(location?.estanteria).toBe('C');
      expect(location?.anaquel).toBe(1);
    });

    test('debe encontrar libro en cara trasera', () => {
      const location = locator.findBookLocation('551.5 A789C');
      expect(location).not.toBeNull();
      expect(location?.cara).toBe('trasera');
      expect(location?.estanteria).toBe('D');
    });

    test('debe encontrar literatura colombiana', () => {
      const location = locator.findBookLocation('C863 G216CI');
      expect(location).not.toBeNull();
      expect(location?.mueble).toBe(2);
      expect(location?.cara).toBe('frontal');
      expect(location?.estanteria).toBe('A');
    });

    test('debe encontrar literatura costarricense', () => {
      const location = locator.findBookLocation('CR863 L318P7');
      expect(location).not.toBeNull();
      expect(location?.mueble).toBe(2);
      expect(location?.cara).toBe('trasera');
      expect(location?.estanteria).toBe('B');
    });

    test('debe retornar null para código no encontrado', () => {
      const location = locator.findBookLocation('999.999 Z999Z');
      expect(location).toBeNull();
    });

    test('debe retornar null para código inválido', () => {
      const location = locator.findBookLocation('INVALID CODE');
      expect(location).toBeNull();
    });
  });

  describe('findBookLocation - Búsqueda por diferentes niveles', () => {
    const locator = new BookLocator(sampleLibrary);

    test('debe buscar por nivel mueble', () => {
      const location = locator.findBookLocation('511.33 C823M', { level: 'mueble' });
      expect(location).not.toBeNull();
      expect(location?.mueble).toBe(1);
      expect(location?.estanteria).toBe('');
      expect(location?.anaquel).toBe(0);
    });

    test('debe buscar por nivel cara', () => {
      const location = locator.findBookLocation('511.33 C823M', { level: 'cara' });
      expect(location).not.toBeNull();
      expect(location?.mueble).toBe(1);
      expect(location?.cara).toBe('frontal');
      expect(location?.estanteria).toBe('');
      expect(location?.anaquel).toBe(0);
    });

    test('debe buscar por nivel estanteria', () => {
      const location = locator.findBookLocation('511.33 C823M', { level: 'estanteria' });
      expect(location).not.toBeNull();
      expect(location?.mueble).toBe(1);
      expect(location?.cara).toBe('frontal');
      expect(location?.estanteria).toBe('A');
      expect(location?.anaquel).toBe(0);
    });

    test('debe buscar por nivel anaquel (default)', () => {
      const location = locator.findBookLocation('511.33 C823M', { level: 'anaquel' });
      expect(location).not.toBeNull();
      expect(location?.anaquel).toBe(1);
    });
  });

  describe('findAll - Búsqueda de todas las ubicaciones', () => {
    const locator = new BookLocator(sampleLibrary);

    test('debe encontrar ubicación principal sin overflows', () => {
      const locations = locator.findAll('511.33 C823M', { includeOverflows: false });
      expect(locations.length).toBeGreaterThan(0);
      expect(locations[0].confidence).toBe('high');
    });

    test('debe encontrar ubicaciones con overflows', () => {
      const locations = locator.findAll('511.33 M500A', { includeOverflows: true });
      expect(locations.length).toBeGreaterThan(0);
      // Puede incluir ubicaciones de baja confianza
    });

    test('debe ordenar por confianza', () => {
      const locations = locator.findAll('511.33 C823M', { includeOverflows: true });
      if (locations.length > 1) {
        const confidenceOrder = ['high', 'medium', 'low'];
        for (let i = 0; i < locations.length - 1; i++) {
          const currentIndex = confidenceOrder.indexOf(locations[i].confidence);
          const nextIndex = confidenceOrder.indexOf(locations[i + 1].confidence);
          expect(currentIndex).toBeLessThanOrEqual(nextIndex);
        }
      }
    });

    test('debe retornar array vacío para código no encontrado', () => {
      const locations = locator.findAll('999.999 Z999Z');
      expect(locations).toEqual([]);
    });

    test('debe retornar array vacío para código inválido', () => {
      const locations = locator.findAll('INVALID');
      expect(locations).toEqual([]);
    });
  });

  describe('Casos especiales', () => {
    test('debe manejar biblioteca vacía', () => {
      const locator = new BookLocator(emptyLibrary);
      const location = locator.findBookLocation('511.33 C823M');
      expect(location).toBeNull();
    });

    test('debe manejar biblioteca simple', () => {
      const locator = new BookLocator(simplLibrary);
      const location = locator.findBookLocation('530 T595FI');
      expect(location).not.toBeNull();
      expect(location?.mueble).toBe(1);
    });

    test('debe manejar códigos con espacios extras', () => {
      const locator = new BookLocator(sampleLibrary);
      const location = locator.findBookLocation('511.33   C823M');
      expect(location).not.toBeNull();
    });

    test('debe manejar códigos con guiones', () => {
      const locator = new BookLocator(sampleLibrary);
      const location = locator.findBookLocation('511.33 C-823M');
      expect(location).not.toBeNull();
    });
  });
});

describe('Funciones helper', () => {
  describe('validateLibraryStructure', () => {
    test('debe validar biblioteca correcta', () => {
      const result = validateLibraryStructure(sampleLibrary);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('debe detectar biblioteca vacía', () => {
      const result = validateLibraryStructure(emptyLibrary);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('al menos un mueble');
    });

    test('debe detectar mueble sin caras', () => {
      const invalidLibrary = {
        muebles: [{
          id: 1,
          nombre: 'Test',
          range: {
            start: CodeParser.parse('500 A000A'),
            end: CodeParser.parse('599.999 Z999Z')
          },
          caras: []
        }]
      };
      const result = validateLibraryStructure(invalidLibrary);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('al menos una cara'))).toBe(true);
    });
  });

  describe('formatLocation', () => {
    test('debe formatear ubicación completa', () => {
      const location: BookLocation = {
        mueble: 1,
        cara: 'frontal' as const,
        estanteria: 'A',
        anaquel: 1,
        range: {
          start: CodeParser.parse('511.33 A000A'),
          end: CodeParser.parse('511.33 Z999Z')
        },
        confidence: 'high' as const
      };
      const formatted = formatLocation(location);
      expect(formatted).toContain('Mueble 1');
      expect(formatted).toContain('Cara frontal');
      expect(formatted).toContain('Estantería A');
      expect(formatted).toContain('Anaquel 1');
      expect(formatted).toContain('Confianza: high');
    });

    test('debe formatear ubicación sin anaquel', () => {
      const location: BookLocation = {
        mueble: 1,
        cara: 'frontal' as const,
        estanteria: 'A',
        anaquel: 0,
        range: {
          start: CodeParser.parse('511.33 A000A'),
          end: CodeParser.parse('511.33 Z999Z')
        },
        confidence: 'medium' as const
      };
      const formatted = formatLocation(location);
      expect(formatted).not.toContain('Anaquel');
    });
  });

  describe('formatParsedCode', () => {
    test('debe formatear código Dewey estándar', () => {
      const code = CodeParser.parse('511.33 C823M');
      const formatted = formatParsedCode(code);
      expect(formatted).toBe('511.33 C823M');
    });

    test('debe formatear código Dewey con edición', () => {
      const code = CodeParser.parse('530 T595FI2');
      const formatted = formatParsedCode(code);
      expect(formatted).toBe('530 T595FI2');
    });

    test('debe formatear código latinoamericano', () => {
      const code = CodeParser.parse('C863 G216CI');
      const formatted = formatParsedCode(code);
      expect(formatted).toBe('C863 G216CI');
    });

    test('debe formatear código latinoamericano con edición', () => {
      const code = CodeParser.parse('CR863 L318P7');
      const formatted = formatParsedCode(code);
      expect(formatted).toBe('CR863 L318P7');
    });
  });
});

describe('Casos de prueba del README', () => {
  const locator = new BookLocator(sampleLibrary);

  test('Ejemplo 1: Matemáticas - Mario Corrales', () => {
    const location = locator.findBookLocation('511.33 C823M');
    expect(location).not.toBeNull();
    expect(location?.confidence).toBe('high');
  });

  test('Ejemplo 2: Física - Paul A. Tipler', () => {
    const location = locator.findBookLocation('530 T595FI');
    expect(location).not.toBeNull();
  });

  test('Ejemplo 3: Cien años de soledad - Gabriel García Márquez', () => {
    const location = locator.findBookLocation('C863 G216CI');
    expect(location).not.toBeNull();
    expect(location?.mueble).toBe(2);
  });

  test('Ejemplo 4: Pantalones Cortos - Lara Rios', () => {
    const location = locator.findBookLocation('CR863 L318P7');
    expect(location).not.toBeNull();
    expect(location?.mueble).toBe(2);
  });

  test('Ejemplo 5: Código con guiones - 860 S-237M23', () => {
    const parsed = CodeParser.parse('860 S-237M23');
    expect(parsed.authorCutter).toBe('S237');
    expect(parsed.titleCutter).toBe('M');
    expect(parsed.editionNumber).toBe('23');
  });

  test('Ejemplo 6: Código con múltiples guiones - 863.3 C419-I-2', () => {
    const parsed = CodeParser.parse('863.3 C419-I-2');
    expect(parsed.authorCutter).toBe('C419');
    expect(parsed.titleCutter).toBe('I');
    expect(parsed.editionNumber).toBe('2');
  });
});
