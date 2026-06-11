# SIA Técnica 4 — Sistema de Información Administrativa

![Estado](https://img.shields.io/badge/Estado-Activo-brightgreen)
![React](https://img.shields.io/badge/React-19-61dafb)
![Vite](https://img.shields.io/badge/Vite-6-646cff)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38b2ac)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Hosting-FFCA28)

Sistema web de gestión escolar desarrollado a la medida para la **Escuela Secundaria Técnica Industrial No. 4**. Cubre los procesos administrativos del área de Control Escolar y los diferentes roles del plantel, con acceso segmentado por función y turno.

---

## Módulos implementados

### Control Escolar
- **Inscripciones** — Registro, búsqueda y gestión de alumnos por grado y grupo. Importación masiva desde CSV/Excel. Visualización completa de expediente por alumno.
- **Procesos Varios** — Altas, bajas, cambios de grupo y reinscripciones.
- **Asignación de Taller** — Asignación masiva o individual del taller tecnológico por grupo.
- **Evaluación de Bloque** — Captura de calificaciones por bloque (trimestral) para todo el grupo en una sola pantalla. Guardado parcial con detección de cambios.
- **Reportes** — Generación de PDFs: reporte de matrícula, listados de alumnos y boletas de calificaciones (2 por hoja A4). Resaltado automático de calificaciones reprobatorias.
- **Reportes de Bloque** — Concentrados de calificaciones por grupo exportables en PDF, con promedios por columna y marcado visual de reprobados.

### Otros roles
Vistas de inicio personalizadas para Dirección, Subdirección, Coordinaciones, Prefectura y Trabajo Social, con acceso únicamente a la información relevante para cada función.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite |
| Estilos | Tailwind CSS v4 + Google Material Symbols |
| Base de datos | Cloud Firestore |
| Autenticación | Firebase Authentication |
| Hosting | Firebase Hosting |
| PDFs | @react-pdf/renderer |
| Routing | React Router v7 |

---

## Arquitectura general

La aplicación es una SPA con autenticación basada en roles (RBAC). Cada usuario tiene un `rol` y un `turno` asignados en Firestore, lo que determina qué vistas y datos puede ver. El acceso a rutas y módulos está protegido tanto en el frontend como a nivel de reglas de Firestore.

Los datos de alumnos se almacenan en la colección `alumnos` con subcolecciones por ciclo escolar para calificaciones. Las consultas siempre filtran por `grado + grupo` para minimizar lecturas en el plan gratuito de Firebase.

El proyecto mantiene dos entornos separados de Firebase (desarrollo y producción) controlados mediante variables de entorno de Vite, lo que permite probar cambios sin afectar los datos reales del plantel.

---

## Instalación y desarrollo local

### Requisitos
- Node.js 18+
- Cuenta de Firebase con un proyecto configurado (Firestore + Authentication)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd SIA-Tecnica_4

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crea .env.development con las credenciales de tu proyecto Firebase de desarrollo:
```

```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx
```

```bash
# 4. Levantar el servidor de desarrollo
npm run dev
```

Para producción se usa un archivo `.env.production` con las credenciales del proyecto productivo. Ambos están excluidos del repositorio.

### Build y despliegue

```bash
npm run build
firebase deploy
```

---

## Notas de desarrollo

El proyecto fue construido con un enfoque iterativo, apoyándome en herramientas de inteligencia artificial como asistente técnico durante el proceso. Eso me permitió avanzar rápido sin perder el control del código ni de las decisiones de diseño — cada módulo lo revisé, probé y ajusté antes de darlo por terminado. El resultado es un sistema que conozco de cabo a rabo.

---

## Estructura del proyecto (simplificada)

```
src/
├── components/
│   ├── control-escolar/     # Módulos de Control Escolar
│   ├── layout/              # Sidebar, topbar, shell de la app
│   └── reports/             # Componentes PDF (@react-pdf/renderer)
├── config/
│   ├── firebase.js          # Inicialización de Firebase
│   └── sidebarMenuConfig.js # Configuración de menú por rol
├── context/
│   └── AuthContext.jsx      # Contexto global de autenticación
├── pages/
│   ├── Dashboard.jsx        # Shell principal con router de módulos
│   └── role-dashboards/     # Vistas de inicio por rol
└── utils/                   # Helpers de reportes y utilidades
```
