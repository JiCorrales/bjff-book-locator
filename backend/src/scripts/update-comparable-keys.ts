/**
 * Script para actualizar los códigos comparables en la base de datos
 * Lee todos los rangos (range_start, range_end) y calcula key_start y key_end
 */

import * as mysql from 'mysql2/promise';
import { parseClassificationCode } from '../utils/classificationParser/parser';

// Cargar variables de entorno
require('dotenv').config();

interface RangeRow {
  id: number;
  range_start: string;
  range_end: string;
  table: string;
}

async function main() {
  console.log('🔌 Conectando a la base de datos...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'bjff_book_locator'
  });

  console.log('✅ Conectado a la base de datos\n');

  try {
    // Array para almacenar todos los rangos de todas las tablas
    const allRanges: RangeRow[] = [];

    // 1. Extraer rangos de la tabla Modules
    console.log('📚 Extrayendo rangos de Modules...');
    const [modules] = await connection.query<any[]>(
      'SELECT module_id as id, range_start, range_end FROM Modules'
    );
    allRanges.push(...modules.map((m: any) => ({ ...m, table: 'Modules' })));
    console.log(`   ✓ ${modules.length} módulos encontrados`);

    // 2. Extraer rangos de la tabla Module_parts
    console.log('📚 Extrayendo rangos de Module_parts...');
    const [moduleParts] = await connection.query<any[]>(
      'SELECT module_part_id as id, range_start, range_end FROM Module_parts'
    );
    allRanges.push(...moduleParts.map((m: any) => ({ ...m, table: 'Module_parts' })));
    console.log(`   ✓ ${moduleParts.length} partes de módulo encontradas`);

    // 3. Extraer rangos de la tabla Shelving_units
    console.log('📚 Extrayendo rangos de Shelving_units...');
    const [shelvingUnits] = await connection.query<any[]>(
      'SELECT shelving_unit_id as id, range_start, range_end FROM Shelving_units'
    );
    allRanges.push(...shelvingUnits.map((m: any) => ({ ...m, table: 'Shelving_units' })));
    console.log(`   ✓ ${shelvingUnits.length} unidades de estantería encontradas`);

    // 4. Extraer rangos de la tabla Shelves
    console.log('📚 Extrayendo rangos de Shelves...');
    const [shelves] = await connection.query<any[]>(
      'SELECT shelf_id as id, range_start, range_end FROM Shelves'
    );
    allRanges.push(...shelves.map((m: any) => ({ ...m, table: 'Shelves' })));
    console.log(`   ✓ ${shelves.length} estantes encontrados`);

    console.log(`\n📊 Total de rangos a procesar: ${allRanges.length}\n`);

    // 5. Calcular códigos comparables y actualizar la base de datos
    console.log('🔄 Calculando códigos comparables y actualizando base de datos...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const range of allRanges) {
      try {
        // Parsear range_start y range_end
        const parsedStart = parseClassificationCode(range.range_start);
        const parsedEnd = parseClassificationCode(range.range_end);

        // Determinar el nombre de la columna ID según la tabla
        let idColumn: string;
        switch (range.table) {
          case 'Modules':
            idColumn = 'module_id';
            break;
          case 'Module_parts':
            idColumn = 'module_part_id';
            break;
          case 'Shelving_units':
            idColumn = 'shelving_unit_id';
            break;
          case 'Shelves':
            idColumn = 'shelf_id';
            break;
          default:
            throw new Error(`Tabla desconocida: ${range.table}`);
        }

        // Actualizar en la base de datos
        await connection.query(
          `UPDATE ${range.table}
           SET key_start = ?, key_end = ?
           WHERE ${idColumn} = ?`,
          [parsedStart.comparableKey, parsedEnd.comparableKey, range.id]
        );

        console.log(`✓ ${range.table} #${range.id}: ${range.range_start} → ${parsedStart.comparableKey} | ${range.range_end} → ${parsedEnd.comparableKey}`);
        successCount++;

      } catch (error) {
        console.error(`✗ Error en ${range.table} #${range.id}: ${error}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Proceso completado:`);
    console.log(`   • Exitosos: ${successCount}`);
    console.log(`   • Errores: ${errorCount}`);
    console.log(`   • Total: ${allRanges.length}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar el script
main().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
