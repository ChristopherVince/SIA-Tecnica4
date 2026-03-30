# TODO List - SIA Técnica 4

Este documento registra las tareas pendientes divididas en fases lógicas, basándose en la arquitectura actual, los requisitos de diseño y los objetivos establecidos para el Sistema de Información Administrativa.

## 🎯 Prioridad Inmediata: Demo Cliente (Mañana)

- [x] Autenticación con Firebase mediante correo/contraseña.
- [x] Control de acceso básico y redirección automática por rol.
- [x] Validaciones de formularios en el Login para prevenir peticiones innecesarias.
- [x] Componente `DashboardHeader` reutilizable con modal de Logout.
- [x] Panel principal de Dirección (`DireccionDashboard`) 100% funcional con datos hardcodeados.
- [x] Modal de estudiante interactivo con 8 pestañas operativas.
- [x] Implementación de 3 grados y 11 grupos mockeados (aprox. 990 registros).
- [x] Búsqueda en tiempo real por nombre de estudiante o matrícula FIA.
- [x] Archivos `.md` de proyecto creados: `PRD.md`, `tech_stack.md`, `design_doc.md`.

---

## 🛠️ Fase 2: Integración Real con Firebase (Post-Demo)

### Base de Datos Firestore
- [ ] Mapear la estructura de datos del archivo `students-data.js` a las reglas de colecciones de Cloud Firestore.
- [ ] Crear la colección raíz `usuarios` en Firestore y definir su estructura y constraints.
- [ ] Crear la colección raíz `informacion_alumnos`.
- [ ] Población inicial base: Subir lote de alumnos reales a Firestore garantizando estructura en 8 categorías (datos, acudientes, calif., acuerdo_convivencia, etc).

### Migración del Dashboard Dirección
- [ ] Reemplazar llamadas a la data hardcodeada por consultas asíncronas con promesas de Firebase (`getDocs`, `query`, `where`).
- [ ] Implementar caché de estudiantes solicitados para evitar excesivas consultas a la base de datos de Firebase.
- [ ] Implementar un mecanismo de *"Lazy Loading"* o paginación si las consultas superan un número crítico de `documents`.

---

## 👥 Fase 3: Expansión y Nuevos Dashboards

- [ ] **Desarrollar vistas reales para Subdirección.** (Enfocado en asistencia y control operativo global).
- [ ] **Desarrollar vistas reales para Control Escolar.** (Altas/bajas y documentación con Firebase Storage).
- [ ] **Desarrollar vistas reales para Coordinaciones.** (Visualización de desempeño promedio de grupos).
- [ ] **Desarrollar vistas reales para Trabajo Social.** (Estudios de caso, seguimiento familiar intenso).
- [ ] **Desarrollar vistas reales para Prefectura.** (Panel ultra rápido optimizado para móvil para registrar reportes de conducta e historial disciplinario).
- [ ] Asegurar que el sistema de autorizaciones impide rutas cruzadas.

---

## 🎨 Fase 4: Optimización UI/UX, Seguridad y Features Extra

### Visuales
- [ ] Implementar Dark Mode basado en el sistema de tokens semánticos definido en el Design Doc.
- [ ] Convertir los "placeholders" de los nuevos dashboards a vistas que incluyan `Navbar` y `Layout` coherentes.
- [ ] Reestructurar estilos inline de Tailwind muy largos hacia componentes en `index.css` si repiten uso (ej. Badge de grados).

### Operacionales y Auditoría
- [ ] Incorporar Toast Notifications ("Acción Exitosa", "Error en Guardado") en transiciones y subidas.
- [ ] Implementar un registro (log) de qué usuario modificó que datos ("Creado por", "Última Edición").
- [ ] Desarrollar sistema de generación de reportes en PDF y exportación masiva a Excel.

### Seguridad
- [ ] Validar variables de entorno (`.env`) en despliegue.
- [ ] Limitar Rate y control de intentos en el endpoint de *Log in* para evitar ataques.
- [ ] Encriptación de datos sensibles de menores.