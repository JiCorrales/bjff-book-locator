/**
 * =================================================================
 * SCRIPT DE BÚSQUEDA DE LIBROS
 * =================================================================
 *
 * Este script permite buscar la ubicación física de libros en la biblioteca
 * usando códigos de clasificación bibliográfica (Dewey o LATAM).
 *
 * Proceso:
 * 1. Recibe un código de clasificación (ej: "005.133 M152p2")
 * 2. Lo parsea usando el parser para generar la clave comparable
 * 3. Busca en la base de datos el estante correspondiente
 * 4. Muestra la ubicación física completa del libro
 *
 * Uso:
 *   npm run search-book
 *
 * =================================================================
 */

import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import { parseClassificationCode } from '../classificationParser/parser';

// Cargar variables de entorno
dotenv.config();

// ===================================================================
// INTERFAZ DE RESULTADO DE BÚSQUEDA
// ===================================================================

interface BookLocation {
  // Módulo
  module_id: number;
  module_name: string;
  module_range_start: string;
  module_range_end: string;
  module_type: string;
  module_number: number;

  // Cara/Parte del módulo
  module_part_id: number;
  face_name: string;
  face_range_start: string;
  face_range_end: string;

  // Unidad de estantería
  shelving_unit_id: number;
  unit_name: string;
  unit_range_start: string;
  unit_range_end: string;

  // Estante específico
  shelf_id: number;
  shelf_level: number;
  shelf_range_start: string;
  shelf_range_end: string;

  // Imagen del estante
  image_path: string | null;

  // Código buscado
  searched_code: string;
  searched_key: string;
}

// ===================================================================
// FUNCIÓN: searchBook
// ===================================================================
/**
 * Busca la ubicación física de un libro en la biblioteca
 *
 * @param code - Código de clasificación (Dewey o LATAM)
 * @returns Ubicación física del libro o null si no se encuentra
 *
 * @example
 * const location = await searchBook('005.133 M152p2');
 * if (location) {
 *   console.log(`Libro encontrado en: ${location.module_name}`);
 * }
 */
