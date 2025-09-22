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
- [ ] Modelado de base de datos (diagramas y scripts).  
- [ ] Desarrollo del backend (API REST).  
- [ ] Desarrollo del frontend (buscador + panel admin).  
- [ ] Integración chatbot.  
- [ ] Despliegue en servidores del TEC.  

---

📚 Disponible en otros idiomas:  
- [English](./README.en.md)  
- [Deutsch](./README.de.md)  

---
