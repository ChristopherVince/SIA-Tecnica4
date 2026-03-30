# SIA Técnica 4 - Sistema de Información Administrativa

![Estado](https://img.shields.io/badge/Estado-En%20Desarrollo%20(Fase%201)-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Vite](https://img.shields.io/badge/Vite-8.0-646cff)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38b2ac)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28)

**SIA Técnica 4** es una plataforma web desarrollada a la medida para la gestión de alumnos, expedientes y control administrativo para la Escuela Secundaria Técnica 4. Cuenta con un sistema escalable basado en roles (RBAC) y un enfoque de diseño inspirado en Material Design 3.

## 🚀 Características Principales

*   **Autenticación por Roles:** Acceso segmentado para Dirección, Subdirección, Control Escolar, Trabajo Social, etc. mediante Firebase Auth.
*   **Búsqueda y Filtros en Tiempo Real:** Filtros hiper-rápidos para buscar alumnos por grado, grupo, nombre o matrícula.
*   **Expediente Digital Centralizado:** Interfaz estilo modal con 8 pestañas detalladas por alumno (Generales, Familia, Docs, FIA, Conducta, Calificaciones, etc.).
*   **Diseño Modular y Responsivo:** Construido con componentes re-usables y clases puras de Tailwind V4 para adaptarse a móviles, tablets y escritorio.

## 🛠️ Stack Tecnológico

*   **Frontend:** React 19, Vite
*   **Estilos:** Tailwind CSS v4, Google Material Symbols
*   **Backend as a Service:** Firebase (Auth, Cloud Firestore)
*   **Routing:** React Router v7 con rutas protegidas (`ProtectedRoute`)

## 📂 Arquitectura de Documentación

El proyecto se guía fuertemente bajo un método de *AI-Assisted Vibe Coding*. La documentación de arquitectura, base de datos y diseño se encuentra centralizada en:
*   `/vibe_coding_checlist/PRD.md` - Documento de Requisitos de Producto.
*   `/vibe_coding_checlist/design_doc.md` - Guías de diseño, paleta de colores y componentes.
*   `/vibe_coding_checlist/tech_stack.md` - Elección tecnológica y estrategias.
*   `/vibe_coding_checlist/todo.md` - Mapa de ruta y tareas pendientes por fases.

## ⚙️ Instalación y Desarrollo LocaL

1. Clonar el repositorio:
   ```bash
   git clone <url-de-tu-repo>
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Variables de entorno (Firebase):
   Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales (basadas en `src/config/firebase.js`).

4. Ejecutar entorno de desarrollo:
   ```bash
   npm run dev
   ```
