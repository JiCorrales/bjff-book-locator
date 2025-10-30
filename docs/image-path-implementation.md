# Image Path Implementation

## Resumen

Se ha implementado la asociación directa entre las búsquedas de códigos de clasificación y las imágenes de visualización de estantes en `output_final/`.

## Cambios Realizados

### 1. Migraciones de Base de Datos

#### Migración 003: Agregar columna `image_path`
- **Archivo**: `database/migrations/003_add_image_path_to_shelves.sql`
- **Cambios**:
  - Agrega columna `image_path VARCHAR(255)` a la tabla `Shelves`
  - Crea índice `idx_shelves_image_path` para búsquedas eficientes
  - Actualiza automáticamente todas las 160 filas existentes con sus rutas de imagen

#### Migración 004: Actualizar vista
- **Archivo**: `database/migrations/004_update_view_with_image_path.sql`
- **Cambios**:
  - Actualiza `vw_complete_structure` para incluir `shelf_image_path`
  - La vista ahora devuelve la ruta de imagen junto con toda la información de ubicación

### 2. Script de Aplicación

- **Archivo**: `backend/src/scripts/apply-image-path-migration.ts`
- **Propósito**: Aplica las migraciones de forma segura
- **Características**:
  - Verifica si la columna ya existe antes de aplicar
  - Ejecuta ambas migraciones en orden
  - Muestra estadísticas de verificación
  - Maneja errores de forma robusta

### 3. Comando NPM

```bash
npm run db:migrate-images
```

Este comando aplica las migraciones y muestra un reporte detallado.

## Convención de Nomenclatura de Imágenes

Las imágenes siguen esta estructura:

```
output_final/module{N}/{face}/s{unit}_r{shelf}.jpg
```

Donde:
- `{N}`: Número de módulo (1-2)
- `{face}`: Cara del módulo ("front" o "back")
- `{unit}`: Número de unidad (1-8, correspondiente a A-H)
- `{shelf}`: Número de estante (1-5, de arriba hacia abajo)

**Ejemplos**:
- `output_final/module1/front/s3_r2.jpg` → Módulo 1, frente, unidad 3, estante 2
- `output_final/module2/back/s8_r5.jpg` → Módulo 2, atrás, unidad 8, estante 5

## Uso en la Aplicación

### 1. Búsqueda de Libro

Cuando un usuario busca un código (ej: `510.2 A100a`), el sistema ahora puede:

1. **Parsear el código** → Clave comparable
2. **Buscar en BD** → Encontrar shelf_id
3. **Obtener ubicación completa** → Incluyendo `image_path`
4. **Devolver imagen** → Path directo a la visualización

### 2. Ejemplo de Query

```sql
-- Buscar un libro y obtener su imagen
SELECT
  shelf_id,
  location_text,
  shelf_range_start,
  shelf_range_end,
  shelf_image_path
FROM vw_complete_structure
WHERE shelf_key_start <= 'DAA510200000A100000000'
  AND shelf_key_end >= 'DAA510200000A100000000'
LIMIT 1;
```

Resultado:
```
shelf_id: 12
location_text: "Module 1 - front - Unit 3 - Shelf 2"
shelf_range_start: "510.0 A000a"
shelf_range_end: "510.5 Z999z"
shelf_image_path: "output_final/module1/front/s3_r2.jpg"
```

### 3. Uso en Stored Procedure

El stored procedure `find_book_location` puede ser actualizado para incluir el `image_path`:

```sql
SELECT
  s.shelf_id,
  s.range_start,
  s.range_end,
  s.image_path,  -- ← Nueva columna
  -- ... resto de campos
FROM Shelves s
-- ... resto de joins y condiciones
```

## Implementación en el Backend

### Actualizar el Stored Procedure (Opcional)

Si deseas modificar el stored procedure existente para que devuelva el `image_path`:

```sql
DROP PROCEDURE IF EXISTS find_book_location;
DELIMITER $$
CREATE PROCEDURE find_book_location(
  IN p_code VARCHAR(30),
  IN p_comparable_key CHAR(22)
)
BEGIN
  SELECT
    s.shelf_id,
    s.range_start,
    s.range_end,
    s.image_path,
    -- ... resto de campos
  FROM Shelves s
  -- ... resto del procedimiento
END$$
DELIMITER ;
```

