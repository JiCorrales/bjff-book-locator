# 📚 BJFF Book Locator – Sistema de Localización de Libros

Repositorio del proyecto **BJFF Book Locator**, desarrollado como parte de la iniciativa de modernización de la **Biblioteca José Figueres Ferrer (TEC)**.  
Este sistema busca facilitar la búsqueda y localización de libros dentro de la biblioteca mediante un buscador en línea con soporte visual y chatbot integrado.

---

## 📌 Descripción del Proyecto
**BJFF Book Locator** permite:
- Consultar la ubicación de un libro a partir de su **código Dewey**.  
- Mostrar de manera visual el **mueble y estante** donde se ubica el ejemplar.  
- Ofrecer un **chatbot** de asistencia para resolver dudas básicas sobre la búsqueda y servicios de la biblioteca.  
- Brindar un **panel administrativo** para gestionar el catálogo y los rangos de códigos asignados a estantes.  
- Soportar diferentes roles de usuario:
  - **Lector** → búsqueda de libros sin necesidad de registro.  
  - **Asistente** → apoyo operativo a los administradores.  
  - **Administrador** → configuración de rangos, gestión del catálogo y control del sistema.  

---

## 📂 Contenido del Repositorio
- **/docs** → Documentación del proyecto:
  - Minutas de reuniones.  
  - Especificación de Requerimientos de Software (ERS).  
  - Diagramas UML, de contexto y de arquitectura.  
- **/backend** → Código fuente del servidor (API REST).  
- **/frontend** → Aplicación web para la búsqueda y panel administrativo.  
- **/database** → Scripts SQL para:
  - Creación de tablas.  
  - Inserción de datos iniciales (catálogo de ejemplo, estantes).  
  - Procedimientos almacenados y vistas.  
- **/postman_tests** → Colección de pruebas de Postman para validar los endpoints de la API.  
- **/infra** → Archivos de despliegue (Docker, Kubernetes, CI/CD).  
- **README.md** → Este archivo con instrucciones.  

---

## ⚙️ Requisitos
- **MySQL** 15+ (base de datos principal).  
- **Node.js + Express** (para el backend).  
- **Angular** (para el frontend).  
- **Postman** (para pruebas de la API).  
- **Docker/Kubernetes** (para despliegue en infraestructura del TEC).  

---

## 🚀 Estado Actual
- [x] Documentación inicial (minutas y ERS).
- [x] **Modelado de base de datos** (esquema completo con claves comparables).
- [x] **Parser de códigos de clasificación** (Dewey y LATAM).
- [x] **Sistema de claves comparables** de 22 caracteres.
- [x] **Scripts de población de base de datos** (2 módulos, 160 estantes).
- [x] **Stored procedures** para búsqueda de libros.
- [x] **Script de prueba de búsquedas** (6/6 exitosas, 100% tasa de éxito).
- [ ] Desarrollo del backend (API REST).
- [ ] Desarrollo del frontend (buscador + panel admin).
- [ ] Integración chatbot.
- [ ] Despliegue en servidores del TEC.

---

## ✨ Nuevas Características Implementadas

### 🔍 Sistema de Claves Comparables
El corazón del sistema es un parser que convierte códigos bibliográficos variables en **claves de longitud fija** para búsquedas eficientes:

- **Parser TypeScript** con 11 tests integrados (100% passing)
- Soporta **Dewey estándar** (000-999) y **Literatura Latinoamericana** (19 países)
- Claves de **22 caracteres** optimizadas para comparación lexicográfica byte-a-byte
- **Sistema decimal implícito** de Cutter para ordenamiento preciso
- Normalización Unicode (NFKC) para consistencia

**Ejemplo de conversión:**
```
Input:  "005.133 M152p2"
Output: "DAA005133000M152000P02"
         │  │  │   │      │ │      │ │
         │  │  │   │      │ │      │ └─ Sufijo numérico (02)
         │  │  │   │      │ │      └─── Sufijo letra (P)
         │  │  │   │      │ └────────── Decimal Cutter (152000)
         │  │  │   │      └──────────── Letra Cutter (M)
         │  │  │   └─────────────────── Decimales Dewey (133000)
         │  │  └───────────────────────Clase Dewey (005)
         │  └──────────────────────────── País (AA=Dewey)
         └─────────────────────────────── Tipo (D=Dewey, L=LATAM)
```

### 🗄️ Base de Datos
Esquema MySQL 8+ con arquitectura jerárquica de 4 niveles:

1. **Modules** (Módulos) → 2 registros
2. **Module_parts** (Caras) → 4 registros (2 por módulo)
3. **Shelving_units** (Unidades) → 32 registros (8 por cara: A-H)
4. **Shelves** (Estantes) → 160 registros (5 por unidad)

**Total: 198 rangos** con claves comparables calculadas automáticamente.

**Características:**
- Colación `ascii_bin` en claves para comparaciones byte-a-byte
- Stored procedures para búsqueda eficiente
- Índices optimizados en rangos de claves
- Constraints para validar orden de rangos

### 🛠️ Scripts Funcionales

Ejecutar desde `backend/`:

```bash
# Tests del parser (11/11 passing)
npm run parser

# Verificar confiabilidad de claves similares (8/8 passing)
npm run test-similarity

# Calcular claves comparables para todos los rangos en DB
npm run db:update-keys
# → Resultado: 198 rangos actualizados (100% exitosos)

# Probar búsqueda de libros
npm run search-book
# → Resultado: 6/6 búsquedas exitosas (100% tasa de éxito)
```

### 📚 Documentación Completa

- **README principal**: Este archivo
- **README de utils**: [`backend/src/utils/README.md`](backend/src/utils/README.md)
  - Explicación detallada del formato de 22 caracteres
  - Anatomía de la clave comparable con tabla
  - Guía de uso con ejemplos
  - Troubleshooting y arquitectura
  - 11 ejemplos de conversión

### 🎯 Resultados de Pruebas

**Parser:**
- 11/11 tests pasando ✅
- Códigos reales probados: Programación, Botánica, Literatura

**Búsquedas:**
- 6/6 libros encontrados ✅
- Tasa de éxito: **100%**
- Tiempo promedio de búsqueda: < 10ms

**Base de Datos:**
- 198 rangos actualizados ✅
- 0 errores en cálculo de claves
- Búsquedas lexicográficas funcionando correctamente

---

📚 Disponible en otros idiomas:  
- [English](./README.en.md)  
- [Deutsch](./README.de.md)  

---