async function searchBook(code: string): Promise<BookLocation | null> {
  // Paso 1: Parsear el código para obtener la clave comparable
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 BÚSQUEDA DE LIBRO`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📖 Código a buscar: "${code}"`);

  let parsed;
  try {
    parsed = parseClassificationCode(code);
    console.log(`✅ Código parseado exitosamente`);
    console.log(`   Tipo: ${parsed.type}`);
    console.log(`   País: ${parsed.country}`);
    console.log(`   Clave comparable: ${parsed.comparableKey}`);
  } catch (error) {
    console.error(`❌ Error al parsear el código: ${error}`);
    return null;
  }

  // Paso 2: Conectar a la base de datos
  console.log(`\n🔌 Conectando a la base de datos...`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'bjff_book_locator'
  });

  console.log(`✅ Conectado a la base de datos`);

  try {
    // Paso 3: Ejecutar búsqueda usando STORED PROCEDURE (más eficiente)
    console.log(`\n🔎 Ejecutando búsqueda con Stored Procedure...`);
    console.log(`   📌 Ventaja: La DB procesa todo internamente (más rápido)`);

    // Llamar al stored procedure find_book_location
    // NOTA: Los SPs devuelven un array de arrays: [[resultados], metadata]
    const [results] = await connection.query<any[]>(
      'CALL find_book_location(?, ?)',
      [code, parsed.comparableKey]
    );

    // El primer elemento contiene los resultados del SELECT
    const rows = results[0] as any[];

    if (!rows || rows.length === 0) {
      console.log(`❌ No se encontró ubicación para el código "${code}"`);
      console.log(`   Clave buscada: ${parsed.comparableKey}`);
      return null;
    }

    const location = rows[0] as BookLocation;
    console.log(`✅ ¡Libro encontrado!`);

    // Paso 4: Mostrar resultado
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📍 UBICACIÓN FÍSICA DEL LIBRO`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\n🏢 MÓDULO:`);
    console.log(`   Nombre: ${location.module_name}`);
    console.log(`   Número: ${location.module_number}`);
    console.log(`   Tipo: ${location.module_type}`);
    console.log(`   Rango: ${location.module_range_start} - ${location.module_range_end}`);

    console.log(`\n📐 CARA DEL MÓDULO:`);
    console.log(`   Identificador: ${location.face_name}`);
    console.log(`   Rango: ${location.face_range_start} - ${location.face_range_end}`);

    console.log(`\n🗄️  UNIDAD DE ESTANTERÍA:`);
    console.log(`   Identificador: ${location.unit_name}`);
    console.log(`   Rango: ${location.unit_range_start} - ${location.unit_range_end}`);

    console.log(`\n📚 ESTANTE:`);
    console.log(`   Nivel: ${location.shelf_level}`);
    console.log(`   Rango: ${location.shelf_range_start} - ${location.shelf_range_end}`);

    console.log(`\n🖼️  IMAGEN DEL ESTANTE:`);
    if (location.image_path) {
      console.log(`   Ruta: ${location.image_path}`);
      console.log(`   URL: http://localhost:3000/images/${location.image_path.replace('output_final/', '')}`);
    } else {
      console.log(`   ⚠️  No hay imagen disponible para este estante`);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📌 RESUMEN:`);
    console.log(`   El libro con código "${code}" se encuentra en:`);
    console.log(`   → Módulo: ${location.module_name}`);
    console.log(`   → Cara: ${location.face_name}`);
    console.log(`   → Unidad: ${location.unit_name}`);
    console.log(`   → Estante nivel: ${location.shelf_level}`);
    if (location.image_path) {
      console.log(`   → Imagen: ${location.image_path}`);
    }
    console.log(`${'='.repeat(70)}\n`);

    return location;

  } finally {
    await connection.end();
    console.log(`🔌 Conexión cerrada\n`);
  }
}

// ===================================================================
// FUNCIÓN: testMultipleSearches
// ===================================================================
/**
 * Prueba múltiples búsquedas de libros con diferentes códigos
 * Útil para validar que el sistema funciona con diversos tipos de códigos
 */
async function testMultipleSearches() {
  console.log('\n');
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('║' + '  PRUEBAS DE BÚSQUEDA DE LIBROS - BJFF BOOK LOCATOR  '.padEnd(68) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');

  // ===================================================================
  // SUITE COMPLETA DE PRUEBAS
  // ===================================================================
  const testCodes = [
    // === MATEMÁTICAS (510-519) - Cara Front ===
    '510 A100a',        // #1  Límite inferior exacto
    '510.123 B200b',    // #2  Estante 1, Unidad A
    '510.5 M500c',      // #3  Estante 5, Unidad A
    '511.33 C823m',     // #4  Unidad C
    '512.5 F500f',      // #5  Unidad E
    '514.5 H500h',      // #6  Unidad H (última de front)

    // === MATEMÁTICAS (510-519) - Cara Back ===
    '515 A100a',        // #7  Límite inferior cara back
    '515.5 M500c',      // #8  Unidad A, cara back
    '517.5 E500e',      // #9  Unidad D
    '519.5 Z500z',      // #10 Unidad H, casi límite superior
    '519.999 Z999z',    // #11 Límite superior exacto

    // === FÍSICA (530-539) - Cara Front ===
    '530 A100a',        // #12 Límite inferior exacto
    '530.5 A500a',      // #13 Estante 5, Unidad A
    '532.5 D500d',      // #14 Unidad D
    '534.9 Z900z',      // #15 Final de cara front

    // === FÍSICA (530-539) - Cara Back ===
    '535 A100a',        // #16 Inicio cara back
    '535.5 M500c',      // #17 Unidad A
    '537.5 F500f',      // #18 Unidad D/E
    '539.5 Z500z',      // #19 Unidad H
    '539.999 Z999z',    // #20 Límite superior exacto

    // === CASOS LÍMITE (edge cases) ===
    '510.248 A100a',    // #21 Límite exacto entre estantes
    '515.624 A100a',    // #22 Límite exacto entre unidades
    '514.999 Z999z',    // #23 Límite exacto entre caras
    '519.368 A100a',    // #24 Inicio última unidad

    // === CASOS QUE NO DEBERÍAN ENCONTRARSE ===
    '509.999 Z999z',    // #25 Antes del primer módulo
    '520 A100a',        // #26 Gap entre módulos
    '529.999 Z999z',    // #27 Gap entre módulos
    '540 A100a',        // #28 Después del último módulo
  ];

  let foundCount = 0;
  let notFoundCount = 0;
  const notFoundCodes: string[] = [];

  let testNumber = 1;
  for (const code of testCodes) {
    console.log(`\n🔢 Test ${testNumber}/${testCodes.length}`);
    const result = await searchBook(code);
    if (result) {
      foundCount++;
    } else {
      notFoundCount++;
      notFoundCodes.push(code);
    }

    testNumber++;
    // Pausa breve entre búsquedas para mejor legibilidad
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Resumen final
  console.log('\n');
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('║' + '  RESUMEN COMPLETO DE PRUEBAS  '.padEnd(68) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');

  console.log(`\n  📊 ESTADÍSTICAS:`);
  console.log(`     Total de pruebas: ${testCodes.length}`);
  console.log(`     ✅ Encontrados: ${foundCount} (${((foundCount / testCodes.length) * 100).toFixed(1)}%)`);
  console.log(`     ❌ No encontrados: ${notFoundCount} (${((notFoundCount / testCodes.length) * 100).toFixed(1)}%)`);

  console.log(`\n  📈 DESGLOSE POR CATEGORÍA:`);
  console.log(`     • Matemáticas (510-519): ${testCodes.slice(0, 11).length} tests`);
  console.log(`     • Física (530-539): ${testCodes.slice(11, 20).length} tests`);
  console.log(`     • Casos límite: ${testCodes.slice(20, 24).length} tests`);
  console.log(`     • Casos negativos: ${testCodes.slice(24).length} tests (esperado: no encontrar)`);

  if (notFoundCodes.length > 0) {
    console.log(`\n  ⚠️  CÓDIGOS NO ENCONTRADOS:`);
    notFoundCodes.forEach((code, idx) => {
      const isExpected = testCodes.indexOf(code) >= 24; // Últimos 4 son esperados
      const marker = isExpected ? '✓ (esperado)' : '✗ (inesperado)';
      console.log(`     ${idx + 1}. "${code}" ${marker}`);
    });
  }

  const expectedNotFound = 4; // Últimos 4 tests deberían no encontrar
  const unexpectedNotFound = notFoundCodes.filter((code) =>
    testCodes.indexOf(code) < 24
  ).length;

  console.log(`\n  🎯 RESULTADO FINAL:`);
  if (unexpectedNotFound === 0 && notFoundCount === expectedNotFound) {
    console.log(`     ✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE`);
    console.log(`     ✅ Los ${expectedNotFound} casos negativos funcionaron como esperado`);
    console.log(`     ✅ Sistema funcionando al 100%`);
  } else {
    console.log(`     ⚠️  ATENCIÓN: ${unexpectedNotFound} búsquedas fallaron inesperadamente`);
    console.log(`     📊 Tasa de éxito real: ${(((foundCount + (expectedNotFound - unexpectedNotFound)) / testCodes.length) * 100).toFixed(1)}%`);
  }

  console.log('');
}

// ===================================================================
// EJECUCIÓN PRINCIPAL
// ===================================================================

async function main() {
  try {
    // Ejecutar pruebas múltiples
    await testMultipleSearches();

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente (no si se importa como módulo)
if (require.main === module) {
  main();
}

// Exportar funciones para uso en otros módulos
export { searchBook, testMultipleSearches };
