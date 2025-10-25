# 📚 BJFF Book Locator - Sistema de Búsqueda de Libros

## 📋 Tabla de Contenidos

1. [¿Qué es este proyecto?](#qué-es-este-proyecto)
2. [¿Cómo funciona?](#cómo-funciona)
3. [Guía de Inicio Rápido](#guía-de-inicio-rápido)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Scripts Disponibles](#scripts-disponibles)
6. [El Parser de Códigos](#el-parser-de-códigos)
7. [Sistema de Claves Comparables](#sistema-de-claves-comparables)
8. [Base de Datos](#base-de-datos)
9. [Stored Procedures](#stored-procedures)
10. [Pruebas y Validación](#pruebas-y-validación)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 ¿Qué es este proyecto?

El **BJFF Book Locator** es un sistema que permite **localizar libros físicos** en la biblioteca mediante su código de clasificación bibliográfica (Dewey o Literatura Latinoamericana).

### Problema que resuelve

Los códigos de clasificación bibliográfica tienen formatos variables y no se pueden comparar directamente como texto:

- `005.1` es igual a `005.10` y `005.100` (decimales equivalentes)
- `A3` es igual a `A30` y `A300` (sistema decimal implícito de Cutter)
- Comparar alfabéticamente `"510" > "52"` da resultado incorrecto

### Solución

Convertimos cada código en una **clave comparable de 22 caracteres** con formato fijo que permite:

✅ Comparación lexicográfica directa (byte a byte)
✅ Búsqueda de rangos eficiente en base de datos
✅ Normalización de variaciones equivalentes
✅ Ordenamiento correcto de estantes

---

## 🔄 ¿Cómo funciona?

### Flujo completo del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USUARIO BUSCA UN LIBRO                                       │
│    Ingresa código: "511.33 C823m"                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. PARSER PROCESA EL CÓDIGO                                     │
│    • Normaliza: "511.33 C823M" (mayúsculas)                     │
│    • Detecta tipo: DEWEY                                        │
│    • Extrae componentes: clase=511, decimal=330000, etc.        │
│    • Genera clave: "DAA511330000C823000M00"                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. BÚSQUEDA EN BASE DE DATOS (Stored Procedure)                 │
│    CALL find_book_location('511.33 C823m', 'DAA511330000...')   │
│                                                                  │
│    Compara: key_start <= clave <= key_end                       │
│    Encuentra: Estante que contiene el rango                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. RESULTADO: UBICACIÓN FÍSICA                                  │
│    📍 Módulo: Matemáticas (510-519)                             │
│    📍 Cara: front                                               │
│    📍 Unidad: C                                                 │
│    📍 Estante nivel: 1                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Guía de Inicio Rápido

### Prerrequisitos

1. **Node.js** 16+ instalado
2. **MySQL** 8+ instalado y corriendo
3. **Git** para clonar el repositorio

### Instalación

```bash
# 1. Navegar a la carpeta del backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env con:
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_DATABASE=bjff_book_locator
```

### Setup de Base de Datos

```bash
# 1. Crear la base de datos y tablas
mysql -u root -p < ../database/setup-complete.sql

# 2. Calcular claves comparables para todos los rangos
npm run db:update-keys

# 3. Crear stored procedures
npm run db:create-procedures
```

### Probar el Sistema

```bash
# Ejecutar suite completa de 28 pruebas
npm run search-book

# Resultado esperado:
# ✅ 24/24 búsquedas exitosas
# ✅ 4/4 casos negativos correctos
# ✅ Sistema funcionando al 100%
```

---

## 🏗️ Arquitectura del Sistema

### Estructura de Directorios

```
backend/
├── src/
│   ├── utils/
│   │   ├── README.md                    ← Este archivo
│   │   ├── classificationParser/
│   │   │   ├── parser.ts                ← Parser principal
│   │   │   └── test-similarity.ts       ← Tests de confiabilidad
│   │   └── database/
│   │       ├── update-comparable-keys.ts  ← Actualiza claves en DB
│   │       ├── create-procedures.ts       ← Crea stored procedures
│   │       └── search-book.ts            ← Búsqueda de libros (28 tests)
│   └── scripts/
│       ├── parser-demo.ts               ← Demo del parser
│       └── test-similarity.ts           ← Tests de similitud
├── package.json                         ← Scripts npm
├── tsconfig.json                        ← Config TypeScript
└── .env                                 ← Variables de entorno

database/
├── migrations/
│   ├── 001_create_library_structure.sql  ← Esquema de tablas
│   └── 002_create_search_procedures.sql  ← Stored procedures
├── seeds/
│   └── 001_insert_sample_data.sql        ← Datos de ejemplo
└── setup-complete.sql                    ← Script maestro
```

### Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|-----------|
| **TypeScript** | Lenguaje tipado para desarrollo seguro |
| **Node.js** | Runtime para ejecutar JavaScript/TypeScript en servidor |
| **ts-node** | Ejecuta TypeScript directamente sin compilar |
| **MySQL 8+** | Base de datos relacional con stored procedures |
| **mysql2** | Driver de MySQL para Node.js con soporte de Promises |
| **dotenv** | Gestión de variables de entorno |

---

## 📜 Scripts Disponibles

### 1. `npm run parser`

**Propósito:** Ejecuta el parser con 11 casos de prueba integrados.

**Qué hace:**
- Parsea códigos Dewey y LATAM
- Muestra el resultado detallado de cada conversión
- Valida que las claves generadas sean correctas

**Cuándo usar:** Para entender cómo funciona el parser o validar cambios.

**Ejemplo de salida:**
```
📚 Test 1: Literatura Costarricense
Input: "CR863 L318p7"
Clave comparable: LCR863000000L318000P07
Match: ✅
```

---

### 2. `npm run test-similarity`

**Propósito:** Verifica que códigos similares se ordenen correctamente.

**Qué hace:**
- Prueba variaciones de decimales (`005.1`, `005.10`, `005.100`)
- Prueba variaciones de Cutter (`A3`, `A30`, `A345`)
- Verifica ordenamiento lexicográfico

**Cuándo usar:** Para validar la confiabilidad del sistema de claves.

**Ejemplo de salida:**
```
✅ Orden preservado correctamente (8/8 tests)
✅ Diferencias mínimas detectables
```

---

### 3. `npm run db:update-keys`

**Propósito:** Calcula y actualiza las claves comparables en la base de datos.

**Qué hace:**
1. Conecta a MySQL
2. Lee todos los rangos (`range_start`, `range_end`) de 4 tablas:
   - Modules (2 registros)
   - Module_parts (4 registros)
   - Shelving_units (32 registros)
   - Shelves (160 registros)
3. Para cada rango, parsea los códigos y genera claves
4. Actualiza columnas `key_start` y `key_end`

**Cuándo usar:** Después de insertar/modificar rangos en la base de datos.

**Salida esperada:**
```
📊 Total de rangos a procesar: 198
✓ Modules #1: 510 A100a → DAA510000000A100000A00
✓ Modules #2: 530 A100a → DAA530000000A100000A00
...
✅ Proceso completado:
   • Exitosos: 198
   • Errores: 0
```

---

### 4. `npm run db:create-procedures`

**Propósito:** Crea los stored procedures en MySQL.

**Qué hace:**
1. Lee el archivo SQL de stored procedures
2. Procesa y limpia el SQL (remueve DELIMITER)
3. Crea 3 stored procedures:
   - `find_book_location` - Busca ubicación de un libro
   - `search_books_in_range` - Busca todos los estantes en un rango
   - `get_module_summary` - Resumen de todos los módulos

**Cuándo usar:** Una sola vez después del setup inicial, o si modificas los SPs.

**Salida esperada:**
```
⚙️  Creando: find_book_location...
   ✅ find_book_location creado exitosamente
⚙️  Creando: search_books_in_range...
   ✅ search_books_in_range creado exitosamente
⚙️  Creando: get_module_summary...
   ✅ get_module_summary creado exitosamente
```

---

### 5. `npm run search-book`

**Propósito:** Suite completa de 28 pruebas de búsqueda de libros.

**Qué hace:**
1. Ejecuta 28 búsquedas diferentes:
   - 11 tests en módulo de Matemáticas (510-519)
   - 9 tests en módulo de Física (530-539)
   - 4 tests de casos límite (bordes exactos)
   - 4 tests de casos negativos (códigos fuera de rango)
2. Usa stored procedures para búsquedas eficientes
3. Muestra ubicación física completa de cada libro
4. Genera reporte detallado con estadísticas

**Cuándo usar:** Para validar que todo el sistema funciona correctamente.

**Salida esperada:**
```
╔════════════════════════════════════════════════════════════════╗
║  RESUMEN COMPLETO DE PRUEBAS                                   ║
╚════════════════════════════════════════════════════════════════╝

📊 ESTADÍSTICAS:
   Total de pruebas: 28
   ✅ Encontrados: 24 (85.7%)
   ❌ No encontrados: 4 (14.3%)

🎯 RESULTADO FINAL:
   ✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE
   ✅ Los 4 casos negativos funcionaron como esperado
   ✅ Sistema funcionando al 100%
```

---

## 🔧 El Parser de Códigos

### Ubicación

[`backend/src/utils/classificationParser/parser.ts`](./classificationParser/parser.ts)

### Función Principal

```typescript
export function parseClassificationCode(input: string): ParsedCode
```

### Tipos de Códigos Soportados

#### 1. DEWEY (Decimal Dewey estándar)

**Formato:** `[0-9]{3}(\.[0-9]+)? [A-Z][0-9]+([A-Z][0-9]*)?`

**Ejemplos:**
- `005.133 M152p2` - Programación
- `581.4 E74A3` - Botánica
- `863.3 C419d25` - Literatura
- `005` - Solo clase (sin Cutter)

**Rango:** 000-999

#### 2. LATAM (Literatura Latinoamericana)

**Formato:** `[A-Z]{2}[0-9]{3}(\.[0-9]+)? [A-Z][0-9]+([A-Z][0-9]*)?`

**Ejemplos:**
- `CR863 L318p7` - Literatura Costarricense
- `CO863 G216CI` - Literatura Colombiana
- `AR861 B923p` - Literatura Argentina

**Países soportados (19):**
AR, BO, CH, CO, CR, CU, EC, SV, GT, HN, MX, NI, PA, PY, PE, PR, DO, UY, VE

### Algoritmo del Parser

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRADA: "511.33 C823m"                                          │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Normalización                                           │
│  • Trim espacios                                                │
│  • Convertir a mayúsculas: "511.33 C823M"                       │
│  • Normalización Unicode (NFKC)                                 │
│  • Colapsar espacios múltiples                                  │
│  • Eliminar guiones                                             │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Detección de Tipo                                       │
│  • ¿Comienza con 1-2 letras?                                    │
│    - Sí + prefijo válido → LATAM                                │
│    - No / prefijo inválido → DEWEY                              │
│  Resultado: DEWEY                                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Parseo Dewey                                            │
│  • Validar formato: /^\d{1,3}(\.\d+)?$/                         │
│  • Extraer clase: "511" → "511" (3 chars, pad izq.)             │
│  • Extraer decimales: "33" → "330000" (6 chars, pad der.)       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Parseo Cutter "C823M"                                   │
│  • Letra principal: "C"                                         │
│  • Decimal implícito: "823" → "823000" (padding a 6)            │
│  • Letra sufijo: "M"                                            │
│  • Número sufijo: (ninguno) → "00"                              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: Construcción de Clave (22 chars)                        │
│                                                                  │
│  D  AA  511  330000  C  823000  M  00                           │
│  │  │   │    │       │  │       │  │                            │
│  │  │   │    │       │  │       │  └─ CUT_NUM (2)              │
│  │  │   │    │       │  │       └──── CUT_LET (1)              │
│  │  │   │    │       │  └──────────── CUT_DEC (6)              │
│  │  │   │    │       └─────────────── CUT_MAIN (1)             │
│  │  │   │    └─────────────────────── DEC_DW (6)               │
│  │  │   └──────────────────────────── CLS (3)                  │
│  │  └──────────────────────────────── CC (2)                   │
│  └─────────────────────────────────── T (1)                    │
│                                                                  │
│  Resultado: "DAA511330000C823000M00"                            │
└─────────────────────────────────────────────────────────────────┘
```

### Ejemplos de Conversión

| Código Original | Tipo | Clave Comparable | Notas |
|----------------|------|------------------|-------|
| `005.133 M152p2` | DEWEY | `DAA005133000M152000P02` | Programación |
| `005.1 A3` | DEWEY | `DAA005100000A300000000` | Decimal implícito |
| `005.10 A30` | DEWEY | `DAA005100000A300000000` | Equivalente a anterior |
| `511.33 C823M` | DEWEY | `DAA511330000C823000M00` | Matemáticas |
| `CR863 L318p7` | LATAM | `LCR863000000L318000P07` | Literatura CR |
| `005` | DEWEY | `DAA0050000000000000000` | Solo clase |

---

## 🔑 Sistema de Claves Comparables

### Formato de 22 Caracteres

```
Posición | Campo    | Long | Descripción                      | Ejemplo
---------|----------|------|----------------------------------|--------
1        | T        | 1    | Tipo: 'D'=Dewey, 'L'=LATAM      | D
2-3      | CC       | 2    | País: 'AA'=Dewey, ISO-2=LATAM   | AA
4-6      | CLS      | 3    | Clase Dewey (000-999), padding  | 511
7-12     | DEC_DW   | 6    | Decimales Dewey, padding der.   | 330000
13       | CUT_MAIN | 1    | Letra principal del Cutter      | C
14-19    | CUT_DEC  | 6    | Decimal Cutter (implícito)      | 823000
20       | CUT_LET  | 1    | Letra sufijo del Cutter         | M
21-22    | CUT_NUM  | 2    | Número sufijo del Cutter        | 00
```

### Sistema Decimal Implícito de Cutter

Los números Cutter usan un sistema donde los dígitos representan decimales:

```
Cutter   →  Decimal  →  Padding (6 dígitos)
---------------------------------------------
A3       →  0.3      →  300000
A30      →  0.30     →  300000  (equivalente)
A345     →  0.345    →  345000
A3451    →  0.3451   →  345100
```

Esto asegura que:
- `A3` = `A30` = `A300` (mismo valor)
- `A3` < `A345` < `A3451` (orden correcto)

### Propiedades Garantizadas

✅ **Idempotencia:** Códigos equivalentes generan la misma clave
✅ **Orden:** Si A < B lógicamente → clave(A) < clave(B) lexicográficamente
✅ **Precisión:** Diferencias mínimas son detectables
✅ **Longitud fija:** Siempre 22 caracteres para comparación O(1)
✅ **ASCII:** Solo caracteres ASCII para compatibilidad máxima

---

## 💾 Base de Datos

### Esquema Jerárquico (4 niveles)

```
Modules (Módulos)
  │
  ├─→ Module_parts (Caras/Partes)
  │     │
  │     ├─→ Shelving_units (Unidades de Estantería)
  │     │     │
  │     │     └─→ Shelves (Estantes individuales)
```

### Estructura de Datos

```
📦 2 Módulos
  ├─ Módulo 1: Matemáticas (510-519)
  │   ├─ Cara front (510-514.999)
  │   │   ├─ 8 Unidades (A-H)
  │   │   │   └─ 5 Estantes cada una = 40 estantes
  │   └─ Cara back (515-519.999)
  │       ├─ 8 Unidades (A-H)
  │       │   └─ 5 Estantes cada una = 40 estantes
  │
  └─ Módulo 2: Física (530-539)
      ├─ Cara front (530-534.999)
      │   ├─ 8 Unidades (A-H)
      │   │   └─ 5 Estantes cada una = 40 estantes
      └─ Cara back (535-539.999)
          ├─ 8 Unidades (A-H)
          │   └─ 5 Estantes cada una = 40 estantes

TOTAL: 198 rangos (2+4+32+160)
```

### Tablas Principales

#### 1. Modules
```sql
CREATE TABLE Modules (
  module_id INT PRIMARY KEY AUTO_INCREMENT,
  module_name VARCHAR(60),
  module_number INT,
  range_start VARCHAR(30),     -- Ej: "510 A100a"
  range_end VARCHAR(30),       -- Ej: "519.999 Z999z"
  key_start CHAR(22) ascii_bin,  -- Clave comparable inicio
  key_end CHAR(22) ascii_bin,    -- Clave comparable fin
  module_type_id INT
);
```

#### 2. Module_parts (Caras)
```sql
CREATE TABLE Module_parts (
  module_part_id INT PRIMARY KEY AUTO_INCREMENT,
  part_name VARCHAR(60),       -- Ej: "front", "back"
  part_number INT,             -- 1, 2
  range_start VARCHAR(30),
  range_end VARCHAR(30),
  key_start CHAR(22) ascii_bin,
  key_end CHAR(22) ascii_bin,
  module_id INT
);
```

#### 3. Shelving_units (Unidades)
```sql
CREATE TABLE Shelving_units (
  shelving_unit_id INT PRIMARY KEY AUTO_INCREMENT,
  unit_name VARCHAR(60),       -- Ej: "A", "B", "C"
  unit_number INT,             -- 1-8
  range_start VARCHAR(30),
  range_end VARCHAR(30),
  key_start CHAR(22) ascii_bin,
  key_end CHAR(22) ascii_bin,
  module_part_id INT
);
```

#### 4. Shelves (Estantes)
```sql
CREATE TABLE Shelves (
  shelf_id INT PRIMARY KEY AUTO_INCREMENT,
  shelf_number INT,            -- Nivel: 1-5
  range_start VARCHAR(30),
  range_end VARCHAR(30),
  key_start CHAR(22) ascii_bin,
  key_end CHAR(22) ascii_bin,
  shelving_unit_id INT
);
```

### Collation: `ascii_bin`

**¿Por qué ascii_bin?**

- ✅ Comparación byte a byte (más rápida)
- ✅ Sin conversiones de caracteres
- ✅ Determinista
- ✅ Ideal para claves fijas ASCII

---

## 🔍 Stored Procedures

### 1. find_book_location

**Propósito:** Busca la ubicación física completa de un libro.

**Parámetros:**
- `p_classification_code` VARCHAR(30) - Código original
- `p_comparable_key` CHAR(22) - Clave comparable

**Retorna:** Un registro con toda la información de ubicación.

**Ejemplo de uso:**
```sql
CALL find_book_location('511.33 C823m', 'DAA511330000C823000M00');
```

**Resultado:**
```
module_name: Matemáticas (510-519)
module_number: 1
module_type: standard-double
face_name: front
unit_name: C
shelf_number: 1
shelf_range_start: 511.248 A100a
shelf_range_end: 511.371 Z999z
```

### 2. search_books_in_range

**Propósito:** Busca todos los estantes que contienen códigos dentro de un rango.

**Parámetros:**
- `p_start_key` CHAR(22) - Clave de inicio
- `p_end_key` CHAR(22) - Clave de fin

**Ejemplo de uso:**
```sql
-- Buscar todos los estantes de programación (005-006)
CALL search_books_in_range('DAA0050000000000000000', 'DAA0069999999999999Z99');
```

### 3. get_module_summary

**Propósito:** Obtiene un resumen de todos los módulos con estadísticas.

**Parámetros:** Ninguno

**Ejemplo de uso:**
```sql
CALL get_module_summary();
```

**Resultado:**
```
module_id | module_name           | total_faces | total_units | total_shelves
----------|----------------------|-------------|-------------|---------------
1         | Matemáticas (510-519) | 2           | 16          | 80
2         | Física (530-539)      | 2           | 16          | 80
```

### ¿Por qué usar Stored Procedures?

| Ventaja | Descripción |
|---------|-------------|
| **Eficiencia** | MySQL ejecuta todo internamente, sin overhead de red |
| **Performance** | Plan de ejecución cacheado y optimizado |
| **Menos código** | 2 líneas en lugar de 40+ líneas de SQL |
| **Reutilizable** | Otros servicios pueden llamar el mismo SP |
| **Mantenible** | Cambios en un solo lugar |
| **Seguro** | Protección contra SQL injection |

---

## ✅ Pruebas y Validación

### Suite de 28 Pruebas

La suite completa valida todos los aspectos del sistema:

#### Categoría 1: Matemáticas (11 tests)
- Límites inferiores y superiores exactos
- Diferentes unidades (A-H)
- Diferentes niveles de estante (1-5)
- Ambas caras (front/back)

#### Categoría 2: Física (9 tests)
- Similar a Matemáticas
- Valida el segundo módulo

#### Categoría 3: Casos Límite (4 tests)
- Límite exacto entre estantes
- Límite exacto entre unidades
- Límite exacto entre caras
- Inicio de última unidad

#### Categoría 4: Casos Negativos (4 tests)
- Antes del primer módulo
- Gaps entre módulos
- Después del último módulo

### Resultados Esperados

```
✅ 24/24 búsquedas válidas encontradas (100%)
✅ 4/4 casos negativos correctamente rechazados (100%)
✅ Sistema funcionando al 100%
```

---

## 🛠️ Troubleshooting

### Error: Access denied for user 'root'@'172.17.0.1'

**Causa:** MySQL está detrás de Docker/WSL y el usuario no tiene permisos desde esa IP.

**Solución:**
```sql
CREATE USER IF NOT EXISTS 'root'@'172.17.0.1' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON bjff_book_locator.* TO 'root'@'172.17.0.1';
FLUSH PRIVILEGES;
```

### Error: Cannot find module './parser'

**Causa:** Import path incorrecto.

**Solución:** Verificar rutas relativas:
```typescript
import { parseClassificationCode } from '../classificationParser/parser';
```

### Error: Unknown column 'module_type_name'

**Causa:** El schema cambió y el código usa nombres antiguos.

**Solución:** Verificar nombres correctos en schema:
- `Module_types.type_name` (no `module_type_name`)
- `Module_parts.part_name` (no `face_identifier`)
- `Shelving_units.unit_name` (no `unit_identifier`)
- `Shelves.shelf_number` (no `shelf_level`)

### Error: DELIMITER no funciona en Node.js

**Causa:** DELIMITER es sintaxis de MySQL CLI, no funciona en drivers.

**Solución:** El script `create-procedures.ts` ya maneja esto automáticamente.

---

## 📊 Resumen de Comandos

```bash
# Setup inicial (una vez)
npm install
mysql -u root -p < ../database/setup-complete.sql
npm run db:update-keys
npm run db:create-procedures

# Desarrollo
npm run parser              # Ver cómo funciona el parser
npm run test-similarity     # Validar confiabilidad

# Testing
npm run search-book         # Suite completa de 28 pruebas

# Mantenimiento
npm run db:update-keys      # Actualizar claves después de cambios
npm run db:create-procedures # Recrear SPs después de cambios
```

---

## 🎓 Para Aprender Más

- **Parser:** Lee [`parser.ts`](./classificationParser/parser.ts) - Código bien comentado
- **Claves:** Ejecuta `npm run test-similarity` y observa los resultados
- **Base de Datos:** Revisa [`001_create_library_structure.sql`](../../../database/migrations/001_create_library_structure.sql)
- **Búsqueda:** Estudia [`search-book.ts`](./database/search-book.ts)

---
