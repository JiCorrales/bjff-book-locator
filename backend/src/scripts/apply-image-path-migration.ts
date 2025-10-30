/**
 * Script para aplicar la migración de image_path a la tabla Shelves
 * Lee y ejecuta las migraciones 003 y 004
 */

import * as mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de entorno
require('dotenv').config();

async function main() {
  console.log('🔌 Conectando a la base de datos...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'bjff_book_locator',
    multipleStatements: true
  });

  console.log('✅ Conectado a la base de datos\n');

  try {
    // Paths to migration files
    const projectRoot = path.join(__dirname, '../../../');
    const migration003Path = path.join(projectRoot, 'database/migrations/003_add_image_path_to_shelves.sql');
    const migration004Path = path.join(projectRoot, 'database/migrations/004_update_view_with_image_path.sql');

    // Check if column already exists
    console.log('🔍 Verificando si la columna image_path ya existe...');
    const [columns] = await connection.query<any[]>(
      `SHOW COLUMNS FROM Shelves LIKE 'image_path'`
    );

    if (columns.length > 0) {
      console.log('⚠️  La columna image_path ya existe en la tabla Shelves.');
      console.log('   Saltando migración 003...\n');
    } else {
      // Apply migration 003
      console.log('📝 Aplicando migración 003: Agregar columna image_path...');
      const migration003SQL = fs.readFileSync(migration003Path, 'utf8');
      await connection.query(migration003SQL);
      console.log('✅ Migración 003 aplicada exitosamente\n');
    }

    // Apply migration 004
    console.log('📝 Aplicando migración 004: Actualizar vista con image_path...');
    const migration004SQL = fs.readFileSync(migration004Path, 'utf8');
    await connection.query(migration004SQL);
    console.log('✅ Migración 004 aplicada exitosamente\n');

    // Verify the changes
    console.log('🔍 Verificando los cambios...');
    const [shelves] = await connection.query<any[]>(
      `SELECT shelf_id, range_start, range_end, image_path
       FROM Shelves
       ORDER BY shelf_id
       LIMIT 10`
    );

    console.log('\n📊 Primeros 10 estantes con sus rutas de imagen:');
    console.log('='.repeat(80));
    shelves.forEach((shelf: any) => {
      console.log(`Shelf #${shelf.shelf_id}: ${shelf.range_start} - ${shelf.range_end}`);
      console.log(`  → ${shelf.image_path}`);
    });
    console.log('='.repeat(80));

    // Count shelves with images
    const [count] = await connection.query<any[]>(
      `SELECT COUNT(*) as total,
              COUNT(image_path) as with_image
       FROM Shelves`
    );

    console.log('\n📈 Estadísticas:');
    console.log(`   Total de estantes: ${count[0].total}`);
    console.log(`   Con ruta de imagen: ${count[0].with_image}`);
    console.log(`   Sin ruta de imagen: ${count[0].total - count[0].with_image}`);

    console.log('\n✅ ¡Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error al aplicar la migración:', error);
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