### Actualizar la Respuesta del API

En tu endpoint de búsqueda (cuando lo implementes):

```typescript
// backend/src/controllers/search.controller.ts
interface BookLocationResponse {
  shelf_id: number;
  range_start: string;
  range_end: string;
  image_path: string;  // ← Nueva propiedad
  location: {
    module: number;
    face: string;
    unit: string;
    shelf: number;
  };
}
```

### Servir las Imágenes

Configura Express para servir archivos estáticos:

```typescript
// backend/src/server.ts (cuando lo crees)
import express from 'express';
import path from 'path';

const app = express();

// Servir imágenes estáticas
app.use('/images', express.static(path.join(__dirname, '../../output_final')));

// El frontend puede acceder a: http://localhost:3000/images/module1/front/s3_r2.jpg
```

## Frontend: Mostrar la Imagen

En el componente Angular:

```typescript
// frontend/src/app/components/book-location/book-location.component.ts
export class BookLocationComponent {
  imageUrl: string;

  onSearchResult(result: BookLocationResponse) {
    // Convertir el path relativo a URL absoluta
    this.imageUrl = `http://localhost:3000/images/${result.image_path.replace('output_final/', '')}`;
  }
}
```

```html
<!-- book-location.component.html -->
<div *ngIf="imageUrl">
  <h3>Ubicación del libro:</h3>
  <img [src]="imageUrl" alt="Estante" class="shelf-visualization" />
  <p>{{ location }}</p>
</div>
```

## Verificación

### 1. Aplicar la Migración

```bash
cd backend
npm run db:migrate-images
```

### 2. Verificar en la Base de Datos

```sql
-- Ver algunos ejemplos
SELECT shelf_id, range_start, range_end, image_path
FROM Shelves
LIMIT 10;

-- Contar estantes con imagen
SELECT
  COUNT(*) as total,
  COUNT(image_path) as con_imagen
FROM Shelves;
```

### 3. Probar la Vista

```sql
SELECT * FROM vw_complete_structure LIMIT 5;
```

## Notas Técnicas

1. **Path Relativo**: Las rutas se almacenan como paths relativos desde la raíz del proyecto
2. **Validación**: Se recomienda agregar validación para verificar que el archivo existe
3. **Caché**: Considera agregar caché HTTP para las imágenes
4. **CDN**: Para producción, considera subir las imágenes a un CDN

## Próximos Pasos

1. ✅ Migración de BD completada
2. ⏳ Implementar endpoint API para búsqueda con imagen
3. ⏳ Configurar servidor de archivos estáticos
4. ⏳ Actualizar frontend para mostrar imágenes
5. ⏳ Agregar manejo de imágenes faltantes (404)

## Archivos Modificados/Creados

- `database/migrations/003_add_image_path_to_shelves.sql`
- `database/migrations/004_update_view_with_image_path.sql`
- `backend/src/scripts/apply-image-path-migration.ts`
- `backend/package.json` (agregado script `db:migrate-images`)
- `backend/tsconfig.json` (corregido configuración de módulos)
- `docs/image-path-implementation.md` (este archivo)

## Resolución de Problemas

### Las imágenes no se cargan
- Verifica que la carpeta `output_final/` existe
- Confirma que los nombres de archivo coinciden exactamente
- Revisa los permisos de lectura de archivos

### La migración falla
- Verifica la conexión a la base de datos (`.env`)
- Confirma que todas las tablas existen
- Revisa que los datos de `module_number`, `unit_number`, etc. son correctos

### Path incorrecto en la BD
```sql
-- Verificar el formato
SELECT DISTINCT image_path FROM Shelves LIMIT 20;

-- Si es necesario recalcular
UPDATE Shelves s
INNER JOIN Shelving_units su ON s.shelving_unit_id = su.shelving_unit_id
INNER JOIN Module_parts mp ON su.module_part_id = mp.module_part_id
INNER JOIN Modules m ON mp.module_id = m.module_id
SET s.image_path = CONCAT(
    'output_final/module', m.module_number, '/',
    mp.part_name, '/s', su.unit_number, '_r', s.shelf_number, '.jpg'
);
```
