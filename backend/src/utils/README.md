# Utils - BJFF Book Locator

Guia practica para entender el parser de clasificacion, como se integra con la base de datos y como ejecutar los scripts en Node + TypeScript.

## Vision General

Objetivo del proyecto: localizar libros en estantes fisicos usando sus codigos de clasificacion (Dewey o Literatura Latinoamericana). Para comparar y buscar eficientemente, convertimos cada codigo en una clave comparable de 22 caracteres con formato fijo que se ordena lexicograficamente.

Pipeline basico:
- Usuario ingresa un codigo (ej: `511.33 C823M` o `CR863 L318P7`).
- El parser lo normaliza, valida y genera una clave comparable.
- En base de datos, los rangos de cada estante se guardan como dos claves (`key_start`, `key_end`).
- Buscar se reduce a comparar strings: `key_start <= clave <= key_end`.

## Tecnologias

- Node.js: runtime de JavaScript en servidor.
- TypeScript: superset tipado de JavaScript (archivos `.ts`).
- ts-node: ejecuta TypeScript directamente sin compilar a `.js`.

Comandos utiles:
- `npx ts-node archivo.ts` ejecuta un archivo TS.
- Este repo ya define scripts en `package.json` para facilitar.

## Estructura del backend

```
backend/
  package.json                 # scripts npm
  tsconfig.json                # configuracion TypeScript
  src/
    utils/
      classificationParser/
        parser.ts             # parser principal (exporta parseClassificationCode)
    scripts/
      parser-demo.ts          # demo del parser (ejemplos de entrada/salida)
      test-similarity.ts      # pruebas de orden y similitud de claves
      update-comparable-keys.ts # calcula y escribe key_start/key_end en DB
```

Base de datos (carpeta `database/`):
- `migrations/001_create_library_structure.sql` crea tablas con columnas `key_start`/`key_end` (CHAR(22), ascii_bin).
- `seeds/001_insert_sample_data.sql` inserta datos de ejemplo.
- `setup-complete.sql` orquesta migracion + seeds.

## Parser: como funciona

Archivo: `backend/src/utils/classificationParser/parser.ts`.

Entrada: un string con el codigo de clasificacion. Ejemplos:
- Dewey: `005.133 M152p2`, `511.33 C823M`, `005` (solo clase)
- LATAM: `CR863 L318P7`, `C863 G216CI`

Salida: objeto con partes parseadas y `comparableKey` (22 chars), por ejemplo:
```
{
  raw: '511.33 C823M',
  normalized: '511.33 C823M',
  type: 'DEWEY',
  country: 'AA',
  deweyClass: '511',
  deweyDecimal: '330000',
  cutterMain: 'C',
  cutterDecimal: '823000',
  cutterSuffixLetter: 'M',
  cutterSuffixNumber: '00',
  comparableKey: 'DAA511330000C823000M00'
}
```

### Pasos del algoritmo

1) Normalizacion (`normalize`)
- trim, mayusculas (ej: `p7` -> `P7`)
- Unicode NFKC
- colapsa espacios repetidos
- elimina guiones (`S-237M23` -> `S237M23`)

2) Deteccion de tipo (`detectType`)
- Si comienza con 1-2 letras y esas letras son un pais LATAM valido, se trata como LATAM; si no, es DEWEY.

3) Parseo Dewey (`parseDewey`)
- Valida formato `^[0-9]{1,3}(\.[0-9]+)?$`.
- Clase (3 digitos, padding izquierda) y decimales (6 digitos, padding derecha).
- Cutter opcional: si existe, debe iniciar con letra.

4) Parseo LATAM (`parseLatam`)
- Extrae pais (1-2 letras), luego reaprovecha el parseo Dewey para el resto.

5) Parseo Cutter (`parseCutter`)
- Letra principal (1)
- Digitos consecutivos como decimal implicito (padding a 6)
- Letra sufijo (opcional) y numero sufijo (opcional; se toman los ultimos dos digitos)
- Si quedan caracteres sin consumir, se lanza error de formato.

6) Clave comparable (`buildComparableKey`)
- Concatena todos los campos a 22 chars exactos.
- Orden natural de strings coincide con el orden de estanteria.

7) Entrada principal (`parseClassificationCode`)
- Aplica pasos 1..6, valida prefijo LATAM si aparenta serlo, devuelve objeto y clave.

### Validaciones y errores

- Dewey invalido: ejemplos `511..33`, `A11`, `12A`.
- Cutter invalido: ejemplos `511 A-`, `511 23A` (no inicia con letra), restos inesperados.
- LATAM con pais invalido: ejemplos `ES863 ...`, `XX863 ...`.

## Scripts disponibles

Desde `backend/`:

```
npm run parser            # corre la demo del parser
npm run test-similarity   # imprime casos y comprueba orden lexicografico
npm run db:update-keys    # calcula key_start/key_end en DB para todos los rangos
```

Notas:
- `db:update-keys` usa variables de entorno de `backend/.env` (host, puerto, usuario, password, base de datos).
- Asegurate de tener la DB levantada y las tablas creadas (usa los scripts de `database/`).

## Variables de entorno (backend/.env)

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_DATABASE=bjff_book_locator
```

## Flujo con base de datos

1) Correr migracion + seed:
```
mysql -u root -p < database/setup-complete.sql
```
2) Generar claves comparables para todos los rangos:
```
cd backend
npm run db:update-keys
```
3) Consultar rangos por clave (ejemplo SQL):
```
SELECT * FROM Shelves
WHERE 'DAA511330000C823000M00' BETWEEN key_start AND key_end;
```

## Preguntas frecuentes

- Que pasa si el codigo no trae Cutter?
  - Se usa Cutter por defecto: letra '0', decimales '000000', sufijos '0' y '00'.

- Puedo soportar otros prefijos LATAM?
  - Si. Agrega el ISO-2 en la constante `LATAM_PREFIXES` del parser.

- Por que 22 caracteres?
  - Es un compromiso entre compacidad y separar cada componente con padding fijo para mantener el orden.