# 📚 BJFF Book Locator – System zur Lokalisierung von Büchern

Repository des Projekts **BJFF Book Locator**, entwickelt im Rahmen der Modernisierungsinitiative der **Bibliothek José Figueres Ferrer (TEC)**.  
Dieses System soll die Suche und Lokalisierung von Büchern in der Bibliothek durch ein Online-Suchwerkzeug mit visueller Unterstützung und integriertem Chatbot erleichtern.

---

## 📌 Projektbeschreibung
**BJFF Book Locator** ermöglicht:
- Abfrage des Buchstandorts anhand des **Dewey-Codes**.  
- Visuelle Anzeige des **Regals und Möbelstücks**, in dem sich das Buch befindet.  
- Einen integrierten **Chatbot**, um grundlegende Fragen zur Suche und zu Bibliotheksdiensten zu beantworten.  
- Ein **Administrationspanel** zur Verwaltung des Katalogs und der Regalcodes.  
- Unterstützung verschiedener Benutzerrollen:
  - **Leser** → Buchsuche ohne Registrierung.  
  - **Assistent** → operative Unterstützung für Administratoren.  
  - **Administrator** → Konfiguration von Bereichen, Katalogverwaltung und Systemkontrolle.  

---

## 📂 Repository-Inhalt
- **/docs** → Projektdokumentation:
  - Sitzungsprotokolle.  
  - Software-Anforderungsspezifikation (SRS).  
  - UML-, Kontext- und Architekturdiagramme.  
- **/backend** → Quellcode des Servers (REST API).  
- **/frontend** → Webanwendung für Suche und Administrationspanel.  
- **/database** → SQL-Skripte für:
  - Tabellenerstellung.  
  - Einfügen von Anfangsdaten (Beispielkatalog, Regale).  
  - Stored Procedures und Views.  
- **/postman_tests** → Postman-Sammlung zur Validierung der API-Endpunkte.  
- **/infra** → Deploy-Dateien (Docker, Kubernetes, CI/CD).  
- **README.md** → Diese Datei mit Anleitungen.  

---

## ⚙️ Anforderungen
- **MySQL** 15+ (Hauptdatenbank).  
- **Node.js + Express** (für das Backend).  
- **Angular** (für das Frontend).  
- **Postman** (für API-Tests).  
- **Docker/Kubernetes** (für Deployment in der TEC-Infrastruktur).  

---

## 🚀 Aktueller Stand
- [x] Erste Dokumentation (Protokolle und SRS).  
- [ ] Datenbankmodellierung (Diagramme und Skripte).  
- [ ] Backend-Entwicklung (REST API).  
- [ ] Frontend-Entwicklung (Suchfunktion + Administrationspanel).  
- [ ] Chatbot-Integration.  
- [ ] Deployment auf TEC-Servern.  

---

📚 Verfügbar in anderen Sprachen:  
- [Español](./README.md)  
- [English](./README.en.md)  
