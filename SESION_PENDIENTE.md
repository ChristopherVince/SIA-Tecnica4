# Sesión pendiente — SIA Técnica 4

> Última sesión: 13 Jun 2026. Continuar por aquí mañana.

---

## Qué se hizo hoy

### 1. Reportes (General › Reportes) — Control Escolar
- **Alumnos repetidores**: se añadió el selector de **grado** como criterio obligatorio
  (antes solo pedía ciclo, ahora pide ciclo + grado). Archivos tocados:
  `ReportesView.jsx`, `reportesBloqueHelper.js`

### 2. Reporte "Calificaciones y Observaciones de Bloque" — Evaluación de Bloque
- Nuevo PDF **landscape A4** (`CalificacionesObservacionesPDF.jsx`)
- Columnas: # | ALUMNO | [materia C | O] × n | PROM | SOC EM | VIDA SAL
- C = calificación del bloque (de Firestore), O = columna en blanco para que el maestro escriba a mano
- SOC EM / VIDA SAL vienen de `areasCurriculares.educacionSocioemocional` y `areasCurriculares.autonomiaVidaSaludable`
- Escala de colores 4 tonos de rojo para calificaciones reprobatorias
- Wired en `ReportesBloqueModal.jsx` (caso `conc_cal_rec_grupo`) y `reportesBloqueHelper.js`

### 3. Panel de Trabajo Social — NUEVO módulo completo
- `TrabajoSocialDashboard.jsx` — reemplazado el placeholder
- `TrabajoSocialMenu.jsx` — hero con turno activo + accesos rápidos
- `Layout.jsx` — refactorizado para pasar `activeFunction` genéricamente a cualquier componente hijo (antes era hardcoded solo para `ControlEscolarMenu`)
- `sidebarMenuConfig.js` — menú completo para `trabajo_social` con 4 secciones

---

## Estructura del menú Trabajo Social

```
Inicio
Expedientes
  ├── Búsqueda de Alumnos        → ExpedientesView.jsx
  └── Fichas Médicas             → FichasMedicasView.jsx
Documentación
  ├── Control de Documentos      → ControlDocumentosView.jsx
  └── Solicitudes Digitales      → SolicitudesView.jsx
Seguimiento
  └── Citatorios y Reportes      → CitatoriosView.jsx
```

**Todas las vistas están en placeholder** (muestran descripción + "Próximamente").  
Carpeta: `src/components/trabajo-social/funcionalidades/`

---

## Arquitectura de datos decidida (Trabajo Social)

Subcollections bajo el CURP del alumno — NO colección separada:

```
alumnos/{curp}/
  trabajo_social/datos          → datos del tutor + información médica
  documentos/{cicloEscolar}     → 6 checkboxes de entrega de documentos
  expediente/{autoId}           → cada citatorio / reporte / incidente
```

**Documentos requeridos por alumno** (ya definidos en `ControlDocumentosView.jsx`):
1. Hoja de inscripción
2. INE del tutor
3. Comprobante de domicilio
4. CURP del alumno
5. Acuerdo de convivencia
6. Cuestionario socioeconómico

---

## Hoja de inscripción digital — plan acordado

- Ruta pública `/solicitud` en la misma app (sin auth)
- Flujo: tutor escanea QR → escribe CURP → llena datos → guarda en `solicitudes_inscripcion/{autoId}` con `estado: 'pendiente'`
- Trabajo Social ve y aprueba en el panel "Solicitudes Digitales"
- **No se construyó todavía** — es el plan para implementar

---

## Lo que falta construir (Trabajo Social)

Ir vista por vista. Orden sugerido:

| Vista | Prioridad | Qué hace |
|---|---|---|
| **Control de Documentos** | Alta | Tabla grado/grupo con checkboxes por alumno para los 6 docs |
| **Búsqueda de Alumnos / Expedientes** | Alta | Buscar por CURP/nombre → ver/editar tutor + ficha médica |
| **Citatorios y Reportes** | Media | Generar PDF de citatorio/reporte + guardar en historial del alumno |
| **Fichas Médicas** | Media | Formulario de datos médicos (alergias, enfermedades, medicamentos) |
| **Solicitudes Digitales** | Baja | Lista de pendientes del formulario online + aprobación |
| **Ruta pública `/solicitud`** | Baja | Formulario para padres (sin auth) |

---

## Estado general del proyecto

| Módulo | Estado |
|---|---|
| Control Escolar — Inscripciones | ✅ Funcional |
| Control Escolar — Evaluación de Bloque | ✅ Funcional |
| Control Escolar — Boletas | ✅ Funcional |
| Control Escolar — Reportes (todos los PDFs) | ✅ Funcional |
| Trabajo Social | 🔨 Estructura lista, vistas en placeholder |
| Dirección | ✅ Funcional (padrón + boletas) |
| Subdirección / Coordinaciones / Prefectura | 📋 Placeholder |
