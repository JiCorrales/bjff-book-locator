/**
 * Script para actualizar las rutas de imágenes en la tabla Shelves
 * Asocia cada estante con su imagen correspondiente en output_final
 */

import * as mysql from 'mysql2/promise';

// Cargar variables de entorno
require('dotenv').config();

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
    // Verificar que la columna image_path existe
    console.log('🔍 Verificando que la columna image_path existe...');
    const [columns] = await connection.query<any[]>(
      `SHOW COLUMNS FROM Shelves LIKE 'image_path'`
    );

    if (columns.length === 0) {
      console.error('❌ Error: La columna image_path no existe en la tabla Shelves.');
      console.error('   Por favor, ejecuta primero: npm run db:migrate-images');
      process.exit(1);
    }

    console.log('✅ Columna image_path encontrada\n');

    // Obtener todos los shelves con sus datos de jerarquía
    console.log('📚 Obteniendo información de todos los estantes...');
    const [shelves] = await connection.query<any[]>(`
      SELECT
        s.shelf_id,
        s.shelf_number,
        su.unit_number,
        mp.part_name,
        m.module_number
      FROM Shelves s
      INNER JOIN Shelving_units su ON s.shelving_unit_id = su.shelving_unit_id
      INNER JOIN Module_parts mp ON su.module_part_id = mp.module_part_id
      INNER JOIN Modules m ON mp.module_id = m.module_id
      ORDER BY s.shelf_id
    `);

    console.log(`   ✓ ${shelves.length} estantes encontrados\n`);

    if (shelves.length === 0) {
      console.error('❌ No se encontraron estantes en la base de datos.');
      process.exit(1);
    }

    // Actualizar cada shelf con su ruta de imagen
    console.log('🔄 Actualizando rutas de imágenes...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const shelf of shelves) {
      try {
        const imagePath = `output_final/module${shelf.module_number}/${shelf.part_name}/s${shelf.unit_number}_r${shelf.shelf_number}.jpg`;

        await connection.query(
          `UPDATE Shelves SET image_path = ? WHERE shelf_id = ?`,
          [imagePath, shelf.shelf_id]
        );

        console.log(`✓ Shelf #${shelf.shelf_id}: ${imagePath}`);
        successCount++;

      } catch (error) {
        console.error(`✗ Error en Shelf #${shelf.shelf_id}: ${error}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Proceso completado:`);
    console.log(`   • Exitosos: ${successCount}`);
    console.log(`   • Errores: ${errorCount}`);
    console.log(`   • Total: ${shelves.length}`);
    console.log('='.repeat(80));

    // Verificar el resultado
    console.log('\n🔍 Verificando actualización...');
    const [count] = await connection.query<any[]>(
      `SELECT COUNT(*) as total, COUNT(image_path) as with_image FROM Shelves`
    );

    console.log(`\n📈 Estadísticas finales:`);
    console.log(`   Total de estantes: ${count[0].total}`);
    console.log(`   Con ruta de imagen: ${count[0].with_image}`);
    console.log(`   Sin ruta de imagen: ${count[0].total - count[0].with_image}`);

    // Mostrar algunos ejemplos
    console.log('\n📊 Ejemplos de rutas generadas:');
    const [examples] = await connection.query<any[]>(
      `SELECT shelf_id, range_start, range_end, image_path FROM Shelves LIMIT 5`
    );

    examples.forEach((ex: any) => {
      console.log(`\nShelf #${ex.shelf_id}:`);
      console.log(`  Rango: ${ex.range_start} - ${ex.range_end}`);
      console.log(`  Imagen: ${ex.image_path}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
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
