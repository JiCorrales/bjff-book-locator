# BookLocator - Sistema de Localización de Libros

Sistema de localización de libros para la Biblioteca José Figueres Ferrer basado en el Sistema Decimal Dewey y códigos de Literatura Latinoamericana.

## Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Guía Rápida](#guía-rápida)
- [Conceptos Fundamentales](#conceptos-fundamentales)
- [API Reference](#api-reference)
- [Ejecutar Pruebas](#ejecutar-pruebas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Ejemplos de Uso](#ejemplos-de-uso)

## Requisitos

- **Node.js**: 18.x o superior
- **TypeScript**: 5.x
- **npm**: 9.x o superior

## Instalación

### 1. Instalar Node.js

Si no tienes Node.js instalado:

**Windows/macOS:**
- Descarga el instalador desde [nodejs.org](https://nodejs.org/)
- Ejecuta el instalador y sigue las instrucciones
- Verifica la instalación:
  ```bash
  node --version  # Debe mostrar v18.x.x o superior
  npm --version   # Debe mostrar 9.x.x o superior
  ```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Instalar Dependencias del Proyecto

Desde la raíz del backend:

```bash
cd backend
npm install
```

Esto instalará:
- TypeScript
- Jest (framework de pruebas)
- ts-jest (para ejecutar pruebas TypeScript)
- Tipos de TypeScript (@types/node, @types/jest)

## Guía Rápida

### Uso Básico

```typescript
import { BookLocator, CodeParser } from './utils/bookLocator';
import { sampleLibrary } from './utils/bookLocator/testData';

// 1. Crear instancia del localizador
const locator = new BookLocator(sampleLibrary);

// 2. Buscar un libro por su código
const location = locator.findBookLocation('511.33 C823M');

if (location) {
  console.log(`Mueble: ${location.mueble}`);
  console.log(`Cara: ${location.cara}`);
  console.log(`Estantería: ${location.estanteria}`);
  console.log(`Anaquel: ${location.anaquel}`);
  console.log(`Confianza: ${location.confidence}`);
}

// 3. Buscar todas las ubicaciones (incluyendo overflows)
const allLocations = locator.findAll('863.3 G216CI');
allLocations.forEach((loc, i) => {
  console.log(`Ubicación ${i + 1}: ${loc.mueble}/${loc.cara}/${loc.estanteria}/${loc.anaquel}`);
  console.log(`  Confianza: ${loc.confidence}`);
});
```

### Parsear Códigos Manualmente

```typescript
import { CodeParser } from './utils/bookLocator';

// Código Dewey estándar
const code1 = CodeParser.parse('511.33 C823M');
// {
//   type: "standard",
//   deweyPortion: "511.33",
//   authorCutter: "C823",
//   titleCutter: "M",
//   editionNumber: undefined
// }

// Código de Literatura Latinoamericana
const code2 = CodeParser.parse('CR863 L318P7');
// {
//   type: "latin_american",
//   countryCode: "CR",
//   deweyPortion: "863",
//   authorCutter: "L318",
//   titleCutter: "P",
//   editionNumber: "7"
// }

// Comparar códigos
const result = CodeParser.compare(code1, code2);
// -1 si code1 < code2, 0 si iguales, 1 si code1 > code2
```

## Conceptos Fundamentales

### Tipos de Códigos

#### 1. Código Dewey Estándar

Formato: `<dewey> <authorCutter><titleCutter>[edición]`

Ejemplos:
- `511.33 C823M` - Matemáticas, autor Corrales, título M
- `530 T595FI2` - Física, autor Tipler, título FI, edición 2

#### 2. Código de Literatura Latinoamericana

Formato: `<país><dewey> <authorCutter><titleCutter>[edición]`

Países válidos:
- `AR` (Argentina), `BO` (Bolivia), `C` (Colombia), `CH` (Chile), `CO` (Colombia)
- `CR` (Costa Rica), `CU` (Cuba), `EC` (Ecuador), `SV` (El Salvador)
- `GT` (Guatemala), `HN` (Honduras), `MX` (México), `NI` (Nicaragua)
- `PA` (Panamá), `PY` (Paraguay), `PE` (Perú), `PR` (Puerto Rico)
- `DO` (República Dominicana), `UY` (Uruguay), `VE` (Venezuela)

Ejemplos:
- `CR863 L318P7` - Costa Rica, literatura (863), autor Lara, título P, edición 7
- `C863 G216CI` - Colombia, literatura (863), autor García, título CI

### Estructura de la Biblioteca

```typescript
interface LibraryStructure {
  muebles: Mueble[];
}

interface Mueble {
  id: string;           // "M001", "M002"
  nombre: string;       // "Mueble 1"
  caras: Cara[];
}

interface Cara {
  id: string;           // "frontal", "trasera"
  nombre: string;       // "Cara Frontal"
  estanterias: Estanteria[];
}

interface Estanteria {
  id: string;           // "E001", "E002"
  numero: number;       // 1, 2, 3
  anaqueles: Anaquel[];
}

interface Anaquel {
  id: string;           // "A001", "A002"
  numero: number;       // 1, 2, 3
  start: ParsedCode;    // Código de inicio del rango
  end: ParsedCode;      // Código de fin del rango
}
```

### Algoritmo de Ordenación

Los códigos se ordenan de forma integrada respetando la jerarquía del Sistema Decimal Dewey:

1. **Dewey Decimal** (jerarquía numérica) - Prioridad máxima
2. **País** (alfabético) - Solo si Dewey igual. Standard < Latino
3. **Cutter de Autor** (números como decimales)
4. **Cutter de Título** (alfabético)
5. **Edición** (numérico)

#### Sistema Decimal Dewey (Jerárquico)

El Sistema Decimal Dewey organiza el conocimiento de forma jerárquica:

```
500     = Ciencias naturales y matemáticas
  510   = Matemáticas
    511 = Principios generales de las matemáticas
      511.3  = Lógica matemática
        511.33 = Tipos de lógica

Orden: 500 < 500.1 < 510 < 511 < 511.3 < 511.33
```

El sistema usa `parseFloat()` que respeta esta jerarquía correctamente:
- `500` → 500.0
- `500.1` → 500.1
- `510` → 510.0
- `511.3` → 511.3
- `511.33` → 511.33

####  Cutter como Decimal

Los números en los Cutters se tratan como decimales con el punto al inicio:

```
G5    = G.5    = 0.5
G50   = G.50   = 0.5    (¡IGUAL que G5!)
G501  = G.501  = 0.501  (Mayor que G50)
G51   = G.51   = 0.51   (Mayor que G501)
G6    = G.6    = 0.6    (Mayor que G51)

Orden: G5 = G50 < G501 < G51 < G6
```

**Nota importante:** Los Cutters como `A000c` no son válidos. El cutter de título debe tener al menos una letra mayúscula.

#### Ejemplo de Orden Completo

```
500 A000A          # Standard, Dewey 500
C500 A000A         # Latino (Colombia), Dewey 500
CR500 A000A        # Latino (Costa Rica), Dewey 500
501 A000A          # Standard, Dewey 501
863 G5CI           # G5 = G50 (0.5 = 0.50)
863 G50CI          # Igual que G5
863 G501CI         # 0.501 > 0.50
863 G51CI          # 0.51 > 0.501
863 G6CI           # 0.6 > 0.51
863 G216A          # Cien años... (primera obra con A)
863 G216C1         # Cien años... (edición 1)
863 G216C2         # Cien años... (edición 2)
```

### Detección de Overflows

Un libro puede estar en múltiples ubicaciones (overflow) si:
- Su código Dewey está dentro de ±1 del rango de otro anaquel
- Permite encontrar libros duplicados por espacio limitado

Niveles de confianza:
- **high**: Código dentro del rango exacto del anaquel
- **medium**: Código dentro del rango de la estantería (no anaquel específico)
- **low**: Overflow - código cerca del rango (diferencia Dewey < 1)

## API Reference

### CodeParser

#### `parse(code: string): ParsedCode`

Parsea un código de libro.

**Parámetros:**
- `code`: Código a parsear (puede contener espacios extras o guiones)

**Retorna:** Objeto `ParsedCode`

**Lanza:** `Error` si el formato es inválido

#### `compare(a: ParsedCode, b: ParsedCode): number`

Compara dos códigos.

**Retorna:** `-1` si a < b, `0` si a === b, `1` si a > b

#### `isInRange(code: ParsedCode, start: ParsedCode, end: ParsedCode): boolean`

Verifica si un código está dentro de un rango (inclusive).

### BookLocator

#### `constructor(library: LibraryStructure)`

Crea una instancia del localizador.

#### `findBookLocation(code: string, searchLevel?: SearchLevel): BookLocation | null`

Encuentra la ubicación más probable de un libro.

**Parámetros:**
- `code`: Código del libro
- `searchLevel`: 'anaquel' | 'estanteria' | 'cara' | 'mueble'

**Retorna:** `BookLocation` o `null`

#### `findAll(code: string, searchLevel?: SearchLevel): BookLocation[]`

Encuentra todas las ubicaciones posibles (incluyendo overflows).

**Retorna:** Array de `BookLocation` ordenado por confianza

### Funciones Helper

#### `validateLibraryStructure(library: LibraryStructure): ValidationResult`

Valida la estructura de la biblioteca.

#### `formatLocation(location: BookLocation): string`

Formatea ubicación como texto legible.

```typescript
const formatted = formatLocation(location);
// "Mueble 1 > Cara Frontal > Estantería 2 > Anaquel 3"
```

#### `formatParsedCode(code: ParsedCode): string`

Reconstruye el código original desde un `ParsedCode`.

## Ejecutar Pruebas

### Todas las Pruebas

Desde la raíz del backend:

```bash
npm test
```

### Solo Pruebas de BookLocator

```bash
npm run test:bookLocator
```

### Con Reporte de Cobertura

```bash
npm run test:coverage
```

Genera reporte HTML en `backend/coverage/index.html`

### Modo Watch

```bash
npm run test:watch
```

Ejecuta pruebas automáticamente al guardar cambios.

### Salida Esperada

```
Test Suites: 1 passed, 1 total
Tests:       76 passed, 76 total
Snapshots:   0 total
Time:        1.485 s
```

## Estructura del Proyecto

```
backend/
├── src/
│   └── utils/
│       └── bookLocator/
│           ├── types.ts              # Tipos TypeScript
│           ├── codeParser.ts         # Parser de códigos
│           ├── bookLocator.ts        # Lógica de localización
│           ├── testData.ts           # Datos de prueba
│           ├── bookLocator.test.ts   # Suite de pruebas (76 tests)
│           ├── index.ts              # Exports del módulo
│           └── README.md             # Este archivo
├── jest.config.js                    # Configuración Jest
├── tsconfig.json                     # Configuración TypeScript
└── package.json                      # Dependencias y scripts
```

## Ejemplos de Uso

### Ejemplo 1: Validar Estructura de Biblioteca

```typescript
import { validateLibraryStructure } from './utils/bookLocator';

const result = validateLibraryStructure(myLibrary);

if (!result.valid) {
  console.error('Errores:');
  result.errors.forEach(err => console.error(`- ${err}`));
} else {
  console.log('Biblioteca válida');
}
```

### Ejemplo 2: Buscar con Diferentes Niveles

```typescript
// Nivel anaquel (más específico)
const anaquel = locator.findBookLocation('511.33 C823M', 'anaquel');

// Nivel estantería
const estanteria = locator.findBookLocation('511.33 C823M', 'estanteria');

// Nivel mueble (más general)
const mueble = locator.findBookLocation('511.33 C823M', 'mueble');
```

### Ejemplo 3: Manejar Overflows

```typescript
const locations = locator.findAll('863.3 G216CI');

if (locations.length > 1) {
  const primary = locations.find(l => l.confidence === 'high');
  console.log(`Principal: ${formatLocation(primary)}`);

  const overflows = locations.filter(l => l.confidence === 'low');
  overflows.forEach(o => console.log(`Overflow: ${formatLocation(o)}`));
}
```

### Ejemplo 4: Normalización Automática

```typescript
// Todos se parsean correctamente:
CodeParser.parse('511.33 C823M');      // Standard
CodeParser.parse('511.33   C823M');    // Espacios extras
CodeParser.parse('511.33 C-823M');     // Con guion
CodeParser.parse('860 S-237M23');      // Guion + edición
CodeParser.parse('863.3 C419-I-2');    // Múltiples guiones
```

## TypeScript

### Ventajas

1. **Type Safety**: Errores en tiempo de compilación
2. **IntelliSense**: Autocompletado en editores
3. **Documentación**: Tipos auto-documentados
4. **Refactoring**: Más seguro

### Compilar a JavaScript

```bash
npm run build
```

Genera archivos en `backend/dist/`

### Configuración

El proyecto usa TypeScript estricto:
- `strict: true` - Chequeo estricto de tipos
- `esModuleInterop: true` - Compatibilidad ES6
- `sourceMap: true` - Mapas de fuente para debugging

## Solución de Problemas

### "Cannot find module 'typescript'"

```bash
cd backend
npm install
```

### "jest: command not found"

Usa `npm test` en lugar de ejecutar `jest` directamente.

### Pruebas fallan con errores de tipos

Verifica Node.js 18+ y dependencias instaladas:

```bash
node --version
npm install
```

### Código no se encuentra

Verifica:
1. Formato correcto (espacio entre Dewey y Cutter)
2. Código de país válido (si es latinoamericano)
3. El rango incluye ese código

## Integración de Códigos

El sistema **integra códigos Dewey estándar y Literatura Latinoamericana**:

```
Orden de prioridad:
1. Dewey (numérico) ← MÁS IMPORTANTE
2. País (alfabético, solo si Dewey igual) - standard < latino
3. Cutter autor (números como decimales: G5 = G50 < G501 < G51)
4. Cutter título (alfabético)
5. Edición (numérico)
```

**Ejemplo:**
```
500 A000A          (Standard)
C500 B000B         (Latino Colombia - standard va primero)
CR500 C000C        (Latino Costa Rica)
530 D000D          (Standard)
863 G5CI = G50CI   (Cutters iguales: 0.5 = 0.50)
863 G501CI         (0.501 > 0.50)
863 G51CI          (0.51 > 0.501)
```

## Casos de Prueba (76 Tests)

### CodeParser
- Parseo Dewey estándar y latinoamericano
- Normalización de espacios y guiones
- Validación de países latinoamericanos (20 códigos válidos)
- **Jerarquía Dewey**: 500 < 510 < 511 < 511.3 < 511.33 ✅
- Comparación y ordenamiento con Cutters decimales
- Pruebas específicas: G5 = G50 < G501 < G51 < G6
- Verificación de rangos

### BookLocator
- Búsqueda por niveles (mueble, cara, estantería, anaquel)
- Detección de overflows
- Sistema de confianza
- Casos especiales (biblioteca vacía, códigos inválidos)

### Helpers
- Validación de estructura
- Formateo de ubicaciones y códigos

## Autores

- Alexander Bonilla Figueroa
- Isaac Corrales Cascante

## Licencia

MIT
