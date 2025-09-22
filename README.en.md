# 📚 BJFF Book Locator – Library Book Localization System

Repository of the **BJFF Book Locator** project, developed as part of the modernization initiative of the **José Figueres Ferrer Library (TEC)**.  
This system aims to simplify the search and location of books within the library through an online search tool with visual support and an integrated chatbot.

---

## 📌 Project Description
**BJFF Book Locator** provides:
- Book location lookup using the **Dewey code**.  
- Visual display of the **shelf and furniture** where the book is located.  
- An integrated **chatbot** to answer basic questions about searches and library services.  
- An **administrative panel** to manage the catalog and code ranges assigned to shelves.  
- Support for different user roles:
  - **Reader** → search for books without registration.  
  - **Assistant** → operational support for administrators.  
  - **Administrator** → configuration of ranges, catalog management, and system control.  

---

## 📂 Repository Content
- **/docs** → Project documentation:
  - Meeting minutes.  
  - Software Requirements Specification (SRS).  
  - UML, context, and architecture diagrams.  
- **/backend** → Server source code (REST API).  
- **/frontend** → Web application for search and admin panel.  
- **/database** → SQL scripts for:
  - Table creation.  
  - Initial data insertion (example catalog, shelves).  
  - Stored procedures and views.  
- **/postman_tests** → Postman collection for API endpoint validation.  
- **/infra** → Deployment files (Docker, Kubernetes, CI/CD).  
- **README.md** → This file with instructions.  

---

## ⚙️ Requirements
- **MySQL** 15+ (main database).  
- **Node.js + Express** (for the backend).  
- **Angular** (for the frontend).  
- **Postman** (for API testing).  
- **Docker/Kubernetes** (for deployment on TEC infrastructure).  

---

## 🚀 Current Status
- [x] Initial documentation (minutes and SRS).  
- [ ] Database modeling (diagrams and scripts).  
- [ ] Backend development (REST API).  
- [ ] Frontend development (search + admin panel).  
- [ ] Chatbot integration.  
- [ ] Deployment on TEC servers.  

---

📚 Available in other languages:  
- [Español](./README.md)  
- [Deutsch](./README.de.md)  
