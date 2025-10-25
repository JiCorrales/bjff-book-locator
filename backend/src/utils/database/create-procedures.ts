/**
 * Script para crear los stored procedures en la base de datos
 */

import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function createProcedures() {
  console.log('🔧 Creando stored procedures en la base de datos...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'bjff_book_locator',
    multipleStatements: true  // Permitir múltiples statements
  });

  try {
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, '../../../../database/migrations/002_create_search_procedures.sql');
    let sql = fs.readFileSync(sqlFile, 'utf8');

    console.log(`📄 Leyendo archivo: ${sqlFile}`);
    console.log(`📏 Tamaño: ${sql.length} caracteres\n`);

    // Procesar el SQL: remover DELIMITER y separar los statements
    console.log('🔧 Procesando SQL (removiendo DELIMITER)...\n');

    // Remover todas las líneas DELIMITER
    sql = sql.replace(/DELIMITER.*/g, '');

    // Separar los procedimientos (dividir por $$)
    const procedures = sql
      .split('$$')
      .map(p => p.trim())
      .filter(p => p.length > 0 && !p.startsWith('--'));

    console.log(`📦 Encontrados ${procedures.length} procedimientos\n`);

    // Ejecutar cada procedimiento
    for (let i = 0; i < procedures.length; i++) {
      const proc = procedures[i];
      if (proc.includes('CREATE PROCEDURE')) {
        const procName = proc.match(/CREATE PROCEDURE\s+(\w+)/)?.[1] || `procedimiento ${i + 1}`;
        console.log(`⚙️  Creando: ${procName}...`);

        try {
          await connection.query(proc);
          console.log(`   ✅ ${procName} creado exitosamente`);
        } catch (error: any) {
          console.error(`   ❌ Error en ${procName}:`, error.message);
        }
      }
    }

    console.log('\n✅ Proceso completado\n');

  } catch (error) {
    console.error('❌ Error al crear stored procedures:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Conexión cerrada\n');
  }
}

createProcedures().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
